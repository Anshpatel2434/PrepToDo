import React, { useState, useEffect } from 'react';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  // Initialize state from localStorage or system preference
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme === 'dark' || (!savedTheme && prefersDark);
  });

  useEffect(() => {
    // Apply theme to DOM
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center gap-3 px-6 py-3 rounded-2xl
        font-medium text-sm transition-all duration-300 ease-out
        focus-ring group overflow-hidden
        ${isDark
          ? 'bg-surface-800 hover:bg-surface-750 text-text-inverse border border-surface-600 hover:border-surface-500'
          : 'bg-white hover:bg-surface-50 text-text-primary border border-border hover:border-primary-200'
        }
        ${className}
      `}
    >
      {/* Background glow effect */}
      <div className={`
        absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
        ${isDark
          ? 'bg-gradient-to-r from-primary-600/20 to-violet-600/20'
          : 'bg-gradient-to-r from-primary-100 to-violet-100'
        }
      `} />

      {/* Animated sun icon */}
      <div className={`
        relative w-5 h-5 transition-transform duration-300 ease-out
        ${isDark ? 'rotate-180 scale-0' : 'rotate-0 scale-100'}
      `}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      </div>

      {/* Animated moon icon */}
      <div className={`
        absolute w-5 h-5 transition-transform duration-300 ease-out
        ${isDark ? 'rotate-0 scale-100' : 'rotate-180 scale-0'}
      `}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </div>

      <span className="relative font-medium">
        {isDark ? 'Dark Mode' : 'Light Mode'}
      </span>

      {/* Pulse effect */}
      <div className={`
        absolute inset-0 rounded-2xl opacity-0 group-active:opacity-100 transition-opacity duration-150
        bg-gradient-to-r from-primary-400/30 to-violet-400/30
      `} />
    </button>
  );
};