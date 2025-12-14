import React from 'react';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Platform',
      links: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Study Plans', href: '/study-plans' },
        { label: 'Practice Tests', href: '/practice' },
        { label: 'Analytics', href: '/analytics' },
        { label: 'Resources', href: '/resources' }
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '/help' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Community Forum', href: '/forum' },
        { label: 'Tutorials', href: '/tutorials' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
        { label: 'Accessibility', href: '/accessibility' }
      ]
    },
    {
      title: 'Connect',
      links: [
        { label: 'Newsletter', href: '/newsletter' },
        { label: 'Blog', href: '/blog' },
        { label: 'Social Media', href: '/social' },
        { label: 'Partnerships', href: '/partnerships' },
        { label: 'Careers', href: '/careers' }
      ]
    }
  ];

  const handleLinkClick = (href: string) => {
    // TODO: Implement routing when backend is connected
    console.log(`Navigate to: ${href}`);
  };

  return (
    <footer className={`
      bg-bg-secondary border-t border-border-primary mt-16
      ${className}
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                  <rect x="6" y="4" width="20" height="24" rx="2" fill="white" />
                  <rect x="10" y="8" width="12" height="3" rx="1.5" fill="#3b82f6"/>
                  <circle cx="9" cy="6" r="2" fill="#3b82f6"/>
                  <circle cx="23" cy="6" r="2" fill="#3b82f6"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary">PrepToDo</h3>
            </div>
            <p className="text-text-muted text-sm leading-relaxed mb-4">
              Empowering students worldwide with AI-driven study solutions. 
              Transform your learning journey with personalized tools and insights.
            </p>
            <div className="flex space-x-4">
              {/* Social media icons */}
              <button
                onClick={() => handleLinkClick('/social/twitter')}
                className="w-8 h-8 rounded-lg bg-bg-tertiary hover:bg-accent-primary hover:text-white text-text-muted transition-all duration-300 flex items-center justify-center"
                aria-label="Follow us on Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </button>
              <button
                onClick={() => handleLinkClick('/social/linkedin')}
                className="w-8 h-8 rounded-lg bg-bg-tertiary hover:bg-accent-primary hover:text-white text-text-muted transition-all duration-300 flex items-center justify-center"
                aria-label="Follow us on LinkedIn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
              <button
                onClick={() => handleLinkClick('/social/github')}
                className="w-8 h-8 rounded-lg bg-bg-tertiary hover:bg-accent-primary hover:text-white text-text-muted transition-all duration-300 flex items-center justify-center"
                aria-label="Follow us on GitHub"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Footer links sections */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <button
                      onClick={() => handleLinkClick(link.href)}
                      className="text-text-muted hover:text-accent-primary text-sm transition-colors duration-300"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-border-primary">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-text-muted text-sm">
              © {currentYear} PrepToDo. All rights reserved. Built with ❤️ for students worldwide.
            </div>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <button
                onClick={() => handleLinkClick('/privacy')}
                className="text-text-muted hover:text-accent-primary text-sm transition-colors duration-300"
              >
                Privacy
              </button>
              <button
                onClick={() => handleLinkClick('/terms')}
                className="text-text-muted hover:text-accent-primary text-sm transition-colors duration-300"
              >
                Terms
              </button>
              <button
                onClick={() => handleLinkClick('/cookies')}
                className="text-text-muted hover:text-accent-primary text-sm transition-colors duration-300"
              >
                Cookies
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};