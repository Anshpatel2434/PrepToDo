import React from 'react';
import { FloatingNavigation } from '../components/FloatingNavigation';
import { FloatingThemeToggle } from '../components/ThemeToggle';
import { HeroSection } from '../components/HeroSection';
import { IntroductionSection } from '../components/IntroductionSection';
import { FeatureShowcase } from '../components/FeatureShowcase';
import { CallToActionSection } from '../components/CallToActionSection';
import { Footer } from '../components/Footer';
import type { Feature } from '../../../ui_components/FeatureTypes';

export const HomePage: React.FC = () => {
  const handleGetStarted = () => {
    // Navigate to signup or onboarding
    console.log('Navigate to get started');
    // TODO: Implement routing to signup page
  };

  const handleWatchDemo = () => {
    // Open demo modal or navigate to demo page
    console.log('Open demo');
    // TODO: Implement demo functionality
  };

  const handleFeatureClick = (feature: Feature) => {
    // Navigate to specific feature page or show detailed view
    console.log(`Navigating to feature: ${feature.title}`);
    // TODO: Implement feature-specific navigation
  };

  const handleStartFreeTrial = () => {
    // Navigate to signup with trial offer
    console.log('Start free trial');
    // TODO: Implement trial signup
  };

  const handleViewPricing = () => {
    // Navigate to pricing page
    console.log('View pricing');
    // TODO: Implement pricing navigation
  };

  const handleNavigate = (path: string, section: string) => {
    // Handle navigation throughout the app
    console.log(`Navigate to ${path} (${section})`);
    // TODO: Implement routing to other pages
    if (section === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      {/* Floating Theme Toggle */}
      <FloatingThemeToggle />
      
      {/* Floating Navigation */}
      <FloatingNavigation onNavigate={handleNavigate} />
      
      {/* Main Content */}
      <div className="transition-all duration-500 ease-out">
        
        {/* Hero Section */}
        <section data-section="home">
          <HeroSection 
            onGetStarted={handleGetStarted}
            onWatchDemo={handleWatchDemo}
          />
        </section>

        {/* Introduction Section */}
        <section data-section="about">
          <IntroductionSection />
        </section>

        {/* Feature Showcase */}
        <section data-section="features">
          <FeatureShowcase 
            onFeatureClick={handleFeatureClick}
          />
        </section>

        {/* Call to Action */}
        <section data-section="cta">
          <CallToActionSection 
            onStartFreeTrial={handleStartFreeTrial}
            onViewPricing={handleViewPricing}
          />
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};