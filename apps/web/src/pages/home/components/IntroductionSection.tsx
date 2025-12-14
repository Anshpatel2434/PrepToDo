import React, { useState, useEffect, useRef } from "react";
import { FaGraduationCap, FaBrain, FaChartLine } from "react-icons/fa";

interface IntroductionSectionProps {
	isDark: boolean;
}

export const IntroductionSection: React.FC<IntroductionSectionProps> = ({
	isDark,
}) => {
	const [isVisible, setIsVisible] = useState(false);
	const [currentParagraph, setCurrentParagraph] = useState(0);
	const sectionRef = useRef<HTMLDivElement>(null);

	const paragraphs = React.useMemo(
		() => [
			{
				title: "Revolutionizing Education Through AI",
				content:
					"PrepToDo is a cutting-edge educational platform that harnesses the power of artificial intelligence to create personalized learning experiences. Our platform excels in analyzing study patterns and helping students grow holistically.",
				icon: FaGraduationCap,
			},
			{
				title: "Adaptive Learning Intelligence",
				content:
					"Our sophisticated algorithms understand your unique learning style, track your progress in real-time, and adapt your study journey to maximize retention and performance. Every interaction builds upon your existing knowledge while strengthening weak areas.",
				icon: FaBrain,
			},
			{
				title: "Transformative Study Experience",
				content:
					"Experience a study platform that's not just personalized, but truly transformative—helping you achieve better grades, deeper understanding, and lasting knowledge retention through intelligent analytics and guidance.",
				icon: FaChartLine,
			},
		],
		[],
	);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					paragraphs.forEach((_, index) => {
						setTimeout(() => {
							setCurrentParagraph(index);
						}, index * 800);
					});
				}
			},
			{ threshold: 0.3 },
		);

		if (sectionRef.current) {
			observer.observe(sectionRef.current);
		}

		return () => observer.disconnect();
	}, [paragraphs]);

	return (
		<section
			ref={sectionRef}
			className={`relative py-24 overflow-hidden ${
				isDark ? "bg-bg-primary-dark" : "bg-bg-secondary-light"
			}`}
		>
			{/* Background Elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div
					className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float ${
						isDark ? "bg-brand-primary-dark/20" : "bg-brand-primary-light/10"
					}`}
					style={{ animationDelay: "0s", animationDuration: "8s" }}
				/>
				<div
					className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-float ${
						isDark
							? "bg-brand-secondary-dark/20"
							: "bg-brand-secondary-light/10"
					}`}
					style={{ animationDelay: "3s", animationDuration: "10s" }}
				/>
			</div>

			<div className="relative max-w-6xl mx-auto px-6">
				{/* Section Header */}
				<div
					className={`text-center mb-16 transition-all duration-1000 ease-out ${
						isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
					}`}
				>
					<div
						className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm mb-6 ${
							isDark
								? "bg-brand-primary-dark/20 border-brand-primary-dark/30"
								: "bg-brand-primary-light/10 border-brand-primary-light/20"
						} border`}
					>
						<div
							className={`w-2 h-2 rounded-full animate-pulse-soft ${
								isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light"
							}`}
						/>
						<span
							className={`text-sm font-medium ${
								isDark ? "text-brand-primary-dark" : "text-brand-primary-light"
							}`}
						>
							About PrepToDo
						</span>
					</div>

					<h2 className="text-4xl lg:text-5xl font-serif font-bold mb-6">
						<span
							className={`bg-gradient-to-r bg-clip-text text-transparent ${
								isDark
									? "from-text-primary-dark via-brand-primary-dark to-brand-secondary-dark"
									: "from-text-primary-light via-brand-primary-light to-brand-secondary-light"
							}`}
						>
							Why Students Choose
						</span>
						<br />
						<span
							className={`bg-gradient-to-r bg-clip-text text-transparent ${
								isDark
									? "from-brand-secondary-dark to-brand-accent-dark"
									: "from-brand-secondary-light to-brand-accent-light"
							}`}
						>
							PrepToDo
						</span>
					</h2>

					<div
						className={`w-24 h-1 mx-auto rounded-full bg-gradient-to-r ${
							isDark
								? "from-brand-primary-dark to-brand-secondary-dark"
								: "from-brand-primary-light to-brand-secondary-light"
						}`}
					/>
				</div>

				{/* Content Cards */}
				<div className="space-y-8 lg:space-y-12">
					{paragraphs.map((paragraph, index) => {
						const Icon = paragraph.icon;
						return (
							<div
								key={index}
								className={`relative transition-all duration-1000 ease-out ${
									isVisible && currentParagraph >= index
										? "opacity-100 translate-y-0"
										: "opacity-0 translate-y-12"
								}`}
								style={{ transitionDelay: `${index * 200}ms` }}
							>
								<div
									className={`max-w-4xl mx-auto p-8 lg:p-12 rounded-3xl backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-500 group border ${
										isDark
											? "bg-bg-secondary-dark/60 border-border-dark"
											: "bg-bg-primary-light/60 border-border-light"
									}`}
								>
									<div className="flex items-start gap-6">
										{/* Icon */}
										<div
											className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300 flex-shrink-0 bg-gradient-to-br ${
												isDark
													? "from-brand-primary-dark to-brand-secondary-dark"
													: "from-brand-primary-light to-brand-secondary-light"
											}`}
										>
											<Icon className="w-6 h-6 text-white" />
											<div
												className={`absolute inset-0 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300 bg-gradient-to-br ${
													isDark
														? "from-brand-primary-dark to-brand-secondary-dark"
														: "from-brand-primary-light to-brand-secondary-light"
												}`}
											/>
										</div>

										{/* Text Content */}
										<div className="flex-1 space-y-4">
											<h3
												className={`text-2xl lg:text-3xl font-bold group-hover:scale-105 transition-transform duration-300 bg-gradient-to-r bg-clip-text text-transparent ${
													isDark
														? "from-brand-primary-dark to-brand-secondary-dark"
														: "from-brand-primary-light to-brand-secondary-light"
												}`}
											>
												{paragraph.title}
											</h3>

											<p
												className={`text-lg lg:text-xl leading-relaxed ${
													isDark
														? "text-text-secondary-dark"
														: "text-text-secondary-light"
												}`}
											>
												{paragraph.content}
											</p>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* Bottom Badge */}
				<div className="text-center mt-16">
					<div
						className={`inline-flex items-center gap-2 ${
							isDark ? "text-text-muted-dark" : "text-text-muted-light"
						}`}
					>
						<div
							className={`w-2 h-2 rounded-full animate-pulse-soft ${
								isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light"
							}`}
						/>
						<span className="text-sm font-medium">
							Experience the future of learning
						</span>
						<div
							className={`w-2 h-2 rounded-full animate-pulse-soft ${
								isDark ? "bg-brand-secondary-dark" : "bg-brand-secondary-light"
							}`}
							style={{ animationDelay: "0.5s" }}
						/>
					</div>
				</div>
			</div>
		</section>
	);
};
