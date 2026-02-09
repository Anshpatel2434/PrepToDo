
import {
	HiDocumentText,
	HiClock,
	HiChartBar,
	HiArrowTrendingUp,
	HiAdjustmentsHorizontal,
	HiSquares2X2
} from "react-icons/hi2";
import { ArrowRight } from "lucide-react";
import type { IconType } from "react-icons";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utility ---
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// --- Types ---
interface FeatureCardProps {
	title: string;
	philosophy: string;
	bullets: string[];
	ctaText: string;
	href: string;
	primaryIcon: IconType;
	secondaryIcon: IconType;
	delay?: number;
	isDark: boolean;
	colorTheme: "blue" | "violet" | "emerald";
	// Custom positioning props for that "pinned" random look
	primaryIconPosition?: string; // e.g. "-top-8 -right-8"
	secondaryIconPosition?: string; // e.g. "-bottom-6 -left-6"
	primaryIconSize?: string; // e.g. "w-20 h-20"
	secondaryIconSize?: string; // e.g. "w-12 h-12"
}

// --- Components ---

const FeatureCard = ({
	title,
	philosophy,
	bullets,
	ctaText,
	href,
	primaryIcon: PrimaryIcon,
	secondaryIcon: SecondaryIcon,
	delay = 0,
	isDark,
	colorTheme,
	primaryIconPosition = "-top-12 -right-10",
	secondaryIconPosition = "bottom-8 -right-8", // Changed default to avoid clustering
	primaryIconSize = "w-16 h-16",
	secondaryIconSize = "w-10 h-10"
}: FeatureCardProps) => {
	const navigate = useNavigate();

	// Theme map for pure glyph colors
	const themeStyles = {
		blue: {
			primary: isDark ? "text-blue-500" : "text-blue-600",
			secondary: isDark ? "text-blue-400" : "text-blue-400",
			bgHover: isDark ? "hover:bg-blue-500/5 hover:border-blue-500/20" : "hover:bg-blue-50 hover:border-blue-200",
			pill: isDark ? "bg-blue-500/10 text-blue-300" : "bg-blue-100 text-blue-700"
		},
		violet: {
			primary: isDark ? "text-violet-500" : "text-violet-600",
			secondary: isDark ? "text-violet-400" : "text-violet-400",
			bgHover: isDark ? "hover:bg-violet-500/5 hover:border-violet-500/20" : "hover:bg-violet-50 hover:border-violet-200",
			pill: isDark ? "bg-violet-500/10 text-violet-300" : "bg-violet-100 text-violet-700"
		},
		emerald: {
			primary: isDark ? "text-emerald-500" : "text-emerald-600",
			secondary: isDark ? "text-emerald-400" : "text-emerald-400",
			bgHover: isDark ? "hover:bg-emerald-500/5 hover:border-emerald-500/20" : "hover:bg-emerald-50 hover:border-emerald-200",
			pill: isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-100 text-emerald-700"
		}
	};

	const currentTheme = themeStyles[colorTheme];

	// Ambient Float Animation
	const floatAnim = {
		y: [0, -8, 0],
		transition: {
			duration: 6,
			repeat: Infinity,
			ease: "easeInOut" as const
		}
	};

	const floatAnimDelayed = {
		y: [0, -6, 0],
		transition: {
			duration: 7,
			delay: 1,
			repeat: Infinity,
			ease: "easeInOut" as const
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-10%" }}
			transition={{ duration: 0.6, delay, ease: "easeOut" }}
			className="relative group h-full"
		>
			{/* 
        PINNED ARTIFACTS (Pure Glyphs)
        No background containers. Just the icons.
        Z-index high to overlap the card.
        Pointer events none to avoid blocking clicks.
      */}
			<div className="absolute inset-0 z-20 pointer-events-none select-none overflow-visible">

				{/* Primary Icon - Anchored to a corner */}
				<motion.div
					animate={floatAnim}
					className={cn(
						"absolute transition-colors duration-500",
						primaryIconPosition,
						currentTheme.primary
					)}
				>
					{/* Drop shadow on the icon itself for depth without container */}
					<PrimaryIcon
						className={cn(
							primaryIconSize,
							"drop-shadow-lg opacity-100"
						)}
					/>
				</motion.div>

				{/* Secondary Icon - Anchored elsewhere */}
				<motion.div
					animate={floatAnimDelayed}
					className={cn(
						"absolute transition-colors duration-500",
						secondaryIconPosition,
						currentTheme.secondary
					)}
				>
					<SecondaryIcon
						className={cn(
							secondaryIconSize,
							"drop-shadow-md opacity-80"
						)}
					/>
				</motion.div>
			</div>

			{/* 
        CARD SURFACE 
        Clean, minimal, focusing on content.
      */}
			<div
				onClick={() => navigate(href)}
				className={cn(
					"h-full flex flex-col p-8 rounded-[2rem] border transition-all duration-300 cursor-pointer overflow-hidden relative z-10",
					isDark
						? "bg-card/40 border-white/5"
						: "bg-white border-black/5 hover:shadow-xl hover:shadow-black/5",
					currentTheme.bgHover
				)}
			>
				{/* Header */}
				<div className="mb-8 relative z-10">
					{/* Philosophy Tag - Top aligned */}
					<div className={cn(
						"inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
						currentTheme.pill
					)}>
						{philosophy}
					</div>

					<h3 className={cn(
						"text-3xl font-bold mb-2 tracking-tight leading-tight",
						isDark ? "text-white" : "text-gray-900"
					)}>
						{title}
					</h3>
				</div>

				{/* Structured Bullets */}
				<ul className="space-y-4 mb-10 flex-grow relative z-10">
					{bullets.map((bullet, idx) => (
						<li key={idx} className="flex items-start gap-3">
							<span className={cn(
								"mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300",
								isDark ? "bg-white/20 group-hover:bg-white/40" : "bg-black/20 group-hover:bg-black/40"
							)} />
							<span className={cn(
								"text-[16px] leading-relaxed font-medium",
								isDark ? "text-gray-400 group-hover:text-gray-300" : "text-gray-600 group-hover:text-gray-800"
							)}>
								{bullet}
							</span>
						</li>
					))}
				</ul>

				{/* CTA - Text Link Style */}
				<div className={cn(
					"flex items-center gap-2 text-[15px] font-semibold transition-all duration-300 relative z-10 mt-auto",
					currentTheme.primary,
					"group-hover:translate-x-1"
				)}>
					{ctaText}
					<ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
				</div>
			</div>
		</motion.div>
	);
};


// --- Main Section ---

export const FeatureShowcase = ({ isDark }: { isDark: boolean }) => {
	return (
		<section className="relative w-full py-24 lg:py-40 overflow-visible">
			<div className="container mx-auto px-6 max-w-[1320px]">
				{/* 
            Grid Layout 
            overflow-visible is crucial here to let icons escape the cards 
         */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 relative">

					{/* Card 1: Daily Practice */}
					<FeatureCard
						title="Daily Practice"
						philosophy="Consistent Habit"
						bullets={[
							"One common article used daily for RC and VA questions.",
							"Read the article, solve questions, and track your daily performance.",
							"Daily leaderboard and streaks to stay consistent."
						]}
						ctaText="View today's practice"
						href="/daily"
						primaryIcon={HiDocumentText}
						secondaryIcon={HiClock}
						isDark={isDark}
						colorTheme="emerald"
						delay={0}
						// Custom Positions: Top-Right & Bottom-Right
						primaryIconPosition="-top-12 -left-3"
						secondaryIconPosition="bottom-7 -right-4"
						primaryIconSize="w-20 h-20"
						secondaryIconSize="w-12 h-12"
					/>

					{/* Card 2: Analytics */}
					<FeatureCard
						title="Analytics"
						philosophy="Data Driven"
						bullets={[
							"See accuracy, streaks, and time spent.",
							"Identify weak areas like genre or different core metrics.",
							"Track improvement trends over time."
						]}
						ctaText="Explore your data"
						href="/dashboard"
						primaryIcon={HiChartBar}
						secondaryIcon={HiArrowTrendingUp}
						isDark={isDark}
						colorTheme="blue"
						delay={0.15}
						// Custom Positions: Top-Right & Top-Left (Offset)
						primaryIconPosition="bottom-4 -right-6"
						secondaryIconPosition="-top-3 -left-3"
						primaryIconSize="w-24 h-24"
						secondaryIconSize="w-12 h-12"
					/>

					{/* Card 3: Custom Sectionals */}
					<FeatureCard
						title="Customized Sectionals"
						philosophy="Targeted Growth"
						bullets={[
							"Create sectionals based on your weak topics and genres",
							"Filter by difficulty & topic",
							"Practice RC and VA in an exam-like format"
						]}
						ctaText="Create a sectional"
						href="/customized-mocks"
						primaryIcon={HiAdjustmentsHorizontal}
						secondaryIcon={HiSquares2X2}
						isDark={isDark}
						colorTheme="violet"
						delay={0.3}
						// Custom Positions: Top-Right & Bottom-Right (Lower)
						primaryIconPosition="-top-10 -left-6"
						secondaryIconPosition="bottom-20 -right-3"
						primaryIconSize="w-20 h-20"
						secondaryIconSize="w-14 h-14"
					/>

				</div>
			</div>
		</section>
	);
};
