import React from 'react';
import type { Feature } from './FeatureTypes';

interface FeatureCardProps {
  feature: Feature;
  className?: string;
  onClick?: (feature: Feature) => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ 
  feature, 
  className = '',
  onClick 
}) => {
  const handleClick = () => {
    onClick?.(feature);
    // TODO: Implement routing to feature page when backend is connected
    console.log(`Navigate to feature: ${feature.path}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        group relative bg-bg-secondary border border-border-primary 
        rounded-xl p-6 hover:shadow-medium transition-all duration-300 
        cursor-pointer hover:border-accent-primary hover:-translate-y-1
        ${className}
      `}
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary text-white group-hover:scale-110 transition-transform duration-300">
        {feature.icon}
      </div>

      {/* Content */}
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-text-primary group-hover:text-accent-primary transition-colors duration-300">
          {feature.title}
        </h3>
        
        <p className="text-text-secondary leading-relaxed">
          {feature.description}
        </p>

        {/* Benefits */}
        <ul className="space-y-2">
          {feature.benefits.map((benefit, index) => (
            <li key={index} className="flex items-start space-x-2 text-sm text-text-muted">
              <svg 
                className="w-4 h-4 mt-0.5 text-accent-success flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Hover effect overlay */}
      <div className="
        absolute inset-0 rounded-xl bg-gradient-to-r from-accent-primary/5 to-accent-secondary/5 
        opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
      "></div>

      {/* Call to action */}
      <div className="mt-4 flex items-center text-accent-primary font-medium text-sm group-hover:text-accent-secondary transition-colors duration-300">
        <span>Explore Feature</span>
        <svg 
          className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

interface FeatureListProps {
  features: Feature[];
  className?: string;
  onFeatureClick?: (feature: Feature) => void;
}

export const FeatureList: React.FC<FeatureListProps> = ({ 
  features, 
  className = '',
  onFeatureClick 
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {features.map((feature) => (
        <FeatureCard 
          key={feature.id} 
          feature={feature}
          onClick={onFeatureClick}
        />
      ))}
    </div>
  );
};