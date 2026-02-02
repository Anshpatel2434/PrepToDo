// React import removed as not used in new JSX transform
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Images
import dailyPageDark from "../../../assets/daily_page_dark.jpg";
import dailyPageLight from "../../../assets/daily_page_light.jpg";
import customized_sectional_light from "../../../assets/customized_sectional_light.jpg";
import customized_sectional_dark from "../../../assets/customized_sectional_dark.jpg";
import dashboard_feature_light from "../../../assets/dashboard_feature_light.jpg";
import dashboard_feature_dark from "../../../assets/dashboard_feature_dark.jpg";

// --- Utility ---
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// --- Components ---

interface BrowserProps {
	imgLight: string;
	imgDark: string;
	isDark: boolean;
	className?: string;
	blobColor: string;
}

const BrowserWindow = ({
	imgLight,
	imgDark,
	isDark,
	className,
	blobColor
}: BrowserProps) => {
	return (
		<div className={cn("group relative", className)}>
			{/* BLOB - Restrained Abstraction */}
			{/* Absolute positioning: 30px offsets, 108% size */}
			<div
				className="absolute top-[30px] left-[30px] w-[108%] h-[108%] rounded-full -z-10 transition-all duration-600 ease-out will-change-transform"
				style={{
					backgroundColor: blobColor,
					opacity: 0.18,
					filter: "blur(90px)"
				}}
			>
				{/* Hover state for blob handles via CSS for performance/simplicity or generic group-hover */}
				<div className="w-full h-full rounded-full transition-all duration-600 ease-out group-hover:scale-112 group-hover:opacity-100 group-hover:blur-[110px]" />
			</div>

			{/* BROWSER CONTAINER */}
			<div
				className={cn(
					"w-full rounded transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform",
					"group-hover:-translate-y-1.5",
					isDark ? "shadow-[0_20px_40px_rgba(0,0,0,0.5)]" : "shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
				)}
			>
				{/* CHROME BAR - 40px */}
				<div className={cn(
					"h-10 w-full flex items-center px-4 gap-4 border-b rounded-t relative z-20",
					isDark ? "bg-[#1C1C1E] border-white/10" : "bg-[#F3F4F6] border-black/5"
				)}>
					{/* Traffic Lights */}
					<div className="flex gap-[6px]">
						<div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
						<div className="w-[10px] h-[10px] rounded-full bg-[#FFBD2E]" />
						<div className="w-[10px] h-[10px] rounded-full bg-[#28CA42]" />
					</div>

					{/* Address Bar */}
					<div className={cn(
						"h-[22px] w-[55%] rounded flex items-center px-2 gap-2",
						isDark ? "bg-white/10 text-gray-400" : "bg-white border border-black/5 text-gray-500"
					)}>
						{/* Lock Icon */}
						<div className="w-3 h-3 rounded-sm border border-current opacity-50" />
						{/* Fake URL */}
						<div className="text-[11px] tracking-wide opacity-45 select-none font-medium">preptodo.com</div>
					</div>
				</div>

				{/* CONTENT AREA */}
				<div className={cn(
					"relative w-full aspect-[16/10] p-1 rounded-b",
					isDark ? "bg-[#1C1C1E]" : "bg-[#F3F4F6]"
				)}>
					<img
						src={isDark ? imgDark : imgLight}
						alt="Feature Interface"
						className="w-full h-full object-cover rounded-sm"
					/>
				</div>
			</div>
		</div>
	)
}

const FeatureText = ({
	number,
	title,
	description,
	href,
	isDark,
	hasUnderline = false
}: {
	number: string;
	title: string;
	description: string;
	href: string;
	isDark: boolean;
	hasUnderline?: boolean;
}) => {
	const navigate = useNavigate();

	return (
		<div className="flex flex-col items-start">
			{/* Number Badge */}
			<div className={cn(
				"mb-6 px-3 py-1 rounded-[6px] text-[15px] font-semibold tracking-tight border",
				isDark
					? "bg-brand-primary-dark/10 text-brand-primary-dark border-brand-primary-dark/20"
					: "bg-brand-primary-light/10 text-brand-primary-light border-brand-primary-light/20"
			)}>
				{number}
			</div>

			{/* Title */}
			<h3 className={cn(
				"text-[28px] lg:text-[36px] font-bold leading-[1.15] mb-[18px] relative",
				isDark ? "text-white" : "text-gray-900"
			)}>
				{title}
				{hasUnderline && (
					<span className={cn(
						"absolute -bottom-[6px] left-0 h-[2px] w-[40%]",
						isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light"
					)} />
				)}
			</h3>

			{/* Description */}
			<p className={cn(
				"text-[16px] lg:text-[17px] leading-[1.65] mb-6 max-w-[480px]",
				isDark ? "text-gray-400" : "text-gray-600"
			)} style={{ letterSpacing: '0.002em' }}>
				{description}
			</p>

			{/* Link */}
			<button
				onClick={() => navigate(href)}
				className={cn(
					"group inline-flex items-center text-[15px] font-medium transition-colors duration-250",
					isDark ? "text-brand-primary-dark" : "text-brand-primary-light"
				)}
			>
				<span className="relative pb-[1px]">
					Learn more
					<span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-current transition-all duration-250 ease-out group-hover:w-full" />
				</span>
				<ArrowRight className="w-[14px] h-[14px] ml-1 transition-transform duration-250 group-hover:translate-x-[3px]" />
			</button>
		</div>
	)
}

// --- Main Component ---

export const FeatureShowcase = ({ isDark }: { isDark: boolean }) => {

	return (
		<section className="relative w-full pb-32 overflow-hidden" data-section="features">
			<div className="container mx-auto px-6 max-w-[1320px]">

				{/* --- FEATURE 1: MAGAZINE LAYOUT --- 
                    Text Left (45%), Image Right (48%), Gap 7%
                    Vertical Align: Top
                */}
				<div className="flex flex-col lg:flex-row gap-[7%] mb-[280px]">

					{/* Text Column - 45% */}
					<motion.div
						initial={{ opacity: 0, y: 40 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-15%" }}
						transition={{ duration: 0.7 }}
						className="lg:w-[45%] flex pt-8"
					>
						<FeatureText
							number="01"
							title="Daily Practice"
							description="Build a strong daily habit with focused VARC practice designed to improve comprehension, consistency, and exam readiness through structured repetition."
							href="/daily"
							isDark={isDark}
						/>
					</motion.div>

					{/* Image Column - 48% */}
					<motion.div
						initial={{ opacity: 0, y: 40 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-15%" }}
						transition={{ duration: 0.7, delay: 0.2 }}
						className="lg:w-[48%]"
					>
						<BrowserWindow
							imgLight={dailyPageLight}
							imgDark={dailyPageDark}
							isDark={isDark}
							blobColor={isDark ? "#10B981" : "#059669"} // Emerald
						/>
					</motion.div>
				</div>


				{/* --- FEATURE 2: INTERRUPTED LAYOUT --- 
                    Image Left (52%), Text Right (40%), Gap 8%
                    Vertical Align: Text starts 15% down from image top
                */}
				<div className="flex flex-col-reverse lg:flex-row gap-[8%] mb-[240px]">

					{/* Image Column - 52% */}
					<motion.div
						initial={{ opacity: 0, y: 40 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-15%" }}
						transition={{ duration: 0.7 }}
						className="lg:w-[52%]"
					>
						<BrowserWindow
							imgLight={customized_sectional_light}
							imgDark={customized_sectional_dark}
							isDark={isDark}
							blobColor={isDark ? "#8B5CF6" : "#7C3AED"} // Violet
						/>
					</motion.div>

					{/* Text Column - 40% (Top Offset) */}
					<motion.div
						initial={{ opacity: 0, y: 40 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-15%" }}
						transition={{ duration: 0.7, delay: 0.2 }}
						className="lg:w-[40%] flex pt-[15%]"
					>
						<FeatureText
							number="02"
							title="Adaptive Sectionals"
							description="Turn weak areas into strengths with sectional tests that focus your effort where it matters most, helping you improve accuracy and confidence."
							href="/customized-mocks"
							isDark={isDark}
							hasUnderline={true}
						/>
					</motion.div>
				</div>


				{/* --- FEATURE 3: OVERLAP LAYOUT --- 
                    Text Left (42%), Image Right (55%), Gap 3%
                    Visual: Image overlaps text space by 4% (negative margin logic or absolute positioning)
                    Actually, spec says "Image overlaps text column".
                    We can achieve this by making the container narrow so they naturally squeeze, or using -marginLeft on image.
                    Let's use -ml on image column to pull it left.
                */}
				<div className="flex flex-col lg:flex-row items-center lg:gap-[3%]">

					{/* Text Column - 42% */}
					<motion.div
						initial={{ opacity: 0, y: 40 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-15%" }}
						transition={{ duration: 0.7 }}
						className="lg:w-[42%] relative z-10 pointer-events-none lg:pointer-events-auto"
					>
						<FeatureText
							number="03"
							title="Deep Analytics"
							description="Understand not just what you got wrong, but why. Detailed insights help you correct thinking patterns and make lasting improvements."
							href="/dashboard"
							isDark={isDark}
						/>
					</motion.div>

					{/* Image Column - 55% with Fade
                        Pull left by 4% relative to container width to create overlap.
                    */}
					<motion.div
						initial={{ opacity: 0, y: 40 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-15%" }}
						transition={{ duration: 0.7, delay: 0.2 }}
						className="lg:w-[55%] lg:-ml-[4%] relative z-0"
					>
						{/* Gradient Fade Overlay on Left Edge */}
						<div className={cn(
							"absolute top-0 bottom-0 left-0 w-[20%] z-20 pointer-events-none lg:block hidden",
							isDark
								? "bg-gradient-to-r from-bg-primary-dark to-transparent"
								: "bg-gradient-to-r from-bg-primary-light to-transparent"
						)} />

						<BrowserWindow
							imgLight={dashboard_feature_light}
							imgDark={dashboard_feature_dark}
							isDark={isDark}
							blobColor={isDark ? "#3B82F6" : "#2563EB"} // Blue
						/>
					</motion.div>
				</div>

			</div>
		</section>
	);
};