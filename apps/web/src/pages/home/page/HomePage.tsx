import React from 'react';
import { FloatingNavigation } from '../components/FloatingNavigation';
import { FloatingThemeToggle } from '../components/ThemeToggle';
import { HeroSection } from '../components/HeroSection';
import { IntroductionSection } from '../components/IntroductionSection';
import { FeatureShowcase } from '../components/FeatureShowcase';
import { Footer } from '../components/Footer';

export const HomePage: React.FC = () => {
  const handleNavigate = (path: string, section: string) => {
    // Handle navigation throughout the app
    console.log(`Navigate to ${path} (${section})`);
    // TODO: Implement routing to other pages
    if (section === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Floating Theme Toggle */}
      <FloatingThemeToggle />
      
      {/* Floating Navigation */}
      <FloatingNavigation onNavigate={handleNavigate} />
      
      {/* Main Content */}
      <div className="transition-all duration-500 ease-out">
        
        {/* Hero Section */}
        <section data-section="home">
          <HeroSection />
        </section>

        {/* Introduction Section */}
        <section data-section="about">
          <IntroductionSection />
        </section>

        {/* Feature Showcase */}
        <section data-section="features">
          <FeatureShowcase />
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};