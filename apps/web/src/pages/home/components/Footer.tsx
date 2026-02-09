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
		{ name: "Privacy Policy", href: "/privacy" },
		{ name: "Terms of Service", href: "/terms" },
		{ name: "Refund Policy", href: "/refund" },
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
			<div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
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
					</motion.div>
				</div>
			</div>
		</footer>
	);
};
