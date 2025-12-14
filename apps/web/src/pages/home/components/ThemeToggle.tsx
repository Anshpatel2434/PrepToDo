import React, { useState, useEffect } from 'react';

interface FloatingThemeToggleProps {
  className?: string;
}

export const FloatingThemeToggle: React.FC<FloatingThemeToggleProps> = ({ className = "" }) => {
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
        fixed top-6 right-6 z-50 w-14 h-14 rounded-full
        flex items-center justify-center shadow-lg
        transition-all duration-300 ease-out
        focus-ring group overflow-hidden
        ${isDark
          ? 'bg-slate-800/90 hover:bg-slate-700/90 text-white border border-slate-600/50 backdrop-blur-sm'
          : 'bg-white/90 hover:bg-slate-50/90 text-gray-800 border border-gray-200/50 backdrop-blur-sm shadow-xl'
        }
        ${className}
      `}
    >
      {/* Background glow effect */}
      <div className={`
        absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
        ${isDark
          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20'
          : 'bg-gradient-to-r from-blue-100 to-purple-100'
        }
      `} />

      {/* Animated sun icon */}
      <div className={`
        relative w-6 h-6 transition-all duration-300 ease-out
        ${isDark ? 'rotate-180 scale-0' : 'rotate-0 scale-100'}
      `}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      </div>

      {/* Animated moon icon */}
      <div className={`
        absolute w-6 h-6 transition-all duration-300 ease-out
        ${isDark ? 'rotate-0 scale-100' : 'rotate-180 scale-0'}
      `}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </div>

      {/* Pulse effect on click */}
      <div className={`
        absolute inset-0 rounded-full opacity-0 group-active:opacity-100 transition-opacity duration-150
        ${isDark
          ? 'bg-gradient-to-r from-blue-400/30 to-purple-400/30'
          : 'bg-gradient-to-r from-blue-400/30 to-purple-400/30'
        }
      `} />
    </button>
  );
};