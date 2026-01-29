
import { useState } from "react";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import demo from "../../../assets/demo.png";

interface FeatureShowcaseProps {
	isDark: boolean;
}

const features = [
	{
		id: "daily-section",
		title: "Daily Section",
		description:
			"Curated daily practice with fresh passages and questions tailored to your skill level. Maintain your streak with quick 15-min sessions.",

		path: "/daily",
	},
	{
		id: "customized-mocks",
		title: "Customized Mocks",
		description:
			"AI-powered mock tests designed around your weaknesses. Experience real exam simulation with personalized difficulty.",

		path: "/customized-mocks",
	},
	{
		id: "analytics-dashboard",
		title: "Dashboard",
		description:
			"Comprehensive analytics with visual insights into your performance. Track your growth trajectory in real-time.",

		path: "/dashboard",
	},
];

export const FeatureShowcase = ({ isDark }: FeatureShowcaseProps) => {
	const navigate = useNavigate();
	const [hoveredCard, setHoveredCard] = useState<string | null>(null);

	const handleCardClick = (path: string) => {
		navigate(path);
	};

	return (
		<section
			className={`relative py-24 overflow-hidden transition-colors duration-500 ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
				}`}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="text-center mb-16 space-y-4">
					<h2
						className={`text-3xl md:text-5xl font-bold tracking-tight ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
							}`}
					>
						Master Your Preparation
					</h2>
					<p
						className={`text-lg md:text-xl max-w-2xl mx-auto ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
							}`}
					>
						Powerful tools designed to accelerate your learning and maximize your score.
					</p>
				</div>

				{/* Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{features.map((feature) => {
						const isHovered = hoveredCard === feature.id;


						return (
							<motion.div
								key={feature.id}
								className={`group relative rounded-3xl border cursor-pointer overflow-hidden transition-all duration-300 ${isDark
									? "bg-bg-secondary-dark/40 border-border-dark hover:bg-bg-secondary-dark/60"
									: "bg-bg-secondary-light/40 border-border-light hover:bg-bg-secondary-light/60"
									}`}
								onMouseEnter={() => setHoveredCard(feature.id)}
								onMouseLeave={() => setHoveredCard(null)}
								onClick={() => handleCardClick(feature.path)}
								whileHover={{ y: -4 }}
							>
								<div className="p-4 h-full flex flex-col">
									<div className="flex items-start justify-end">
										<motion.div
											initial={{ opacity: 0, x: 10 }}
											animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
											transition={{ duration: 0.2 }}
										>
											<svg
												className={`w-5 h-5 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
													}`}
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M17 8l4 4m0 0l-4 4m4-4H3"
												/>
											</svg>
										</motion.div>
									</div>

									<h3
										className={`text-2xl font-bold mb-3 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
											}`}
									>
										{feature.title}
									</h3>

									<p
										className={`mb-8 leading-relaxed ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
											}`}
									>
										{feature.description}
									</p>

									<div className="mt-auto relative rounded-xl overflow-hidden aspect-video shadow-lg">
										<img
											src={demo}
											alt={feature.title}
											className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
										/>
										<div className={`absolute inset-0 bg-linear-to-t ${isDark ? 'from-black/40' : 'from-black/20'} to-transparent`} />
									</div>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
};