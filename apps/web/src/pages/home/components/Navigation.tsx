import React, { useState, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface NavigationProps {
  className?: string;
}

const navItems = [
  { id: 'home', label: 'Home', icon: '🏠', href: '#home' },
  { id: 'features', label: 'Features', icon: '⚡', href: '#features' },
  { id: 'about', label: 'About', icon: '📖', href: '#about' },
  { id: 'pricing', label: 'Pricing', icon: '💰', href: '#pricing' },
  { id: 'contact', label: 'Contact', icon: '📧', href: '#contact' },
];

export const Navigation: React.FC<NavigationProps> = ({ className = "" }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeItem, setActiveItem] = useState('home');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNavClick = (itemId: string) => {
    setActiveItem(itemId);
    
    // Smooth scroll to section
    const element = document.querySelector(itemId === 'home' ? 'section:first-child' : `[data-section="${itemId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-6 left-6 z-50 lg:hidden p-3 bg-white/90 dark:bg-surface-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-border dark:border-surface-600 hover:shadow-xl transition-all duration-300"
        >
          <svg 
            className="w-6 h-6 text-text-primary dark:text-text-inverse" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M4 6h16M4 12h16M4 18h16" : "M6 18L18 6M6 6l12 12"} />
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <nav className={`
        fixed top-0 left-0 h-full z-40 bg-white/95 dark:bg-surface-800/95 backdrop-blur-xl 
        border-r border-border dark:border-surface-600 shadow-card-lg transition-all duration-500 ease-out
        ${isCollapsed ? 'w-20' : 'w-72'} 
        ${isMobile ? (isCollapsed ? '-translate-x-full' : 'translate-x-0') : ''}
        ${className}
      `}>
        
        {/* Header */}
        <div className="p-6 border-b border-border dark:border-surface-600">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="relative w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-btn-primary">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            
            {!isCollapsed && (
              <div className="animate-slide-right">
                <h1 className="text-xl font-serif font-bold bg-gradient-to-r from-primary-600 to-violet-600 bg-clip-text text-transparent">
                  PrepToDo
                </h1>
                <p className="text-sm text-text-muted">AI Study Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-2 flex-1">
          {navItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`
                group w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300
                ${activeItem === item.id 
                  ? 'bg-gradient-primary text-white shadow-btn-primary' 
                  : 'text-text-secondary dark:text-text-muted hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-text-primary dark:hover:text-text-inverse'
                }
                ${isCollapsed ? 'justify-center' : ''}
                animate-slide-up
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className={`
                text-xl transition-transform duration-300 group-hover:scale-110
                ${activeItem === item.id ? 'scale-110' : ''}
              `}>
                {item.icon}
              </span>
              
              {!isCollapsed && (
                <span className="font-medium animate-slide-right">
                  {item.label}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-16 bg-surface-800 dark:bg-surface-700 text-white px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-surface-800 dark:bg-surface-700 rotate-45" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Theme Toggle */}
        <div className="p-4 border-t border-border dark:border-surface-600">
          <div className={isCollapsed ? 'flex justify-center' : ''}>
            <ThemeToggle className={isCollapsed ? 'w-12 h-12 p-0 justify-center' : ''} />
          </div>
        </div>

        {/* Collapse Toggle (Desktop only) */}
        {!isMobile && (
          <div className="absolute -right-3 top-1/2 transform -translate-y-1/2">
            <button
              onClick={toggleSidebar}
              className="w-6 h-6 bg-white dark:bg-surface-700 border border-border dark:border-surface-600 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center group"
            >
              <svg 
                className={`w-3 h-3 text-text-muted transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}
      </nav>

      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};