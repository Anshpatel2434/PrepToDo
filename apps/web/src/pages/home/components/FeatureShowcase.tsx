import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MoveRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import dailyPageDark from "../../../assets/daily_page_dark.png";
import dailyPageLight from "../../../assets/daily_page_light.png";
import customized_sectional_light from "../../../assets/customized_sectional_light.png";
import customized_sectional_dark from "../../../assets/customized_sectional_dark.png";
import dashboard_feature_light from "../../../assets/dashboard_feature_light.png";
import dashboard_feature_dark from "../../../assets/dashboard_feature_dark.png";

// --- Utility ---
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// --- Interfaces ---
interface BlogPost {
	id: string;
	title: string;
	imageUrl: string;
	href: string;
	views: number;
	readTime?: number;
	description: string;
	className?: string;
	features?: string[];
}

interface FeatureShowcaseProps {
	isDark: boolean;
}

// --- Component ---
export const FeatureShowcase = ({ isDark }: FeatureShowcaseProps) => {
	const navigate = useNavigate();

	const posts: BlogPost[] = [
		{
			id: "daily-section",
			title: "Daily Practice",
			imageUrl: isDark ? dailyPageDark : dailyPageLight,
			href: "/daily",
			views: 1240,
			readTime: 20,
			description: "Build a strong daily habit with focused VARC practice designed to improve comprehension, consistency, and exam readiness through structured repetition.",
			features: [
				"One shared article context to build depth and focus",
				"Daily practice rhythm that strengthens reading stamina",
				"Daily Leaderboard to foster healthy competition"
			]
		},
		{
			id: "customized-mocks",
			title: "Adaptive Sectionals",
			imageUrl: isDark ? customized_sectional_dark : customized_sectional_light,
			href: "/customized-mocks",
			views: 890,
			readTime: 40,
			description: "Turn weak areas into strengths with sectional tests that focus your effort where it matters most, helping you improve accuracy and confidence.",
			features: [
				"Practice sets focused on your weakest skills and genres",
				"Difficulty adjustment based on what you want to improve",
				"Avoids repetition of concepts you’ve already mastered"
			]
		},
		{
			id: "analytics-dashboard",
			title: "Deep Analytics",
			imageUrl: isDark ? dashboard_feature_dark : dashboard_feature_light,
			href: "/dashboard",
			views: 2100,
			readTime: 5,
			description: "Understand not just what you got wrong, but why. Detailed insights help you correct thinking patterns and make lasting improvements.",
			features: [
				"Breaks down errors by skill, genres, and speed VS accuracy",
				"Shows patterns behind repeated mistakes",
				"Helps you prioritise what to fix next"
			]
		}
	];

	return (
		<section className="container relative mx-auto my-12 pl-18 sm:pl-20 md:pl-24 pr-4 lg:pr-8 max-w-screen-2xl py-8 sm:my-10">
			{/* Header */}
			<div className="mb-16 text-center">
				<h2 className={cn(
					"mb-3 text-3xl font-serif font-bold tracking-tight sm:mb-4 sm:text-4xl md:text-5xl",
					isDark ? "text-white" : "text-gray-900"
				)}>
					Features we offer
				</h2>
				<p className={cn(
					"mx-auto max-w-2xl text-base leading-relaxed sm:text-lg",
					isDark ? "text-gray-400" : "text-gray-600"
				)}>
					Built to sharpen comprehension, expose common traps, and train the exact reasoning patterns that matter in CAT VARC.
				</p>
			</div>

			{/* Zig-Zag Features Layout */}
			<div className="flex flex-col gap-16 md:gap-24">
				{posts.map((post, index) => {
					const { id, title, description, imageUrl, href, features } = post;
					const isEven = index % 2 === 0;

					return (
						<div
							key={id}
							className="group grid grid-cols-1 items-center gap-8 md:grid-cols-2 lg:gap-16 max-w-7xl mx-auto"
						>
							{/* Content Column */}
							<div className={cn(
								"flex flex-col gap-5 order-2",
								isEven ? "md:order-1" : "md:order-2"
							)}>
								<div className="flex flex-col gap-3">
									<h3 className={cn(
										"text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl",
										isDark ? "text-white" : "text-gray-900"
									)}>
										{title}
									</h3>
									<p className={cn(
										"text-base leading-relaxed sm:text-lg",
										isDark ? "text-gray-300" : "text-gray-600"
									)}>
										{description}
									</p>
								</div>

								{features && (
									<ul className="space-y-2">
										{features.map((feature, i) => (
											<li key={i} className="flex items-start gap-2.5">
												<CheckCircle2 className={cn(
													"mt-1 h-4.5 w-4.5 flex-shrink-0",
													isDark ? "text-emerald-400" : "text-emerald-600"
												)} />
												<span className={cn(
													"text-sm font-medium sm:text-base",
													isDark ? "text-gray-300" : "text-gray-700"
												)}>
													{feature}
												</span>
											</li>
										))}
									</ul>
								)}

								<div
									onClick={() => navigate(href)}
									className={cn(
										"mt-1 flex cursor-pointer items-center gap-2 text-sm font-semibold uppercase tracking-wide group-hover:gap-3 transition-all",
										isDark ? "text-emerald-400" : "text-emerald-600"
									)}
								>
									Explore Feature <MoveRight className="h-4 w-4" />
								</div>
							</div>

							{/* Image Column - Floating Widget Style */}
							<div className={cn(
								"relative order-1",
								isEven ? "md:order-2" : "md:order-1"
							)}>
								<div className={cn(
									"relative aspect-[16/9] w-full overflow-hidden rounded-2xl border shadow-xl transition-all duration-500 will-change-transform hover:scale-[1.02] hover:-rotate-1",
									isDark
										? "border-white/10 bg-neutral-900 shadow-black/50"
										: "border-black/5 bg-gray-50 shadow-gray-200/50"
								)}>
									{/* Browser Chrome / Header Aesthetic */}
									<div className={cn(
										"absolute top-0 left-0 right-0 z-20 flex h-7 items-center gap-1.5 border-b px-3",
										isDark ? "bg-white/5 border-white/5" : "bg-white/50 border-black/5"
									)}>
										<div className="h-2 w-2 rounded-full bg-red-400/80" />
										<div className="h-2 w-2 rounded-full bg-amber-400/80" />
										<div className="h-2 w-2 rounded-full bg-green-400/80" />
									</div>

									<img
										src={imageUrl}
										alt={title}
										className="h-full w-full object-cover object-top pt-7"
										loading="lazy"
									/>

									{/* Gradient Overlay for Polish */}
									<div className={cn(
										"pointer-events-none absolute inset-0 z-10",
										isDark
											? "bg-gradient-to-t from-black/20 to-transparent"
											: "bg-gradient-to-t from-black/5 to-transparent"
									)} />
								</div>

								{/* Decorative Blob behind */}
								<div className={cn(
									"absolute -inset-4 -z-10 rounded-[2.5rem] blur-3xl opacity-30 transition-all duration-500 group-hover:opacity-50",
									isDark
										? "bg-gradient-to-tr from-emerald-500/20 to-blue-500/20"
										: "bg-gradient-to-tr from-emerald-200/40 to-blue-200/40"
								)} />
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
};