import React from "react";
import { useTheme } from "../../../context/ThemeContext";
import { motion } from "framer-motion";

interface FooterProps {
	isDark?: boolean; // Optional since we can get it from context if needed, but keeping prop for now to match interface
	className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = "" }) => {
	const { isDark } = useTheme();

	const links = [
		{ name: "Privacy Policy", href: "/privacy" }, // Assuming paths, can be #privacy if needed
		{ name: "Terms and Condition", href: "/terms" },
		{ name: "About Us", href: "/about" },
	];

	return (
		<footer
			className={`
                py-8 border-t transition-colors duration-300
                ${isDark
					? "bg-bg-primary-dark border-border-dark"
					: "bg-bg-primary-light border-border-light"
				}
                ${className}
            `}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col md:flex-row justify-between items-center gap-4">
					{/* Copyright */}
					<div
						className={`text-sm ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
							}`}
					>
						© {new Date().getFullYear()} PrepToDo.
					</div>

					{/* Links */}
					<div className="flex items-center gap-6 sm:gap-8">
						{links.map((link) => (
							<a
								key={link.name}
								href={link.href}
								className={`
                                    text-sm font-medium transition-colors duration-200
                                    ${isDark
										? "text-text-secondary-dark hover:text-text-primary-dark"
										: "text-text-secondary-light hover:text-text-primary-light"
									}
                                `}
							>
								{link.name}
							</a>
						))}
					</div>
					<motion.div
						className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6"
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
					>
						{/* Copyright */}
						<motion.div
							className={`flex flex-col sm:flex-row items-center gap-2 text-xs sm:text-sm text-center sm:text-left ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
								}`}
						>
							<motion.div
								className={`hidden sm:block w-1 h-1 rounded-full ${isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light"
									}`}
								animate={{ opacity: [1, 0.5, 1] }}
								transition={{ duration: 2, repeat: Infinity }}
							/>
							<span>Made with ❤️ for students</span>
						</motion.div>

						{/* Trust indicators */}
						<motion.div
							className={`flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-xs sm:text-sm${isDark ? "text-text-muted-dark" : "text-text-muted-light"
								}`}
						>
							<motion.div
								className="flex items-center gap-2"
								whileHover={{ scale: 1.05 }}
							>
								<svg
									className="w-4 h-4 text-success"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
										clipRule="evenodd"
									/>
								</svg>
								<span>SSL Secured</span>
							</motion.div>
							<motion.div
								className="hidden sm:flex items-center gap-2"
								whileHover={{ scale: 1.05 }}
							>
								<svg
									className="w-4 h-4 text-success"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clipRule="evenodd"
									/>
								</svg>
								<span>GDPR Compliant</span>
							</motion.div>
						</motion.div>
						</motion.div>
				</div>
			</div>
		</footer>
	);
};
