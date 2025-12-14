import React, { useState } from "react";
import { FaTwitter, FaLinkedin, FaGithub, FaDiscord } from "react-icons/fa";

interface FooterProps {
	isDark?: boolean;
	className?: string;
}

export const Footer: React.FC<FooterProps> = ({
	isDark = false,
	className = "",
}) => {
	const [hoveredSection, setHoveredSection] = useState<string | null>(null);

	const footerSections = [
		{
			title: "Product",
			links: [
				{ name: "Features", href: "#features" },
				{ name: "Pricing", href: "#pricing" },
				{ name: "AI Technology", href: "#ai-tech" },
				{ name: "Integrations", href: "#integrations" },
				{ name: "API", href: "#api" },
			],
		},
		{
			title: "Resources",
			links: [
				{ name: "Documentation", href: "#docs" },
				{ name: "Help Center", href: "#help" },
				{ name: "Community", href: "#community" },
				{ name: "Blog", href: "#blog" },
				{ name: "Tutorials", href: "#tutorials" },
			],
		},
		{
			title: "Company",
			links: [
				{ name: "About Us", href: "#about" },
				{ name: "Careers", href: "#careers" },
				{ name: "Contact", href: "#contact" },
				{ name: "Press Kit", href: "#press" },
				{ name: "Partners", href: "#partners" },
			],
		},
		{
			title: "Legal",
			links: [
				{ name: "Privacy Policy", href: "#privacy" },
				{ name: "Terms of Service", href: "#terms" },
				{ name: "Cookie Policy", href: "#cookies" },
				{ name: "Security", href: "#security" },
				{ name: "Compliance", href: "#compliance" },
			],
		},
	];

	const socialLinks = [
		{
			name: "Twitter",
			href: "#twitter",
			icon: <FaTwitter className="w-5 h-5" />,
		},
		{
			name: "LinkedIn",
			href: "#linkedin",
			icon: <FaLinkedin className="w-5 h-5" />,
		},
		{
			name: "GitHub",
			href: "#github",
			icon: <FaGithub className="w-5 h-5" />,
		},
		{
			name: "Discord",
			href: "#discord",
			icon: <FaDiscord className="w-5 h-5" />,
		},
	];

	const handleLinkClick = (href: string, sectionTitle: string) => {
		console.log(`Navigating to ${href} in ${sectionTitle}`);
		// Add subtle feedback animation
		setHoveredSection(sectionTitle);
		setTimeout(() => setHoveredSection(null), 300);
	};

	return (
		<footer
			className={`
      relative transition-colors duration-300
      ${
				isDark
					? "bg-bg-primary-dark border-border-dark"
					: "bg-bg-secondary-light border-border-light"
			}
      border-t ${className}
    `}
		>
			{/* Background decoration */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div
					className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl transition-colors duration-300 ${
						isDark ? "bg-brand-primary-dark/10" : "bg-brand-primary-light/10"
					}`}
				/>
				<div
					className={`absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl transition-colors duration-300 ${
						isDark
							? "bg-brand-secondary-dark/10"
							: "bg-brand-secondary-light/10"
					}`}
				/>
			</div>

			<div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
				{/* Main Footer Content */}
				<div className="grid grid-cols-1 lg:grid-cols-6 gap-12 mb-12">
					{/* Brand Section */}
					<div className="lg:col-span-2 space-y-6">
						<div className="flex items-center gap-4">
							<div
								className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${
									isDark
										? "from-brand-primary-dark to-brand-secondary-dark"
										: "from-brand-primary-light to-brand-secondary-light"
								} flex items-center justify-center shadow-lg transition-colors duration-300`}
							>
								<img
									src="/new_icon.png"
									alt="PrepToDo"
									className="w-8 h-8 rounded-lg object-cover"
								/>
							</div>
							<div>
								<h3
									className={`text-2xl font-serif font-bold transition-colors duration-300 ${
										isDark
											? "text-text-primary-dark"
											: "text-text-primary-light"
									}`}
								>
									PrepToDo
								</h3>
								<p
									className={`text-sm transition-colors duration-300 ${
										isDark ? "text-text-muted-dark" : "text-text-muted-light"
									}`}
								>
									AI-Powered Study Platform
								</p>
							</div>
						</div>

						<p
							className={`leading-relaxed transition-colors duration-300 ${
								isDark
									? "text-text-secondary-dark"
									: "text-text-secondary-light"
							}`}
						>
							Transform your learning journey with intelligent study plans,
							adaptive practice tests, and comprehensive analytics that actually
							work.
						</p>

						{/* Newsletter Signup */}
						<div className="space-y-3">
							<h4
								className={`font-semibold transition-colors duration-300 ${
									isDark ? "text-text-primary-dark" : "text-text-primary-light"
								}`}
							>
								Stay Updated
							</h4>
							<div className="flex gap-2">
								<input
									type="email"
									placeholder="Enter your email"
									className={`
                    flex-1 px-4 py-3 rounded-xl border transition-all duration-300
                    ${
											isDark
												? "bg-bg-secondary-dark border-border-dark text-text-primary-dark placeholder-text-muted-dark focus:ring-brand-primary-dark"
												: "bg-bg-tertiary-light border-border-light text-text-primary-light placeholder-text-muted-light focus:ring-brand-primary-light"
										}
                    focus:outline-none focus:ring-2 focus:border-transparent
                  `}
								/>
								<button
									className={`
                  px-6 py-3 font-medium rounded-xl
                  shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                  transition-all duration-300 bg-gradient-to-r
                  ${
										isDark
											? "from-brand-primary-dark to-brand-secondary-dark text-text-primary-dark"
											: "from-brand-primary-light to-brand-secondary-light text-white"
									}
                `}
								>
									Subscribe
								</button>
							</div>
						</div>

						{/* Social Links */}
						<div className="flex gap-4">
							{socialLinks.map((social) => (
								<a
									key={social.name}
									href={social.href}
									onClick={() => handleLinkClick(social.href, "social")}
									className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    shadow-sm hover:shadow-md transform hover:-translate-y-1 hover:scale-105
                    transition-all duration-300
                    ${
											isDark
												? `bg-bg-secondary-dark border border-border-dark text-text-muted-dark hover:text-brand-primary-dark hover:border-brand-primary-dark`
												: `bg-bg-tertiary-light border border-border-light text-text-muted-light hover:text-brand-primary-light hover:border-brand-primary-light`
										}
                    ${
											hoveredSection === "social" ? "animate-bounce-subtle" : ""
										}
                  `}
									aria-label={social.name}
								>
									{social.icon}
								</a>
							))}
						</div>
					</div>

					{/* Links Sections */}
					<div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8">
						{footerSections.map((section) => (
							<div
								key={section.title}
								className="space-y-4"
								onMouseEnter={() => setHoveredSection(section.title)}
								onMouseLeave={() => setHoveredSection(null)}
							>
								<h4
									className={`
                  font-bold transition-colors duration-300
                  ${
										hoveredSection === section.title
											? isDark
												? "text-brand-primary-dark"
												: "text-brand-primary-light"
											: isDark
											? "text-text-primary-dark"
											: "text-text-primary-light"
									}
                `}
								>
									{section.title}
								</h4>
								<ul className="space-y-3">
									{section.links.map((link) => (
										<li key={link.name}>
											<a
												href={link.href}
												onClick={() =>
													handleLinkClick(link.href, section.title)
												}
												className={`
                          transition-colors duration-300 text-sm relative group
                          ${
														isDark
															? "text-text-muted-dark hover:text-brand-primary-dark"
															: "text-text-muted-light hover:text-brand-primary-light"
													}
                        `}
											>
												<span className="relative z-10">{link.name}</span>
												<div
													className={`absolute inset-0 rounded-lg scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${
														isDark
															? "bg-brand-primary-dark/10"
															: "bg-brand-primary-light/10"
													}`}
												/>
											</a>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>

				{/* Bottom Section */}
				<div
					className={`pt-8 border-t transition-colors duration-300 ${
						isDark ? "border-border-dark" : "border-border-light"
					}`}
				>
					<div className="flex flex-col md:flex-row justify-between items-center gap-4">
						{/* Copyright */}
						<div
							className={`flex items-center gap-2 text-sm transition-colors duration-300 ${
								isDark ? "text-text-muted-dark" : "text-text-muted-light"
							}`}
						>
							<span>© 2024 PrepToDo. All rights reserved.</span>
							<div
								className={`w-1 h-1 rounded-full animate-pulse-soft transition-colors duration-300 ${
									isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light"
								}`}
							/>
							<span>Made with ❤️ for students</span>
						</div>

						{/* Trust indicators */}
						<div
							className={`flex items-center gap-6 text-sm transition-colors duration-300 ${
								isDark ? "text-text-muted-dark" : "text-text-muted-light"
							}`}
						>
							<div className="flex items-center gap-1">
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
							</div>
							<div className="flex items-center gap-1">
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
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Floating elements */}
			<div
				className={`absolute bottom-20 right-20 w-4 h-4 rounded-full animate-bounce-subtle transition-colors duration-300 ${
					isDark ? "bg-brand-primary-dark/30" : "bg-brand-primary-light/30"
				}`}
				style={{ animationDelay: "1s" }}
			/>
			<div
				className={`absolute bottom-32 right-32 w-3 h-3 rounded-full animate-bounce-subtle transition-colors duration-300 ${
					isDark ? "bg-brand-secondary-dark/30" : "bg-brand-secondary-light/30"
				}`}
				style={{ animationDelay: "2s" }}
			/>
			<div
				className={`absolute bottom-16 right-16 w-2 h-2 rounded-full animate-bounce-subtle transition-colors duration-300 ${
					isDark ? "bg-brand-accent-dark/30" : "bg-brand-accent-light/30"
				}`}
				style={{ animationDelay: "3s" }}
			/>
		</footer>
	);
};
