import React, { useEffect, useRef } from 'react';

export const HeroSection: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate on mount
    const timer = setTimeout(() => {
      if (heroRef.current) {
        heroRef.current.classList.add('animate-fade-in');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950/30">
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating geometric shapes - theme adaptive */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-400/10 to-purple-400/10 dark:from-blue-600/20 dark:to-purple-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s', animationDuration: '6s' }} />
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-teal-400/10 to-cyan-400/10 dark:from-teal-600/20 dark:to-cyan-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s', animationDuration: '8s' }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-amber-400/10 to-orange-400/10 dark:from-amber-600/20 dark:to-orange-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s', animationDuration: '7s' }} />
        
        {/* Floating orbs - theme adaptive */}
        <div className="absolute top-32 right-1/4 w-4 h-4 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce-subtle opacity-60" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-teal-400 dark:bg-teal-500 rounded-full animate-bounce-subtle opacity-50" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 right-16 w-2 h-2 bg-amber-400 dark:bg-amber-500 rounded-full animate-bounce-subtle opacity-70" style={{ animationDelay: '5s' }} />
      </div>

      <div 
        ref={heroRef}
        className="relative z-10 max-w-6xl mx-auto px-6 py-12 lg:py-24 opacity-0"
      >
        <div className="text-center space-y-12">
          
          {/* Logo positioned behind heading */}
          <div className="relative flex justify-center mb-8">
            <div className="relative z-10 w-32 h-32 lg:w-40 lg:h-40">
              {/* Logo glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse-soft" />
              
              {/* Logo Image */}
              <div className="relative w-full h-full rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
                <img 
                  src="/icon.jpeg" 
                  alt="PrepToDo Logo" 
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 via-transparent to-transparent" />
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <div className="space-y-6">
            <h1 className="text-6xl lg:text-8xl font-serif font-bold leading-[0.9] tracking-tight">
              <span className="block bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                P<span className="relative inline-block">
                  <img 
                    src="/icon.jpeg" 
                    alt="PrepToDo Logo" 
                    className="absolute -top-1 -left-1 w-16 h-16 lg:w-20 lg:h-20 object-cover rounded-full opacity-90"
                  />
                  repToDo
                </span>
              </span>
              <span className="block text-3xl lg:text-4xl font-sans font-medium text-gray-600 dark:text-gray-400 mt-4">
                Your AI Study Companion
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
              Transform your learning journey with intelligent study plans, 
              adaptive practice tests, and comprehensive analytics that actually work.
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent animate-count-up">
                AI-Powered
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Study Platform
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent animate-count-up delay-200">
                Smart
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Learning Tools
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent animate-count-up delay-400">
                Personalized
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Study Plans
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="
              group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl
              shadow-lg hover:shadow-xl transform hover:-translate-y-1
              transition-all duration-300 ease-out focus-ring overflow-hidden
            ">
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-white/20 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
            </button>
            
            <button className="
              group px-8 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm 
              text-gray-700 dark:text-gray-300 font-semibold rounded-2xl
              border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500
              shadow-lg hover:shadow-xl transform hover:-translate-y-1
              transition-all duration-300 ease-out focus-ring
            ">
              <span className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Learn More
              </span>
            </button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-4 text-gray-500 dark:text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>AI-powered learning</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Personalized study plans</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Real-time analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="animate-bounce">
          <svg className="w-6 h-6 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
};