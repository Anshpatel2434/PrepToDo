import React, { useState, useEffect, useRef } from 'react';
import { 
  FaBookOpen,
  FaTasks,
  FaLanguage,
  FaChartBar,
  FaUsers,
  FaLightbulb,
  FaCheck
} from 'react-icons/fa';

interface FeatureShowcaseProps {
  isDark?: boolean;
}

const features = [
  {
    id: 'reading-practice',
    title: 'Daily Reading Comprehension',
    description: 'Timed RC practice sessions with microlearning passages, difficulty selection, and built-in analytics.',
    icon: <FaBookOpen className="w-8 h-8" />,
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
    icon: <FaTasks className="w-8 h-8" />,
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
    icon: <FaLanguage className="w-8 h-8" />,
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
    icon: <FaChartBar className="w-8 h-8" />,
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
    icon: <FaUsers className="w-8 h-8" />,
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
    icon: <FaLightbulb className="w-8 h-8" />,
    benefits: [
      '24/7 availability',
      'Personalized guidance',
      'Instant feedback',
      'Smart recommendations'
    ],
    path: '/ai-tutor'
  }
];

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ isDark = false }) => {
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
    <section className="py-24 bg-gradient-to-b from-bg-tertiary-light to-bg-primary-light dark:from-bg-tertiary-dark dark:to-bg-secondary-dark relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-gradient-to-br from-brand-primary-dark/20 to-brand-primary-dark/20' : 'bg-gradient-to-br from-brand-primary-light/10 to-brand-primary-light/10'}`} />
        <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-gradient-to-br from-brand-secondary-dark/20 to-brand-secondary-dark/20' : 'bg-gradient-to-br from-brand-secondary-light/10 to-brand-secondary-light/10'}`} />
        <div className={`absolute top-1/3 right-10 w-2 h-20 rounded-full transform rotate-45 animate-bounce-subtle ${isDark ? 'bg-gradient-to-b from-academic-primary-dark/40 to-transparent' : 'bg-gradient-to-b from-academic-primary-light/30 to-transparent'}`} style={{ animationDelay: '1s' }} />
        <div className={`absolute bottom-1/3 left-10 w-2 h-16 rounded-full transform -rotate-45 animate-bounce-subtle ${isDark ? 'bg-gradient-to-b from-brand-secondary-dark/40 to-transparent' : 'bg-gradient-to-b from-brand-secondary-light/30 to-transparent'}`} style={{ animationDelay: '2s' }} />
      </div>
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-secondary-light/10 dark:bg-brand-secondary-dark/20 border border-brand-secondary-light/20 dark:border-brand-secondary-dark/30 backdrop-blur-sm mb-6">
            <div className="w-2 h-2 bg-brand-secondary-light dark:bg-brand-secondary-dark rounded-full animate-pulse-soft" />
            <span className="text-sm font-medium text-brand-secondary-light dark:text-brand-secondary-dark">
              Powerful Features
            </span>
          </div>
          
          <h2 className="text-5xl lg:text-6xl font-serif font-bold mb-6">
            <span className="bg-gradient-to-r from-text-primary-light via-academic-primary-light to-brand-primary-light dark:from-text-primary-dark dark:via-academic-primary-dark dark:to-brand-primary-dark bg-clip-text text-transparent">
              Transform Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-brand-secondary-light to-brand-accent-light dark:from-brand-secondary-dark dark:to-brand-accent-dark bg-clip-text text-transparent">
              Study Experience
            </span>
          </h2>
          
          <p className="text-xl text-text-secondary-light dark:text-text-secondary-dark leading-relaxed max-w-3xl mx-auto">
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
              data-index={index}
              className={`
                group relative p-8 lg:p-10 rounded-3xl border border-border-light dark:border-border-dark 
                bg-bg-primary-light/80 dark:bg-bg-secondary-dark/80 backdrop-blur-sm shadow-lg hover:shadow-xl
                transition-all duration-500 ease-out cursor-pointer
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
              
              {/* Background gradient overlay */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br from-blue-500 to-purple-500" />

              {/* Feature Header */}
              <div className="relative z-10 flex items-start gap-6 mb-6">
                
                {/* Icon */}
                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br from-academic-primary-light to-brand-primary-light dark:from-academic-primary-dark dark:to-brand-primary-dark shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <span className="relative z-10 text-white">{feature.icon}</span>
                  
                  {/* Icon glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-academic-primary-light to-brand-primary-light dark:from-academic-primary-dark dark:to-brand-primary-dark blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <h3 className="text-2xl lg:text-3xl font-bold text-text-primary-light dark:text-text-primary-dark group-hover:text-academic-primary-light dark:group-hover:text-academic-primary-dark transition-colors duration-300">
                    {feature.title}
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark leading-relaxed mb-6 relative z-10">
                {feature.description}
              </p>

              {/* Benefits List */}
              <div className="grid grid-cols-2 gap-3 relative z-10">
                {feature.benefits.map((benefit, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-3 group/item"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-academic-success-light to-brand-secondary-light dark:from-academic-success-dark dark:to-brand-secondary-dark flex items-center justify-center shadow-sm transform group-hover/item:scale-110 transition-transform duration-200">
                      <FaCheck className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark group-hover/item:text-text-primary-light dark:group-hover/item:text-text-primary-dark transition-colors duration-200">
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
              px-8 py-4 bg-gradient-to-r from-academic-primary-light to-brand-primary-light dark:from-academic-primary-dark dark:to-brand-primary-dark text-white font-semibold rounded-2xl
              shadow-lg hover:shadow-xl transform hover:-translate-y-1
              transition-all duration-300 ease-out focus:ring-2 focus:ring-academic-primary-light dark:focus:ring-academic-primary-dark
            ">
              Explore All Features
            </button>
            <button className="
              px-8 py-4 bg-bg-primary-light/80 dark:bg-bg-secondary-dark/80 backdrop-blur-sm 
              text-text-primary-light dark:text-text-primary-dark font-semibold rounded-2xl
              border border-border-light dark:border-border-dark hover:border-academic-primary-light dark:hover:border-academic-primary-dark
              shadow-lg hover:shadow-xl transform hover:-translate-y-1
              transition-all duration-300 ease-out focus:ring-2 focus:ring-academic-primary-light dark:focus:ring-academic-primary-dark
            ">
              Start Free Trial
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};