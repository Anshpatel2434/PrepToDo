import React from 'react';
import { FloatingThemeToggle } from './ThemeToggle';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  description?: string;
}

interface CollapsibleSidebarProps {
  className?: string;
  navItems?: NavItem[];
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({ 
  className = '',
  navItems = defaultNavItems 
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [activeItem, setActiveItem] = React.useState('home');

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleItemClick = (item: NavItem) => {
    setActiveItem(item.id);
    // TODO: Implement routing logic when backend is connected
    console.log(`Navigate to: ${item.path}`);
  };

  return (
    <div className={`
      fixed left-0 top-0 h-screen bg-bg-secondary border-r border-border-primary 
      transition-all duration-300 ease-in-out z-50 flex flex-col
      ${isCollapsed ? 'w-16' : 'w-64'}
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-primary">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <rect x="6" y="4" width="20" height="24" rx="2" fill="white" />
                <rect x="10" y="8" width="12" height="3" rx="1.5" fill="#3b82f6"/>
                <circle cx="9" cy="6" r="2" fill="#3b82f6"/>
                <circle cx="23" cy="6" r="2" fill="#3b82f6"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-text-primary">PrepToDo</h1>
          </div>
        )}
        
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`h-5 w-5 text-text-secondary transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={`
              w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 
              hover:bg-bg-tertiary group relative
              ${activeItem === item.id 
                ? 'bg-accent-primary text-white shadow-soft' 
                : 'text-text-secondary hover:text-text-primary'
              }
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? item.label : undefined}
          >
            <div className={`
              flex-shrink-0 transition-colors duration-200
              ${activeItem === item.id ? 'text-white' : 'text-text-muted group-hover:text-text-primary'}
            `}>
              {item.icon}
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 text-left">
                <div className="font-medium">{item.label}</div>
                {item.description && (
                  <div className="text-sm opacity-75">{item.description}</div>
                )}
              </div>
            )}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="
                absolute left-full ml-2 px-3 py-2 bg-bg-primary border border-border-primary 
                rounded-lg shadow-medium text-sm font-medium text-text-primary
                opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                transition-all duration-200 whitespace-nowrap z-50
              ">
                {item.label}
                {item.description && (
                  <div className="text-text-muted text-xs mt-1">{item.description}</div>
                )}
                <div className="
                  absolute right-full top-1/2 transform -translate-y-1/2
                  w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-bg-primary
                "></div>
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-border-primary">
        <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center`}>
          {!isCollapsed && (
            <span className="text-sm text-text-muted">Theme</span>
          )}
          <FloatingThemeToggle />
        </div>
      </div>
    </div>
  );
};

// Default navigation items for study platform
const defaultNavItems: NavItem[] = [
  {
    id: 'home',
    label: 'Dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    path: '/dashboard',
    description: 'Overview & quick access'
  },
  {
    id: 'courses',
    label: 'Courses',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    path: '/courses',
    description: 'Study materials & lessons'
  },
  {
    id: 'practice',
    label: 'Practice',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    path: '/practice',
    description: 'Tests & exercises'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    path: '/analytics',
    description: 'Progress & insights'
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    path: '/resources',
    description: 'Study tools & files'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    path: '/settings',
    description: 'Preferences & account'
  }
];