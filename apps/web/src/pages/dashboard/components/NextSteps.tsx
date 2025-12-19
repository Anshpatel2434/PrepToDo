import React from "react";
import { motion } from "framer-motion";

interface NextStepsProps {
  isDark: boolean;
}

// Dummy data for next steps - based on user performance patterns
const dummyNextSteps = [
  {
    id: 1,
    type: "Practice",
    title: "Focus on Critical Reasoning",
    description: "Based on your recent performance, spending 20-30 minutes on critical reasoning problems will help strengthen this area.",
    priority: "High",
    estimatedTime: "25 min",
    icon: "🧠",
    action: "Start Practice Session"
  },
  {
    id: 2,
    type: "Review",
    title: "Review Vocabulary Set #3",
    description: "You encountered 15 unfamiliar words in recent RC passages. Reviewing these will improve your comprehension speed.",
    priority: "Medium",
    estimatedTime: "15 min",
    icon: "📚",
    action: "Review Now"
  },
  {
    id: 3,
    type: "Daily Challenge",
    title: "Complete Today's RC Challenge",
    description: "Your reading comprehension accuracy is strong. Try today's challenge to maintain momentum and maybe improve speed.",
    priority: "Low",
    estimatedTime: "30 min",
    icon: "📖",
    action: "Begin Challenge"
  }
];

export const NextSteps: React.FC<NextStepsProps> = ({ isDark }) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return isDark ? "bg-brand-accent-dark" : "bg-brand-accent-light";
      case "Medium":
        return isDark ? "bg-brand-secondary-dark" : "bg-brand-secondary-light";
      case "Low":
        return isDark ? "bg-text-muted-dark" : "bg-text-muted-light";
      default:
        return isDark ? "bg-text-muted-dark" : "bg-text-muted-light";
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case "High":
        return isDark ? "text-text-primary-dark" : "text-text-primary-light";
      case "Medium":
        return isDark ? "text-text-secondary-dark" : "text-text-secondary-light";
      case "Low":
        return isDark ? "text-text-muted-dark" : "text-text-muted-light";
      default:
        return isDark ? "text-text-muted-dark" : "text-text-muted-light";
    }
  };

  const NextStepCard = ({ step, index }: { step: typeof dummyNextSteps[0]; index: number }) => (
    <motion.div
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
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <motion.span 
            className="text-2xl"
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              repeatDelay: 2 + index * 0.5 
            }}
          >
            {step.icon}
          </motion.span>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 300 }}
                className={`
                  text-xs px-2 py-1 rounded-full font-medium text-academic-heading
                  ${getPriorityColor(step.priority)}
                  ${getPriorityTextColor(step.priority)}
                `}
              >
                {step.priority} Priority
              </motion.span>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1, type: "spring", stiffness: 300 }}
                className={`
                  text-xs px-2 py-1 rounded-full text-academic-heading
                  ${isDark ? "bg-bg-tertiary-dark text-text-muted-dark" : "bg-bg-tertiary-light text-text-muted-light"}
                `}
              >
                {step.type}
              </motion.span>
            </div>
            <h4
              className={`
                font-semibold text-academic-heading
                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
              `}
            >
              {step.title}
            </h4>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + index * 0.1 }}
          className={`
            text-xs px-2 py-1 rounded text-academic-body
            ${isDark ? "bg-bg-tertiary-dark text-text-muted-dark" : "bg-bg-tertiary-light text-text-muted-light"}
          `}
        >
          {step.estimatedTime}
        </motion.div>
      </div>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 + index * 0.1 }}
        className={`
          text-sm mb-4 text-academic-body
          ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
        `}
      >
        {step.description}
      </motion.p>

      {/* Action Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          w-full py-3 px-4 rounded-lg font-medium btn-premium focus-calm
          text-academic-heading
        `}
      >
        {step.action}
      </motion.button>
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`
        dashboard-card
        rounded-xl p-6 border focus-calm
        ${isDark 
          ? "bg-bg-secondary-dark border-border-dark" 
          : "bg-bg-secondary-light border-border-light"
        }
      `}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex items-center space-x-3 mb-2">
          <motion.div 
            className="text-2xl"
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          >
            🎯
          </motion.div>
          <h3
            className={`
              text-xl font-semibold text-academic-heading
              ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
            `}
          >
            What to Do Next
          </h3>
        </div>
        <p
          className={`
            text-sm text-academic-body
            ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
          `}
        >
          Recommended actions based on your recent performance
        </p>
      </motion.div>

      {/* Next Steps Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {dummyNextSteps.map((step, index) => (
          <NextStepCard key={step.id} step={step} index={index} />
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className={`
          p-4 rounded-lg border-l-4
          ${isDark 
            ? "bg-bg-tertiary-dark border-l-brand-accent-dark text-text-secondary-dark" 
            : "bg-bg-tertiary-light border-l-brand-accent-light text-text-secondary-light"
          }
        `}
      >
        <div className="flex items-start space-x-3">
          <motion.span 
            className="text-lg"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            💪
          </motion.span>
          <div>
            <h5 className="font-medium mb-1 text-academic-heading">Study Tip</h5>
            <p className="text-sm text-academic-body">
              Consistent daily practice is more effective than marathon sessions. 
              Try to practice at the same time each day to build a strong study habit.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Placeholder Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className={`
          mt-4 p-3 rounded-lg border text-center text-sm
          ${isDark 
            ? "bg-bg-tertiary-dark border-border-darker text-text-muted-dark" 
            : "bg-bg-tertiary-light border-border-lighter text-text-muted-light"
          }
        `}
      >
        🎯 <strong>Smart Recommendations:</strong> These suggestions will be personalized based on your real performance data
      </motion.div>
    </motion.div>
  );
};