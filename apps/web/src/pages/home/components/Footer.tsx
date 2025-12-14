import React, { useState } from 'react';
import { 
  FaTwitter, 
  FaLinkedin, 
  FaGithub, 
  FaDiscord,
  FaShieldAlt,
  FaCertificate
} from 'react-icons/fa';

interface FooterProps {
  className?: string;
  isDark?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ className = "", isDark = false }) => {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const footerSections = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "AI Technology", href: "#ai-tech" },
        { name: "Integrations", href: "#integrations" },
        { name: "API", href: "#api" }
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Documentation", href: "#docs" },
        { name: "Help Center", href: "#help" },
        { name: "Community", href: "#community" },
        { name: "Blog", href: "#blog" },
        { name: "Tutorials", href: "#tutorials" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "#about" },
        { name: "Careers", href: "#careers" },
        { name: "Contact", href: "#contact" },
        { name: "Press Kit", href: "#press" },
        { name: "Partners", href: "#partners" }
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "#privacy" },
        { name: "Terms of Service", href: "#terms" },
        { name: "Cookie Policy", href: "#cookies" },
        { name: "Security", href: "#security" },
        { name: "Compliance", href: "#compliance" }
      ]
    }
  ];

  const socialLinks = [
    { 
      name: "Twitter", 
      href: "#twitter",
      icon: <FaTwitter className="w-5 h-5" />
    },
    { 
      name: "LinkedIn", 
      href: "#linkedin",
      icon: <FaLinkedin className="w-5 h-5" />
    },
    { 
      name: "GitHub", 
      href: "#github",
      icon: <FaGithub className="w-5 h-5" />
    },
    { 
      name: "Discord", 
      href: "#discord",
      icon: <FaDiscord className="w-5 h-5" />
    }
  ];

  const handleLinkClick = (href: string, sectionTitle: string) => {
    console.log(`Navigating to ${href} in ${sectionTitle}`);
    // Add subtle feedback animation
    setHoveredSection(sectionTitle);
    setTimeout(() => setHoveredSection(null), 300);
  };

  return (
    <footer className={`relative bg-gradient-to-b from-bg-secondary-light to-bg-tertiary-light dark:from-bg-tertiary-dark dark:to-bg-primary-dark border-t border-border-light dark:border-border-dark ${className}`}>
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-gradient-to-br from-brand-primary-dark/20 to-brand-primary-dark/20' : 'bg-gradient-to-br from-brand-primary-light/10 to-brand-primary-light/10'}`} />
        <div className={`absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-gradient-to-br from-brand-secondary-dark/20 to-brand-secondary-dark/20' : 'bg-gradient-to-br from-brand-secondary-light/10 to-brand-secondary-light/10'}`} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12 mb-12">
          
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <img src="/icon.jpeg" alt="PrepToDo" className="w-8 h-8 rounded-lg object-cover" />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  PrepToDo
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">AI-Powered Study Platform</p>
              </div>
            </div>
            
            <p className="text-text-secondary leading-relaxed">
              Transform your learning journey with intelligent study plans, adaptive practice tests, 
              and comprehensive analytics that actually work.
            </p>

            {/* Newsletter Signup */}
            <div className="space-y-3">
              <h4 className="font-semibold text-text-primary">Stay Updated</h4>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="
                    flex-1 px-4 py-3 rounded-xl border border-border dark:border-surface-600
                    bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm
                    text-text-primary dark:text-text-inverse placeholder-text-muted
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    transition-all duration-300
                  "
                />
                <button className="
                  px-6 py-3 bg-gradient-primary text-white font-medium rounded-xl
                  shadow-btn hover:shadow-btn-primary transform hover:-translate-y-0.5
                  transition-all duration-300 focus-ring
                ">
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
                  onClick={() => handleLinkClick(social.href, 'social')}
                  className={`
                    w-10 h-10 rounded-xl bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm
                    border border-border dark:border-surface-600 flex items-center justify-center
                    text-text-muted hover:text-primary-500 hover:border-primary-300 dark:hover:border-primary-500
                    shadow-sm hover:shadow-md transform hover:-translate-y-1 hover:scale-105
                    transition-all duration-300
                    ${hoveredSection === 'social' ? 'animate-bounce-subtle' : ''}
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
                <h4 className={`
                  font-bold text-text-primary transition-colors duration-300
                  ${hoveredSection === section.title ? 'text-primary-600 dark:text-primary-400' : ''}
                `}>
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        onClick={() => handleLinkClick(link.href, section.title)}
                        className="
                          text-text-muted hover:text-primary-500 dark:hover:text-primary-400
                          transition-colors duration-300 text-sm relative group
                        "
                      >
                        <span className="relative z-10">{link.name}</span>
                        <div className="absolute inset-0 bg-primary-100 dark:bg-primary-900/20 rounded-lg scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-border dark:border-surface-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Copyright */}
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <span>© 2024 PrepToDo. All rights reserved.</span>
              <div className="w-1 h-1 bg-primary-400 rounded-full animate-pulse-soft" />
              <span>Made with ❤️ for students</span>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 text-text-muted text-sm">
              <div className="flex items-center gap-1">
                <FaShieldAlt className="w-4 h-4 text-academic-success-light dark:text-academic-success-dark" />
                <span className="text-text-muted-light dark:text-text-muted-dark">SSL Secured</span>
              </div>
              <div className="flex items-center gap-1">
                <FaCertificate className="w-4 h-4 text-academic-success-light dark:text-academic-success-dark" />
                <span className="text-text-muted-light dark:text-text-muted-dark">GDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className={`absolute bottom-20 right-20 w-4 h-4 rounded-full animate-bounce-subtle ${isDark ? 'bg-brand-primary-dark/30' : 'bg-brand-primary-light/30'}`} style={{ animationDelay: '1s' }} />
      <div className={`absolute bottom-32 right-32 w-3 h-3 rounded-full animate-bounce-subtle ${isDark ? 'bg-brand-secondary-dark/30' : 'bg-brand-secondary-light/30'}`} style={{ animationDelay: '2s' }} />
      <div className={`absolute bottom-16 right-16 w-2 h-2 rounded-full animate-bounce-subtle ${isDark ? 'bg-academic-accent-dark/30' : 'bg-academic-accent-light/30'}`} style={{ animationDelay: '3s' }} />
    </footer>
  );
};