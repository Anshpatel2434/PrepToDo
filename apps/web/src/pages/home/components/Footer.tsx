import React, { useState } from 'react';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = "" }) => {
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
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      )
    },
    { 
      name: "LinkedIn", 
      href: "#linkedin",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    },
    { 
      name: "GitHub", 
      href: "#github",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      )
    },
    { 
      name: "Discord", 
      href: "#discord",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      )
    }
  ];

  const handleLinkClick = (href: string, sectionTitle: string) => {
    console.log(`Navigating to ${href} in ${sectionTitle}`);
    // Add subtle feedback animation
    setHoveredSection(sectionTitle);
    setTimeout(() => setHoveredSection(null), 300);
  };

  return (
    <footer className={`relative bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-950 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 dark:from-blue-600/20 dark:to-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-teal-400/10 to-cyan-400/10 dark:from-teal-600/20 dark:to-cyan-600/20 rounded-full blur-3xl" />
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
                <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>GDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute bottom-20 right-20 w-4 h-4 bg-primary-400/30 rounded-full animate-bounce-subtle" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-32 right-32 w-3 h-3 bg-secondary-400/30 rounded-full animate-bounce-subtle" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-16 right-16 w-2 h-2 bg-accent-400/30 rounded-full animate-bounce-subtle" style={{ animationDelay: '3s' }} />
    </footer>
  );
};