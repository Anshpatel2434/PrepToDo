import React, { useEffect, useRef } from "react";

interface HeroSectionProps {
	isDark: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ isDark }) => {
	const heroRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Animate on mount
		const timer = setTimeout(() => {
			if (heroRef.current) {
				heroRef.current.classList.add("animate-fade-in");
			}
		}, 100);

		return () => clearTimeout(timer);
	}, []);

	return (
		<section
			className={`relative min-h-screen flex items-center justify-center overflow-hidden ${
				isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
			} `}
		>
			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden">
				{/* Floating orbs - theme adaptive */}
				<div
					className={`absolute top-32 right-1/4 w-4 h-4 rounded-full animate-bounce-subtle opacity-60 touch-none ${
						isDark ? "bg-blue-500" : "bg-blue-400"
					}`}
					style={{ animationDelay: "1s" }}
				/>
				<div
					className={`absolute bottom-32 left-1/4 w-3 h-3 rounded-full animate-bounce-subtle opacity-50 touch-none ${
						isDark ? "bg-teal-500" : "bg-teal-400"
					}`}
					style={{ animationDelay: "3s" }}
				/>
				<div
					className={`absolute top-1/2 right-16 w-2 h-2 rounded-full animate-bounce-subtle opacity-70 touch-none  ${
						isDark ? "bg-amber-500" : "bg-amber-400"
					}`}
					style={{ animationDelay: "5s" }}
				/>
			</div>

			<div
				ref={heroRef}
				className="relative z-10 max-w-6xl mx-auto px-6 py-12 lg:py-24 opacity-0"
			>
				<div className="text-center space-y-12">
					{/* Main Heading */}
					<div className="space-y-6">
						<h1 className="text-6xl lg:text-8xl font-serif font-bold leading-[0.9] tracking-tight">
							<span
								className={`relative inline-block ${
									isDark ? "text-text-primary-dark" : "text-text-primary-light"
								}`}
							>
								<img
									src="/favicon.svg"
									alt="PrepToDo Logo"
									className={`absolute -z-10 -top-20 left-50 w-14 h-14 lg:w-20 lg:h-20`}
								/>
								<span className="relative">P</span>repToDo
							</span>

							<span
								className={`block text-3xl lg:text-4xl font-sans font-medium mt-4 ${
									isDark
										? "text-text-secondary-dark"
										: "text-text-secondary-light"
								}`}
							>
								Your AI Study Companion
							</span>
						</h1>

						<p
							className={`text-xl lg:text-2xl leading-relaxed max-w-2xl mx-auto ${
								isDark ? "text-text-muted-dark" : "text-text-muted-light"
							}`}
						>
							Transform your learning journey with intelligent study plans,
							adaptive practice tests, and comprehensive analytics that actually
							work.
						</p>
					</div>

					{/* Stats Row */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 max-w-4xl mx-auto">
						<div className="text-center space-y-2">
							<div className="text-3xl lg:text-4xl font-bold bg-linear-to-r from-brand-primary-light to-brand-primary-hover-light dark:from-brand-primary-dark dark:to-brand-primary-hover-dark bg-clip-text text-transparent animate-count-up">
								AI-Powered
							</div>
							<div
								className={`text-sm font-medium ${
									isDark ? "text-text-muted-dark" : "text-text-muted-light"
								}`}
							>
								Study Platform
							</div>
						</div>
						<div className="text-center space-y-2">
							<div className="text-3xl lg:text-4xl font-bold bg-linear-to-r from-brand-secondary-light to-cyan-500 dark:from-brand-secondary-dark dark:to-cyan-400 bg-clip-text text-transparent animate-count-up delay-200">
								Smart
							</div>
							<div
								className={`text-sm font-medium ${
									isDark ? "text-text-muted-dark" : "text-text-muted-light"
								}`}
							>
								Learning Tools
							</div>
						</div>
						<div className="text-center space-y-2">
							<div className="text-3xl lg:text-4xl font-bold bg-linear-to-r from-brand-accent-light to-orange-500 dark:from-brand-accent-dark dark:to-orange-400 bg-clip-text text-transparent animate-count-up delay-400">
								Personalized
							</div>
							<div
								className={`text-sm font-medium ${
									isDark ? "text-text-muted-dark" : "text-text-muted-light"
								}`}
							>
								Study Plans
							</div>
						</div>
					</div>

					{/* CTA Buttons */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
						<button
							className={`
                                group px-8 py-4 text-white font-semibold rounded-2xl
                                shadow-lg hover:shadow-xl transform hover:-translate-y-1
                                transition-all duration-300 ease-out focus-ring overflow-hidden
                                ${
																	isDark
																		? "bg-linear-to-r from-brand-primary-dark to-brand-primary-hover-dark"
																		: "bg-linear-to-r from-brand-primary-light to-brand-primary-hover-light"
																}
                            `}
						>
							<span className="relative z-10">Get Started</span>
						</button>

						<button
							className={`
                                group px-8 py-4 backdrop-blur-sm font-semibold rounded-2xl
                                shadow-lg hover:shadow-xl transform hover:-translate-y-1
                                transition-all duration-300 ease-out focus-ring border
                                ${
																	isDark
																		? "bg-bg-secondary-dark/80 text-text-secondary-dark border-border-darker hover:border-brand-primary-dark"
																		: "bg-bg-primary-light/80 text-text-secondary-light border-border-lighter hover:border-brand-primary-light"
																}
                            `}
						>
							<span className="flex items-center gap-3">
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								Learn More
							</span>
						</button>
					</div>

					{/* Trust indicators */}
					<div
						className={`flex flex-col sm:flex-row gap-6 justify-center items-center pt-4 text-sm ${
							isDark ? "text-text-muted-dark" : "text-text-muted-light"
						}`}
					>
						<div className="flex items-center gap-2">
							<svg
								className="w-4 h-4 text-success"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clipRule="evenodd"
								/>
							</svg>
							<span>AI-powered learning</span>
						</div>
						<div className="flex items-center gap-2">
							<svg
								className="w-4 h-4 text-success"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clipRule="evenodd"
								/>
							</svg>
							<span>Personalized study plans</span>
						</div>
						<div className="flex items-center gap-2">
							<svg
								className="w-4 h-4 text-success"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clipRule="evenodd"
								/>
							</svg>
							<span>Real-time analytics</span>
						</div>
					</div>
				</div>
			</div>

			{/* Scroll indicator */}
			<div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
				<div className="animate-bounce">
					<svg
						className={`w-6 h-6 ${
							isDark ? "text-text-muted-dark" : "text-text-muted-light"
						}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 14l-7 7m0 0l-7-7m7 7V3"
						/>
					</svg>
				</div>
			</div>
		</section>
	);
};
