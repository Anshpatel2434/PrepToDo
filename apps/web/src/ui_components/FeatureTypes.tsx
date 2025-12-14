import React from 'react';

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
  path: string;
}

export const defaultFeatures: Feature[] = [
  {
    id: 'ai-study-plans',
    title: 'AI-Generated Study Plans',
    description: 'Personalized study schedules powered by advanced AI that adapts to your learning pace and exam timeline.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    benefits: [
      'Custom study schedules based on your goals',
      'Adaptive difficulty progression',
      'Integration with exam dates and deadlines',
      'Regular plan updates based on progress'
    ],
    path: '/study-plans'
  },
  {
    id: 'smart-notes',
    title: 'Smart Note-Taking',
    description: 'Intelligent note organization and summarization that helps you retain information more effectively.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    benefits: [
      'Auto-generated summaries and key points',
      'Topic-based organization and tagging',
      'Cross-referencing with related concepts',
      'Export to various formats'
    ],
    path: '/notes'
  },
  {
    id: 'practice-tests',
    title: 'Adaptive Practice Tests',
    description: 'Dynamic practice sessions that adjust difficulty based on your performance and focus on weak areas.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    benefits: [
      'Personalized question difficulty',
      'Instant feedback and explanations',
      'Performance analytics and insights',
      'Exam simulation with timing'
    ],
    path: '/practice'
  },
  {
    id: 'progress-analytics',
    title: 'Progress Analytics',
    description: 'Comprehensive insights into your learning journey with detailed analytics and performance tracking.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    benefits: [
      'Detailed performance metrics',
      'Learning pace optimization',
      'Weakness identification',
      'Goal achievement tracking'
    ],
    path: '/analytics'
  },
  {
    id: 'collaborative-study',
    title: 'Collaborative Study Groups',
    description: 'Connect with peers, share resources, and study together in virtual group sessions.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    benefits: [
      'Create and join study groups',
      'Share notes and resources',
      'Group practice sessions',
      'Peer progress tracking'
    ],
    path: '/groups'
  },
  {
    id: 'resource-library',
    title: 'Resource Library',
    description: 'Extensive collection of study materials, reference books, and supplementary resources.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    benefits: [
      'Curated study materials',
      'Multiple resource formats',
      'Advanced search and filters',
      'Personal collections and bookmarks'
    ],
    path: '/resources'
  }
];