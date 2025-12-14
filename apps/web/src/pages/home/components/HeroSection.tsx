import React, { useEffect, useRef } from 'react';

interface HeroSectionProps {
  onGetStarted?: () => void;
  onWatchDemo?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, onWatchDemo }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // Generate particle positions once during initialization
  const particles = React.useMemo(() => {
    const randomPositions = [
      { top: 15, left: 25, delay: 0.5, duration: 2.5 },
      { top: 35, left: 75, delay: 1.0, duration: 3.0 },
      { top: 45, left: 40, delay: 1.5, duration: 2.8 },
      { top: 65, left: 60, delay: 2.0, duration: 3.2 },
      { top: 25, left: 15, delay: 2.5, duration: 2.2 },
      { top: 75, left: 35, delay: 3.0, duration: 3.5 },
      { top: 55, left: 80, delay: 3.5, duration: 2.7 },
      { top: 85, left: 20, delay: 4.0, duration: 3.1 },
      { top: 10, left: 70, delay: 4.5, duration: 2.9 },
      { top: 40, left: 10, delay: 5.0, duration: 3.3 },
      { top: 90, left: 50, delay: 5.5, duration: 2.4 },
      { top: 30, left: 90, delay: 6.0, duration: 3.6 }
    ];
    
    return randomPositions.map((pos, i) => ({
      id: i,
      top: `${pos.top}%`,
      left: `${pos.left}%`,
      animationDelay: `${pos.delay}s`,
      animationDuration: `${pos.duration}s`
    }));
  }, []);

  useEffect(() => {
    // Animate on mount
    const timer = setTimeout(() => {
      if (heroRef.current) {
        heroRef.current.classList.add('animate-fade-in');
      }
      if (logoRef.current) {
        logoRef.current.classList.add('animate-float');
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
        className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-24 opacity-0"
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Content Section */}
          <div className="space-y-8 lg:space-y-12">
            
            {/* Brand Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100/80 dark:bg-primary-900/30 border border-primary-200/50 dark:border-primary-700/50 backdrop-blur-sm">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse-soft" />
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                AI-Powered Study Platform
              </span>
            </div>

            {/* Main Heading with Logo */}
            <div className="relative space-y-6">
              {/* Logo positioned behind heading */}
              <div className="relative flex justify-center mb-8">
                <div className="relative z-10 w-32 h-32 lg:w-40 lg:h-40">
                  {/* Logo glow effect */}
                  <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-20 animate-pulse-soft" />
                  
                  {/* Logo Image */}
                  <div className="relative w-full h-full rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
                    <img 
                      src="/icon.jpeg" 
                      alt="PrepToDo Logo" 
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-600/20 via-transparent to-transparent" />
                  </div>
                </div>
              </div>

              <h1 className="text-6xl lg:text-8xl font-serif font-bold leading-[0.9] tracking-tight">
                <span className="block bg-gradient-to-r from-text-primary dark:from-white via-primary-600 to-violet-600 bg-clip-text text-transparent">
                  PrepToDo
                </span>
                <span className="block text-3xl lg:text-4xl font-sans font-medium text-text-secondary dark:text-text-muted mt-4">
                  Your AI Study Companion
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-text-muted leading-relaxed max-w-2xl">
                Transform your learning journey with intelligent study plans, 
                adaptive practice tests, and comprehensive analytics that actually work.
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-8 py-8 border-y border-gray-200/50 dark:border-gray-700/50">
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
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onGetStarted}
                className="
                  group relative px-8 py-4 bg-gradient-primary text-white font-semibold rounded-2xl
                  shadow-btn-primary hover:shadow-btn-primary-lg transform hover:-translate-y-1
                  transition-all duration-300 ease-out focus-ring overflow-hidden
                "
              >
                <span className="relative z-10">Get Started Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-white/20 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
              </button>
              
              <button 
                onClick={onWatchDemo}
                className="
                  group px-8 py-4 bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm 
                  text-text-primary dark:text-text-inverse font-semibold rounded-2xl
                  border border-border dark:border-surface-600 hover:border-primary-300 dark:hover:border-primary-500
                  shadow-card hover:shadow-card-lg transform hover:-translate-y-1
                  transition-all duration-300 ease-out focus-ring
                "
              >
                <span className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Watch Demo
                </span>
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 pt-4 text-text-muted text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Free 14-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
            </div>
          </div>

          {/* Logo Section */}
          <div className="relative flex justify-center lg:justify-end">
            <div ref={logoRef} className="relative opacity-0">
              {/* Main Logo Container */}
              <div className="relative w-80 h-80 lg:w-96 lg:h-96">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-primary rounded-full blur-2xl opacity-30 animate-pulse-soft" />
                
                {/* Logo Image */}
                <div className="relative w-full h-full rounded-full bg-white/90 dark:bg-surface-800/90 backdrop-blur-sm border border-border/50 dark:border-surface-600/50 shadow-card-xl overflow-hidden group hover:shadow-glow-primary transition-all duration-500">
                  <img 
                    src="/icon.jpeg" 
                    alt="PrepToDo AI Study Platform" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Floating elements around logo */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center shadow-lg animate-bounce-subtle opacity-80">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <div className="absolute -bottom-2 -left-4 w-10 h-10 bg-gradient-secondary rounded-full flex items-center justify-center shadow-lg animate-bounce-subtle opacity-70" style={{ animationDelay: '1s' }}>
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <div className="absolute top-1/3 -left-6 w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center shadow-md animate-bounce-subtle opacity-60" style={{ animationDelay: '2s' }}>
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse-soft" />
                </div>
              </div>

              {/* Particle effects */}
              <div className="absolute inset-0 pointer-events-none">
                {particles.map((particle) => (
                  <div
                    key={particle.id}
                    className="absolute w-2 h-2 bg-primary-400 rounded-full animate-pulse-soft opacity-60"
                    style={{
                      top: particle.top,
                      left: particle.left,
                      animationDelay: particle.animationDelay,
                      animationDuration: particle.animationDuration
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="animate-bounce">
          <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
};