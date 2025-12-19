import React from "react";
import { motion } from "framer-motion";

interface SummaryCardsProps {
  isDark: boolean;
}

// Dummy data - placeholder for real user stats
const dummyStats = {
  totalQuestions: 1247,
  overallAccuracy: 73,
  totalMinutes: 185,
  currentStreak: 7
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({ isDark }) => {
  const cards = [
    {
      title: "Questions Practiced",
      value: dummyStats.totalQuestions.toLocaleString(),
      icon: "📝",
      description: "Total attempts across all topics"
    },
    {
      title: "Overall Accuracy",
      value: `${dummyStats.overallAccuracy}%`,
      icon: "🎯",
      description: "Average across all sections"
    },
    {
      title: "Study Time",
      value: `${Math.floor(dummyStats.totalMinutes / 60)}h ${dummyStats.totalMinutes % 60}m`,
      icon: "⏱️",
      description: "Total time spent practicing"
    },
    {
      title: "Current Streak",
      value: dummyStats.currentStreak.toString(),
      icon: "🔥",
      description: "Days of consistent practice"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((card, index) => (
        <motion.div
          key={index}
          variants={cardVariants}
          className={`
            dashboard-card
            rounded-xl p-6 border focus-calm
            ${isDark 
              ? "bg-bg-secondary-dark border-border-dark" 
              : "bg-bg-secondary-light border-border-light"
            }
          `}
        >
          {/* Icon */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{card.icon}</span>
            <div
              className={`
                w-3 h-3 rounded-full
                ${card.title === "Current Streak" && dummyStats.currentStreak >= 5 
                  ? (isDark ? "bg-brand-accent-dark" : "bg-brand-accent-light")
                  : (isDark ? "bg-text-muted-dark" : "bg-text-muted-light")
                }
              `}
            />
          </div>

          {/* Value */}
          <div className="mb-2">
            <motion.h3
              className={`
                stat-number
                text-2xl md:text-3xl font-bold
                text-academic-heading
                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
              `}
            >
              {card.value}
            </motion.h3>
          </div>

          {/* Title & Description */}
          <div>
            <h4
              className={`
                text-sm font-semibold mb-1
                text-academic-body
                ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
              `}
            >
              {card.title}
            </h4>
            <p
              className={`
                text-xs text-academic-body
                ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}
              `}
            >
              {card.description}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};