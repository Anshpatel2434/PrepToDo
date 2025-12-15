import React, { useState, useEffect, useRef } from 'react';
import { MdMenuBook, MdQuiz, MdSpellcheck, MdInsertChart, MdPeople, MdAutoAwesome } from 'react-icons/md';

interface FeatureShowcaseProps {
    isDark: boolean;
}

const features = [
  {
    id: 'reading-practice',
    title: 'Daily Reading Comprehension',
    description: 'Timed RC practice sessions with microlearning passages, difficulty selection, and built-in analytics.',
    icon: MdMenuBook,
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
    icon: MdQuiz,
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
    icon: MdSpellcheck,
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
    icon: MdInsertChart,
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
    icon: MdPeople,
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
    icon: MdAutoAwesome,
    benefits: [
      '24/7 availability',
      'Personalized guidance',
      'Instant feedback',
      'Smart recommendations'
    ],
    path: '/ai-tutor'
  }
];

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ isDark }) => {
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

  return (
    <section
      className={`py-24 transition-colors duration-300 ${
        isDark
          ? 'bg-bg-primary-dark'
          : 'bg-bg-primary-light'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-20">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm mb-6 border transition-colors duration-300 ${
              isDark
                ? 'bg-brand-secondary-dark/20 border-brand-secondary-dark/30'
                : 'bg-brand-secondary-light/20 border-brand-secondary-light/30'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full animate-pulse-soft ${
                isDark ? 'bg-brand-secondary-dark' : 'bg-brand-secondary-light'
              }`}
            />
            <span
              className={`text-sm font-medium transition-colors duration-300 ${
                isDark
                  ? 'text-brand-secondary-dark'
                  : 'text-brand-secondary-light'
              }`}
            >
              Powerful Features
            </span>
          </div>
          
          <h2 className="text-5xl lg:text-6xl font-serif font-bold mb-6">
            <span className={`transition-colors duration-300 ${
              isDark ? 'text-text-primary-dark' : 'text-text-primary-light'
            }`}>
              Transform Your
            </span>
            <br />
            <span className={`transition-colors duration-300 ${
              isDark ? 'text-brand-secondary-dark' : 'text-brand-secondary-light'
            }`}>
              Study Experience
            </span>
          </h2>
          
          <p
            className={`text-xl leading-relaxed max-w-3xl mx-auto transition-colors duration-300 ${
              isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'
            }`}
          >
            Discover how PrepToDo's comprehensive suite of AI-powered tools can revolutionize 
            your learning journey and accelerate your academic growth.
          </p>
        </div>

        {/* Features Grid */}
        <div 
          ref={containerRef}
          className="grid lg:grid-cols-2 gap-8 lg:gap-12"
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.id}
                data-feature-id={feature.id}
                data-index={index}
                className={`
                  group relative p-8 lg:p-10 rounded-3xl border transition-all duration-500 ease-out cursor-pointer
                  ${
                    isDark
                      ? 'bg-bg-secondary-dark/80 border-border-dark hover:border-border-darker'
                      : 'bg-bg-secondary-light/80 border-border-light hover:border-border-lighter'
                  }
                  shadow-lg hover:shadow-xl
                  ${visibleFeatures.has(feature.id) 
                    ? 'animate-slide-up opacity-100 translate-y-0' 
                    : `opacity-0 ${index % 2 === 0 ? '-translate-x-16' : 'translate-x-16'} translate-y-8`
                  }
                  ${hoveredFeature === feature.id ? 'transform -translate-y-2' : ''}
                `}
                style={{ animationDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredFeature(feature.id)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                
                {/* Background overlay - theme adaptive */}
                <div
                  className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-3 transition-opacity duration-500 ${
                    isDark
                      ? 'bg-brand-primary-dark'
                      : 'bg-brand-primary-light'
                  }`}
                />

                {/* Feature Header */}
                <div className="relative z-10 flex items-start gap-6 mb-6">
                  
                  {/* Icon */}
                  <div
                    className={`relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300 ${
                      isDark
                        ? 'bg-brand-primary-dark'
                        : 'bg-brand-primary-light'
                    }`}
                  >
                    <span className={`relative z-10 text-2xl ${
                      isDark ? 'text-text-primary-dark' : 'text-text-primary-light'
                    }`}>
                      <IconComponent />
                    </span>
                    
                    {/* Icon glow effect */}
                    <div
                      className={`absolute inset-0 rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${
                        isDark
                          ? 'bg-brand-primary-dark'
                          : 'bg-brand-primary-light'
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <h3
                      className={`text-2xl lg:text-3xl font-bold transition-colors duration-300 group-hover:${
                        isDark ? 'text-brand-secondary-dark' : 'text-brand-secondary-light'
                      } ${
                        isDark ? 'text-text-primary-dark' : 'text-text-primary-light'
                      }`}
                    >
                      {feature.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p
                  className={`text-lg leading-relaxed mb-6 relative z-10 transition-colors duration-300 ${
                    isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'
                  }`}
                >
                  {feature.description}
                </p>

                {/* Demo Image */}
                <div className="mb-6 relative z-10">
                  <div
                    className={`w-full h-48 rounded-2xl overflow-hidden shadow-md border transition-colors duration-300 ${
                      isDark
                        ? 'border-border-dark bg-bg-tertiary-dark'
                        : 'border-border-light bg-bg-tertiary-light'
                    }`}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      {/* Demo image placeholder */}
                      <div className="text-center">
                        <div
                          className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto ${
                            isDark ? 'bg-brand-primary-dark/20' : 'bg-brand-primary-light/20'
                          }`}
                        >
                          <span className={`text-3xl ${
                            isDark ? 'text-brand-primary-dark' : 'text-brand-primary-light'
                          }`}>
                            <IconComponent />
                          </span>
                        </div>
                        <p
                          className={`text-sm font-medium ${
                            isDark ? 'text-text-muted-dark' : 'text-text-muted-light'
                          }`}
                        >
                          {feature.title} Preview
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isDark ? 'text-text-muted-dark' : 'text-text-muted-light'
                          }`}
                        >
                          Interactive demo coming soon
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benefits List */}
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  {feature.benefits.map((benefit, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-3 group/item"
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shadow-sm transform group-hover/item:scale-110 transition-transform duration-200 ${
                          isDark
                            ? 'bg-brand-primary-dark'
                            : 'bg-brand-primary-light'
                        }`}
                      >
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span
                        className={`text-sm font-medium transition-colors duration-200 group-hover/item:${
                          isDark ? 'text-text-primary-dark' : 'text-text-primary-light'
                        } ${
                          isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'
                        }`}
                      >
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Hover action indicator */}
                <div
                  className={`
                    absolute top-6 right-6 w-8 h-8 rounded-full border-2
                    flex items-center justify-center opacity-0 group-hover:opacity-100
                    transform scale-75 group-hover:scale-100 transition-all duration-300
                    ${
                      isDark
                        ? 'border-brand-secondary-dark text-brand-secondary-dark'
                        : 'border-brand-secondary-light text-brand-secondary-light'
                    }
                  `}
                >
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
                        absolute w-1 h-1 rounded-full opacity-0 group-hover:opacity-100
                        transition-all duration-700 ease-out
                        ${hoveredFeature === feature.id ? 'animate-float' : ''}
                        ${isDark ? 'bg-brand-primary-dark' : 'bg-brand-primary-light'}
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
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <button
              className={`
                px-8 py-4 text-white font-semibold rounded-2xl
                shadow-lg hover:shadow-xl transform hover:-translate-y-1
                transition-all duration-300 ease-out focus-ring
                ${
                  isDark
                    ? 'bg-brand-primary-dark hover:bg-brand-primary-hover-dark'
                    : 'bg-brand-primary-light hover:bg-brand-primary-hover-light'
                }
              `}
            >
              <span>Explore All Features</span>
            </button>
            <button
              className={`
                px-8 py-4 backdrop-blur-sm font-semibold rounded-2xl
                shadow-lg hover:shadow-xl transform hover:-translate-y-1
                transition-all duration-300 ease-out focus-ring border
                ${
                  isDark
                    ? 'bg-bg-secondary-dark/80 text-text-secondary-dark border-border-darker hover:border-brand-primary-dark'
                    : 'bg-bg-secondary-light/80 text-text-secondary-light border-border-lighter hover:border-brand-primary-light'
                }
              `}
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};