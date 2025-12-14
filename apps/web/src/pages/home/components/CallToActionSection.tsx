import React, { useState, useEffect, useRef } from 'react';

interface CallToActionSectionProps {
  onStartFreeTrial?: () => void;
  onViewPricing?: () => void;
}

export const CallToActionSection: React.FC<CallToActionSectionProps> = ({ 
  onStartFreeTrial, 
  onViewPricing 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [particleCount, setParticleCount] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Generate particle positions once during initialization
  const particles = React.useMemo(() => {
    const randomPositions = [
      { top: 10, left: 15, delay: 0.2, duration: 2.1 },
      { top: 25, left: 85, delay: 0.5, duration: 3.2 },
      { top: 40, left: 30, delay: 0.8, duration: 2.7 },
      { top: 55, left: 70, delay: 1.1, duration: 4.1 },
      { top: 70, left: 20, delay: 1.4, duration: 2.9 },
      { top: 85, left: 60, delay: 1.7, duration: 3.6 },
      { top: 15, left: 90, delay: 2.0, duration: 2.3 },
      { top: 35, left: 10, delay: 2.3, duration: 3.8 },
      { top: 50, left: 50, delay: 2.6, duration: 2.6 },
      { top: 65, left: 35, delay: 2.9, duration: 4.2 }
    ];
    
    return [...Array(50)].map((_, i) => {
      const pos = randomPositions[i % randomPositions.length];
      return {
        id: i,
        top: `${pos.top + (i % 3) * 8}%`,
        left: `${pos.left + (i % 4) * 12}%`,
        animationDelay: `${pos.delay + (i % 5) * 0.6}s`,
        animationDuration: `${pos.duration + (i % 3) * 0.5}s`
      };
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Animate particle count
          let count = 0;
          const particleTimer = setInterval(() => {
            count += 2;
            setParticleCount(count);
            if (count >= 50) {
              clearInterval(particleTimer);
            }
          }, 30);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleButtonClick = (action: () => void, buttonType: string) => {
    // Add confetti effect
    const button = sectionRef.current?.querySelector(`[data-button="${buttonType}"]`);
    if (button) {
      button.classList.add('animate-scale-in-bounce');
      setTimeout(() => {
        button.classList.remove('animate-scale-in-bounce');
      }, 500);
    }
    action();
  };

  return (
    <section 
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-teal-600 dark:from-slate-800 dark:via-slate-700 dark:to-slate-900"
    >
      
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Animated overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent animate-shimmer" />
        <div className="absolute inset-0 bg-gradient-to-bl from-black/10 via-transparent to-black/5" />
        
        {/* Animated background shapes */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 dark:bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s', animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 dark:bg-white/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s', animationDuration: '10s' }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.slice(0, particleCount).map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-white/30 dark:bg-white/20 rounded-full animate-float"
            style={{
              top: particle.top,
              left: particle.left,
              animationDelay: particle.animationDelay,
              animationDuration: particle.animationDuration
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        
        {/* Main CTA Content */}
        <div className={`
          space-y-8 lg:space-y-12 transition-all duration-1000 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
        `}>
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse-soft" />
            <span className="text-sm font-semibold text-white">
              Join 100,000+ Students
            </span>
          </div>

          {/* Main Heading */}
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-6xl xl:text-7xl font-serif font-bold leading-tight">
              <span className="block text-white">
                Ready to Transform
              </span>
              <span className="block bg-gradient-to-r from-accent-200 to-white bg-clip-text text-transparent">
                Your Study Journey?
              </span>
            </h2>
            
            <p className="text-xl lg:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto">
              Join thousands of students who have already revolutionized their learning journey with PrepToDo. 
              Start your personalized AI-powered study plan today.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
            
            {/* Primary CTA */}
            <button 
              data-button="primary"
              onClick={() => handleButtonClick(() => onStartFreeTrial?.(), 'primary')}
              className="
                group relative px-10 py-5 bg-white text-primary-600 font-bold text-lg rounded-2xl
                shadow-2xl hover:shadow-white/25 transform hover:-translate-y-2 hover:scale-105
                transition-all duration-300 ease-out focus-ring overflow-hidden
              "
            >
              <span className="relative z-10 flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Free Trial
              </span>
              
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
              
              {/* Pulse effect */}
              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-active:opacity-100 transition-opacity duration-150" />
            </button>

            {/* Secondary CTA */}
            <button 
              data-button="secondary"
              onClick={() => handleButtonClick(() => onViewPricing?.(), 'secondary')}
              className="
                group px-10 py-5 bg-white/20 backdrop-blur-sm text-white font-bold text-lg rounded-2xl
                border-2 border-white/30 hover:border-white/50 hover:bg-white/30
                shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105
                transition-all duration-300 ease-out focus-ring
              "
            >
              <span className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                View Pricing
              </span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-12 text-white/90 dark:text-white/80">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">AI-powered learning</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Personalized study plans</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Real-time analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-20 fill-current text-white">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>
    </section>
  );
};