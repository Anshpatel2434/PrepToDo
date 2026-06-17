import React from "react";
import { useTheme } from "../../../context/ThemeContext";
import { motion } from "framer-motion";

interface FooterProps {
	isDark?: boolean; // Optional since we can get it from context if needed, but keeping prop for now to match interface
	className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = "" }) => {
	const { isDark } = useTheme();

	const resources = [
		{ name: "VARC Guide", href: "/varc-guide" },
		{ name: "RC Strategies", href: "/rc-strategies" },
		{ name: "Para Jumble Tips", href: "/para-jumble-tips" },
		{ name: "Exam Comparison", href: "/cat-vs-other-exams" },
		{ name: "AI Tutor Features", href: "/ai-tutor-features" },
		{ name: "Daily Practice", href: "/daily-practice" },
		{ name: "Mock Strategy", href: "/mock-test-strategy" },
	];

	const legal = [
		{ name: "FAQ", href: "/faq" },
		{ name: "Privacy Policy", href: "/privacy" },
		{ name: "Terms of Service", href: "/terms" },
		{ name: "Refund Policy", href: "/refund" },
	];

	return (
		<footer
			className={`
                py-12 border-t transition-colors duration-300
                ${isDark
					? "bg-bg-primary-dark border-border-dark"
					: "bg-bg-primary-light border-border-light"
				}
                ${className}
            `}
		>
			<div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
				{/* Top Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-dashed border-border-light dark:border-border-dark">
					{/* Brand Pitch */}
					<div className="space-y-3">
						<h3 className={`font-serif font-bold text-lg ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
							PrepToDo
						</h3>
						<p className={`text-xs sm:text-sm leading-relaxed max-w-xs ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>
							AI-powered cognitive diagnostics and adaptive practice drills for CAT Reading Comprehension & Verbal Ability.
						</p>
					</div>

					{/* Resources column */}
					<div className="space-y-3">
						<h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`}>
							Preparation Resources
						</h4>
						<ul className="grid grid-cols-2 gap-2">
							{resources.map((link) => (
								<li key={link.name}>
									<a
										href={link.href}
										className={`text-xs sm:text-sm transition-colors duration-200 block
											${isDark
												? "text-text-secondary-dark hover:text-text-primary-dark"
												: "text-text-secondary-light hover:text-text-primary-light"
											}`}
									>
										{link.name}
									</a>
								</li>
							))}
						</ul>
					</div>

					{/* Legal / FAQ column */}
					<div className="space-y-3">
						<h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`}>
							Support & Legal
						</h4>
						<ul className="space-y-2">
							{legal.map((link) => (
								<li key={link.name}>
									<a
										href={link.href}
										className={`text-xs sm:text-sm transition-colors duration-200 block
											${isDark
												? "text-text-secondary-dark hover:text-text-primary-dark"
												: "text-text-secondary-light hover:text-text-primary-light"
											}`}
									>
										{link.name}
									</a>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Bottom section */}
				<div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8">
					{/* Copyright */}
					<div
						className={`text-xs sm:text-sm ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}
					>
						© {new Date().getFullYear()} PrepToDo. All rights reserved.
					</div>

					{/* Made with love */}
					<motion.div
						className={`flex items-center gap-2 text-xs sm:text-sm ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
					>
						<motion.div
							className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light"}`}
							animate={{ opacity: [1, 0.4, 1] }}
							transition={{ duration: 2, repeat: Infinity }}
						/>
						<span>Made with ❤️ for CAT aspirants</span>
					</motion.div>
				</div>
			</div>
		</footer>
	);
};
