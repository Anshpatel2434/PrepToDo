import React from "react";
import { FaTwitter, FaLinkedin, FaGithub, FaDiscord } from "react-icons/fa";
import { motion } from "framer-motion";

interface FooterProps {
    isDark: boolean;
    className?: string;
}

export const Footer: React.FC<FooterProps> = ({ isDark, className = "" }) => {
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
            icon: FaTwitter,
        },
        {
            name: "LinkedIn",
            href: "#linkedin",
            icon: FaLinkedin,
        },
        {
            name: "GitHub",
            href: "#github",
            icon: FaGithub,
        },
        {
            name: "Discord",
            href: "#discord",
            icon: FaDiscord,
        },
    ];

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
            },
        },
    };

    const linkVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.4,
            },
        },
    };

    const floatingOrbs = [
        {
            id: 1,
            size: "w-64 h-64 sm:w-80 sm:h-80",
            position: "top1/4 left-1/4",
            delay: 0,
        },
        {
            id: 2,
            size: "w-56 h-56 sm:w-72 sm:h-72",
            position: "bottom1/4 right-1/4",
            delay: 1,
        },
    ];

    return (
        <footer
            className={`
                relative py-16 sm:py-20 md:py-24 lg:py-28 overflow-hidden border-t
                ${
                    isDark
                        ? "bg-bg-primary-dark border-border-dark"
                        : "bg-bg-secondary-light border-border-light"
                }
                ${className}
            `}
        >
            {/* Enhanced Floating Background Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Gradient background */}
                <motion.div
                    className={`absolute inset-0 opacity-20`}
                    animate={
                        {
                            background: isDark
                                ? ["linear-gradient(45deg, #1a1b3a 0%, #2d1b69 100%)",
                                   "linear-gradient(45deg, #2d1b69 0%, #1a1b3a 100%)",
                                   "linear-gradient(45deg, #1a1b3a 0%, #2d1b69 100%)"]
                                : ["linear-gradient(45deg, #f0f4ff 0%, #e6f0ff 100%)",
                                   "linear-gradient(45deg, #e6f0ff 0%, #f0f4ff 100%)",
                                   "linear-gradient(45deg, #f0f4ff 0%, #e6f0ff 100%)"]
                        }
                    }
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                />
                
                {floatingOrbs.map((orb) => (
                    <motion.div
                        key={orb.id}
                        className={`absolute ${orb.size} rounded-full blur-3xl ${
                            isDark ? "bg-brand-primary-dark/20" : "bg-brand-primary-light/10"
                        }`}
                        style={{ [orb.position.split(" ")[0]]: "0" }}
                        animate={{
                            y: [0, 30, 0],
                            x: [0, 20, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 8 + orb.id,
                            repeat: Infinity,
                            repeatType: "reverse",
                            delay: orb.delay,
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Footer Content */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 sm:gap-10 md:gap-12 mb-12 sm:mb-16 lg:mb-20"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={containerVariants}
                >
                    {/* Enhanced Brand Section */}
                    <motion.div
                        className="lg:col-span-2 space-y-6 sm:space-y-8"
                        variants={itemVariants}
                    >
                        {/* Logo and Branding */}
                        <motion.div
                            className="flex items-center gap-3 sm:gap-4"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                        >
                            <motion.div
                                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg`}
                                style={{
                                    background: isDark 
                                        ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
                                        : "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)"
                                }}
                                whileHover={{ rotate: [0, -5, 5, 0] }}
                                transition={{ duration: 0.5 }}
                            >
                                <img
                                    src="/new_icon.png"
                                    alt="PrepToDo"
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover"
                                />
                            </motion.div>
                            <div>
                                <h3
                                    className={`text-2xl sm:text-3xl font-serif font-bold transition-colors duration-300 ${
                                        isDark
                                            ? "text-text-primary-dark"
                                            : "text-text-primary-light"
                                    }`}
                                >
                                    PrepToDo
                                </h3>
                                <p
                                    className={`text-xs sm:text-sm transition-colors duration-300 ${
                                        isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                    }`}
                                >
                                    AI-Powered Study Platform
                                </p>
                            </div>
                        </motion.div>

                        {/* Description */}
                        <p
                            className={`text-sm sm:text-base leading-relaxed transition-colors duration-300 ${
                                isDark
                                    ? "text-text-secondary-dark"
                                    : "text-text-secondary-light"
                            }`}
                        >
                            Transform your learning journey with intelligent study plans,
                            adaptive practice tests, and comprehensive analytics that actually
                            work.
                        </p>

                        {/* Enhanced Newsletter Signup */}
                        <motion.div className="space-y-3" variants={linkVariants}>
                            <h4
                                className={`font-semibold text-sm sm:text-base ${
                                    isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}
                            >
                                Stay Updated
                            </h4>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className={`
                                        flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border transition-all duration-300
                                        ${
                                            isDark
                                                ? "bg-bg-secondary-dark border-border-dark text-text-primary-dark placeholder-text-muted-dark focus:ring-brand-primary-dark"
                                                : "bg-bg-tertiary-light border-border-light text-text-primary-light placeholder-text-muted-light focus:ring-brand-primary-light"
                                        }
                                        focus:outline-none focus:ring-2 focus:border-transparent
                                    `}
                                />
                                <motion.button
                                    className={`
                                        px-4 sm:px-6 py-2 sm:py-3 font-medium text-sm sm:text-base rounded-lg sm:rounded-xl
                                        shadow-lg hover:shadow-xl whitespace-nowrap
                                        ${
                                            isDark
                                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-text-primary-dark hover:bg-gradient-to-r hover:from-indigo-700 hover:to-purple-700"
                                                : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600"
                                        }
                                    `}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Subscribe
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Enhanced Social Links */}
                        <motion.div className="flex gap-3 sm:gap-4" variants={linkVariants}>
                            {socialLinks.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <motion.a
                                        key={social.name}
                                        href={social.href}
                                        className={`
                                            w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center
                                            shadow-sm hover:shadow-md border
                                            ${
                                                isDark
                                                    ? "bg-bg-secondary-dark border-border-dark text-text-secondary-dark hover:text-brand-primary-dark hover:border-brand-primary-dark"
                                                    : "bg-bg-tertiary-light border-border-light text-text-secondary-light hover:text-brand-primary-light hover:border-brand-primary-light"
                                            }
                                        `}
                                        aria-label={social.name}
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </motion.a>
                                );
                            })}
                        </motion.div>
                    </motion.div>

                    {/* Links Sections */}
                    <motion.div
                        className="md:col-span-1 lg:col-span-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8"
                        variants={containerVariants}
                    >
                        {footerSections.map((section) => (
                            <motion.div
                                key={section.title}
                                className="space-y-3 sm:space-y-4"
                                variants={itemVariants}
                            >
                                <motion.h4
                                    className={`font-bold text-sm sm:text-base${
                                        isDark
                                            ? "text-text-primary-dark"
                                            : "text-text-primary-light"
                                    }`}
                                >
                                    {section.title}
                                </motion.h4>
                                <ul className="space-y-2 sm:space-y-3">
                                    {section.links.map((link, idx) => (
                                        <motion.li
                                            key={link.name}
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{
                                                duration: 0.4,
                                                delay: idx * 0.05,
                                            }}
                                        >
                                            <motion.a
                                                href={link.href}
                                                className={`
                                                    text-xs sm:text-sm relative group inline-block
                                                    ${
                                                        isDark
                                                            ? "text-text-muted-dark hover:text-brand-primary-dark"
                                                            : "text-text-muted-light hover:text-brand-primary-light"
                                                    }
                                                `}
                                            >
                                                <span className="relative z-10">{link.name}</span>
                                                <motion.div
                                                    className={`absolute inset-0 rounded-lg scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${
                                                        isDark
                                                            ? "bg-brand-primary-dark/10"
                                                            : "bg-brand-primary-light/10"
                                                    }`}
                                                />
                                            </motion.a>
                                        </motion.li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Enhanced Divider */}
                <motion.div
                    className={`h-px mb-8 sm:mb-12 lg:mb-16 ${
                        isDark ? "bg-border-dark" : "bg-border-light"
                    }`}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                />

                {/* Enhanced Bottom Section */}
                <motion.div
                    className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={containerVariants}
                >
                    {/* Enhanced Copyright */}
                    <motion.div
                        className={`flex flex-col sm:flex-row items-center gap-2 text-xs sm:text-sm text-center sm:text-left ${
                            isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                        variants={itemVariants}
                    >
                        <span>© 2024 PrepToDo. All rights reserved.</span>
                        <motion.div
                            className={`hidden sm:block w-1 h-1 rounded-full ${
                                isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light"
                            }`}
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span>Made with ❤️ for students</span>
                    </motion.div>

                    {/* Enhanced Trust indicators */}
                    <motion.div
                        className={`flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-xs sm:text-sm${
                            isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                        variants={itemVariants}
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
        </footer>
    );
};