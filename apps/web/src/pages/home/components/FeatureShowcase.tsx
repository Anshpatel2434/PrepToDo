import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MoveRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- Utility ---
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// --- Interfaces ---
interface BlogPost {
	id: string;
	title: string;
	category: string;
	imageUrl: string;
	href: string;
	views: number;
	readTime?: number;
	rating?: number;
	className?: string;
	description?: string;
}

interface FeatureShowcaseProps {
	isDark: boolean;
}

// --- Component ---
export const FeatureShowcase = ({ isDark }: FeatureShowcaseProps) => {
	const navigate = useNavigate();

	// Mapped Data
	const posts: BlogPost[] = [
		{
			id: "daily-section",
			title: "Daily Section",
			category: "Practice",
			// Unsplash: Study/Library
			imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000",
			href: "/daily",
			views: 1240,
			readTime: 15,
			rating: 5,
			description: "Fresh CAT-level passages generated daily. Each question is backed by a 'Reasoning Graph' to ensure it tests genuine comprehension.",
		},
		{
			id: "customized-mocks",
			title: "Customized Mocks",
			category: "Simulation",
			// Unsplash: Laptop/Code/Exam
			imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1000",
			href: "/customized-mocks",
			views: 890,
			readTime: 180, // Mock duration approx
			rating: 5,
			description: "Turn your weaknesses into strengths. Our AI generates mocks that specifically target your lowest proficiency genres.",
		},
		{
			id: "analytics-dashboard",
			title: "Dashboard",
			category: "Analytics",
			// Unsplash: Data/Graph
			imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000",
			href: "/dashboard",
			views: 2100,
			readTime: 5,
			rating: 5,
			description: "Go beyond simple scores. Our 'Reasoning Engine' diagnoses *why* you got a question wrong—identifying logic gaps.",
		},
	];

	const title = "Master Your Preparation";
	const description = "Powerful tools designed to accelerate your learning and maximize your score.";
	const backgroundLabel = "FEATURES";
	const backgroundPosition = "left";
	const className = "mb-16";

	const handlePostClick = (post: BlogPost) => {
		navigate(post.href);
	};

	return (
		<section className={cn(
			"container relative my-24 py-10 mx-auto pl-18 sm:pl-20 md:pl-24 pr-4 sm:pr-6 lg:pr-8",
			className
		)}>
			<h1 className={cn("text-center text-4xl font-serif font-bold tracking-tight capitalize !leading-[1.4] md:text-5xl lg:text-6xl mb-4", isDark ? "text-white" : "text-gray-900")}>
				{title}
			</h1>

			{backgroundLabel && (
				<span
					className={cn(
						"absolute -top-10 -z-50 select-none text-[120px] font-extrabold leading-[1] md:text-[200px] lg:text-[300px]",
						isDark ? "text-white/[0.03]" : "text-black/[0.03]",
						backgroundPosition === "left" ? "-left-[10%]" : "-right-[10%]"
					)}
				>
					{backgroundLabel}
				</span>
			)}

			<p className={cn("mx-auto max-w-[800px] text-center text-xl !leading-[2] md:text-2xl mb-12", isDark ? "text-gray-400" : "text-gray-500")}>
				{description}
			</p>

			<div className="grid h-auto grid-cols-1 gap-5 md:h-[650px] md:grid-cols-2 lg:grid-cols-[1fr_0.5fr]">
				{posts.map((post, index) => {
					const {
						id,
						title: postTitle,
						category,
						imageUrl,
						views,
						readTime,
						rating = 4,
						className: postClassName,
						description: postDesc
					} = post;

					const isPrimary = index === 0;

					return (
						<div
							key={id || index}
							style={{ backgroundImage: `url(${imageUrl})` }}
							className={cn(
								"group relative row-span-1 flex size-full cursor-pointer flex-col justify-end overflow-hidden rounded-[20px] bg-cover bg-center bg-no-repeat p-5 text-white max-md:h-[300px] transition-all duration-300 hover:scale-[0.98] hover:rotate-[0.3deg]",
								isPrimary && "col-span-1 row-span-1 md:col-span-2 md:row-span-2 lg:col-span-1",
								postClassName
							)}
							onClick={() => handlePostClick(post)}
						>
							<div className="absolute inset-0 -z-0 h-[130%] w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-all duration-500 group-hover:h-full" />

							<article className="relative z-0 flex items-end w-full">
								<div className="flex flex-1 flex-col gap-3">
									<h1 className="text-2xl font-bold md:text-4xl text-white">
										{postTitle}
									</h1>

									{postDesc && (
										<p className={cn(
											"text-gray-200 text-sm md:text-lg line-clamp-2 max-w-lg transition-opacity duration-300",
											!isPrimary && "text-xs md:text-sm mt-1 opacity-90"
										)}>
											{postDesc}
										</p>
									)}

									<div className="flex flex-col gap-3 mt-2">
										<span className="text-sm font-medium capitalize py-1 px-3 rounded-full bg-white/20 w-fit text-white backdrop-blur-md border border-white/10">
											{category}
										</span>

										<div className="flex items-center gap-4 text-sm md:text-base text-gray-300">
											<div className="flex items-center gap-1">
												<span className="font-semibold text-white">{rating}</span>
												{Array.from({ length: 5 }).map((_, idx) => (
													<Star
														width={16}
														height={16}
														key={idx}
														stroke={idx < rating ? "#fbbf24" : "#9ca3af"} // amber-400 vs gray-400
														fill={idx < rating ? "#fbbf24" : "transparent"}
														className="transition-colors"
													/>
												))}
											</div>
											<span className="font-medium">
												{views.toLocaleString()} Users
											</span>
										</div>

										{readTime && (
											<div className="text-sm font-semibold text-emerald-400">
												{readTime} {category === "Simulation" ? "mins" : "min activity"}
											</div>
										)}
									</div>
								</div>
								<MoveRight
									className="transition-transform duration-300 group-hover:translate-x-2 shrink-0 mb-2"
									color="white"
									width={32}
									height={32}
									strokeWidth={2}
								/>
							</article>
						</div>
					);
				})}
			</div>
		</section>
	);
};
