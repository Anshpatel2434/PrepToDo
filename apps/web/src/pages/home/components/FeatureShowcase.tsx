import React, { useState, useEffect, useRef } from 'react';
import type { Feature } from '../../../ui_components/FeatureTypes';

const features: Feature[] = [
  {
    id: 'reading-practice',
    title: 'Daily Reading Comprehension',
    description: 'Timed RC practice sessions with microlearning passages, difficulty selection, and built-in analytics.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    benefits: [
      'Adaptive difficulty levels',
      'Real exam simulation',
      'Progress tracking',
      'Streak-based motivation'
    ],
    path: '/reading-practice'
  },
  {
    id: 'varc-drills',
    title: 'VARC Question Engine',
    description: 'Interactive drills for para jumbles, summaries, critical reasoning, and vocabulary with AI assistance.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    benefits: [
      'Multiple question types',
      'Auto-checked answers',
      'Detailed explanations',
      'AI-powered hints'
    ],
    path: '/varc-drills'
  },
  {
    id: 'vocabulary-builder',
    title: 'Smart Vocabulary Builder',
    description: 'Personal dictionary with spaced repetition, mnemonics, and words saved directly from your reading.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    benefits: [
      'Spaced repetition system',
      'Personal mnemonics',
      'Context-based learning',
      'Mastery tracking'
    ],
    path: '/vocabulary-builder'
  },
  {
    id: 'analytics-dashboard',
    title: 'Performance Analytics',
    description: 'Comprehensive dashboard with visualizations, peer comparisons, and real-time progress updates.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    benefits: [
      'Visual progress tracking',
      'Peer comparisons',
      'Topic-wise mastery',
      'Real-time insights'
    ],
    path: '/analytics'
  },
  {
    id: 'social-learning',
    title: 'Social Learning Hub',
    description: 'Leaderboards, study groups, and peer challenges to keep you motivated and engaged.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    benefits: [
      'Daily leaderboards',
      'Study groups',
      'Peer challenges',
      'Achievement system'
    ],
    path: '/social-learning'
  },
  {
    id: 'ai-tutor',
    title: 'AI Study Tutor',
    description: '24/7 AI assistance with content generation, instant feedback, and personalized study recommendations.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    benefits: [
      '24/7 availability',
      'Personalized guidance',
      'Instant feedback',
      'Smart recommendations'
    ],
    path: '/ai-tutor'
  }
];

interface FeatureShowcaseProps {
  onFeatureClick?: (feature: Feature) => void;
}

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ onFeatureClick }) => {
  const [visibleFeatures, setVisibleFeatures] = useState<Set<string>>(new Set());
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const featureId = entry.target.getAttribute('data-feature-id');
            if (featureId) {
              setVisibleFeatures(prev => new Set([...prev, featureId]));
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    const featureElements = containerRef.current?.querySelectorAll('[data-feature-id]');
    featureElements?.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleFeatureClick = (feature: Feature) => {
    // Add micro-interaction animation
    const element = containerRef.current?.querySelector(`[data-feature-id="${feature.id}"]`);
    if (element) {
      element.classList.add('animate-scale-in-bounce');
      setTimeout(() => {
        element.classList.remove('animate-scale-in-bounce');
      }, 500);
    }
    onFeatureClick?.(feature);
  };

  return (
    <section className="py-24 bg-gradient-to-b from-surface-50 to-white dark:from-surface-900 dark:to-surface-800">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-100/80 dark:bg-secondary-900/30 border border-secondary-200/50 dark:border-secondary-700/50 backdrop-blur-sm mb-6">
            <div className="w-2 h-2 bg-secondary-500 rounded-full animate-pulse-soft" />
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Powerful Features
            </span>
          </div>
          
          <h2 className="text-5xl lg:text-6xl font-serif font-bold mb-6">
            <span className="bg-gradient-to-r from-text-primary via-primary-600 to-violet-600 bg-clip-text text-transparent">
              Transform Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-secondary-600 to-accent-600 bg-clip-text text-transparent">
              Study Experience
            </span>
          </h2>
          
          <p className="text-xl text-text-muted leading-relaxed max-w-3xl mx-auto">
            Discover how PrepToDo's comprehensive suite of AI-powered tools can revolutionize 
            your learning journey and accelerate your academic growth.
          </p>
        </div>

        {/* Features Grid */}
        <div 
          ref={containerRef}
          className="grid lg:grid-cols-2 gap-8 lg:gap-12"
        >
          {features.map((feature, index) => (
            <div
              key={feature.id}
              data-feature-id={feature.id}
              className={`
                group relative p-8 lg:p-10 rounded-3xl border border-border/50 dark:border-surface-600/50 
                bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm shadow-card hover:shadow-card-xl
                transition-all duration-500 ease-out cursor-pointer
                ${visibleFeatures.has(feature.id) 
                  ? 'animate-slide-up opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
                }
                ${hoveredFeature === feature.id ? 'transform -translate-y-2' : ''}
              `}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => handleFeatureClick(feature)}
              onMouseEnter={() => setHoveredFeature(feature.id)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              
              {/* Background gradient overlay */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br from-primary-500 to-violet-500" />

              {/* Feature Header */}
              <div className="relative z-10 flex items-start gap-6 mb-6">
                
                {/* Icon */}
                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br from-primary-500 to-violet-500 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <span className="relative z-10">{feature.icon}</span>
                  
                  {/* Icon glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <h3 className="text-2xl lg:text-3xl font-bold text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-lg text-text-secondary leading-relaxed mb-6 relative z-10">
                {feature.description}
              </p>

              {/* Benefits List */}
              <div className="grid grid-cols-2 gap-3 relative z-10">
                {feature.benefits.map((benefit, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-3 group/item"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-sm transform group-hover/item:scale-110 transition-transform duration-200">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-text-muted group-hover/item:text-text-primary transition-colors duration-200">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              {/* Hover action indicator */}
              <div className={`
                absolute top-6 right-6 w-8 h-8 rounded-full border-2 border-current
                flex items-center justify-center opacity-0 group-hover:opacity-100
                transform scale-75 group-hover:scale-100 transition-all duration-300
                text-text-muted group-hover:text-primary-500
              `}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Floating particles on hover */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`
                      absolute w-1 h-1 bg-primary-400 rounded-full opacity-0 group-hover:opacity-100
                      transition-all duration-700 ease-out
                      ${hoveredFeature === feature.id ? 'animate-float' : ''}
                    `}
                    style={{
                      top: `${20 + Math.random() * 60}%`,
                      left: `${10 + Math.random() * 80}%`,
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: `${2 + Math.random()}s`
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <button className="
              px-8 py-4 bg-gradient-primary text-white font-semibold rounded-2xl
              shadow-btn-primary hover:shadow-btn-primary-lg transform hover:-translate-y-1
              transition-all duration-300 ease-out focus-ring
            ">
              Explore All Features
            </button>
            <button className="
              px-8 py-4 bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm 
              text-text-primary dark:text-text-inverse font-semibold rounded-2xl
              border border-border dark:border-surface-600 hover:border-primary-300 dark:hover:border-primary-500
              shadow-card hover:shadow-card-lg transform hover:-translate-y-1
              transition-all duration-300 ease-out focus-ring
            ">
              Start Free Trial
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};