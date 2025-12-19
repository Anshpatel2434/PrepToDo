import React from "react";
import { motion } from "framer-motion";

interface StrengthWeaknessProps {
  isDark: boolean;
}

// Dummy data for strengths and weaknesses - placeholder for real user performance data
const dummyPerformanceData = {
  strengths: [
    { topic: "Reading Comprehension", score: 84, description: "Strong passage analysis skills" },
    { topic: "Grammar & Syntax", score: 81, description: "Excellent sentence structure understanding" },
    { topic: "Vocabulary", score: 78, description: "Good word recognition and context usage" }
  ],
  weaknesses: [
    { topic: "Critical Reasoning", score: 62, description: "Needs more practice with logic problems" },
    { topic: "Data Analysis", score: 58, description: "Work on interpreting charts and graphs" },
    { topic: "Inference Skills", score: 65, description: "Practice drawing logical conclusions" }
  ]
};

export const StrengthWeakness: React.FC<StrengthWeaknessProps> = ({ isDark }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  const getBorderColor = (isStrength: boolean) => {
    return isStrength 
      ? (isDark ? "border-l-brand-accent-dark" : "border-l-brand-accent-light")
      : (isDark ? "border-l-brand-secondary-dark" : "border-l-brand-secondary-light");
  };

  const PerformanceItem = ({ 
    item, 
    isStrength,
    index 
  }: { 
    item: typeof dummyPerformanceData.strengths[0]; 
    isStrength: boolean;
    index: number;
  }) => (
    <motion.div
      variants={itemVariants}
      className={`border-l-4 pl-4 py-3 ${getBorderColor(isStrength)}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4
          className={`
            font-semibold text-sm text-academic-heading
            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
          `}
        >
          {item.topic}
        </h4>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 300 }}
          className={`
            text-xs font-bold px-2 py-1 rounded text-academic-heading
            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
          `}
        >
          {item.score}%
        </motion.span>
      </div>
      <p
        className={`
          text-xs text-academic-body
          ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}
        `}
      >
        {item.description}
      </p>
      {/* Progress Bar */}
      <motion.div
        className={`
          mt-3 h-2 rounded-full overflow-hidden
          ${isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"}
        `}
      >
        <motion.div
          className={`
            h-full progress-bar-premium
            ${isStrength 
              ? (isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light")
              : (isDark ? "bg-brand-secondary-dark" : "bg-brand-secondary-light")
            }
          `}
          initial={{ width: 0 }}
          animate={{ width: `${item.score}%` }}
          transition={{ 
            duration: 1, 
            delay: 0.7 + index * 0.1,
            ease: [0.25, 0.46, 0.45, 0.94] as const
          }}
        />
      </motion.div>
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      {/* Strengths Section */}
      <motion.div
        variants={sectionVariants}
        className={`
          dashboard-card
          rounded-xl p-6 border focus-calm
          ${isDark 
            ? "bg-bg-secondary-dark border-border-dark" 
            : "bg-bg-secondary-light border-border-light"
          }
        `}
      >
        <div className="flex items-center space-x-3 mb-6">
          <motion.div 
            className="text-2xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            💪
          </motion.div>
          <div>
            <h3
              className={`
                text-xl font-semibold text-academic-heading
                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
              `}
            >
              Your Strengths
            </h3>
            <p
              className={`
                text-sm text-academic-body
                ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
              `}
            >
              Areas where you excel
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {dummyPerformanceData.strengths.map((strength, index) => (
            <PerformanceItem 
              key={index} 
              item={strength} 
              isStrength={true} 
              index={index}
            />
          ))}
        </div>
      </motion.div>

      {/* Weaknesses Section */}
      <motion.div
        variants={sectionVariants}
        className={`
          dashboard-card
          rounded-xl p-6 border focus-calm
          ${isDark 
            ? "bg-bg-secondary-dark border-border-dark" 
            : "bg-bg-secondary-light border-border-light"
          }
        `}
      >
        <div className="flex items-center space-x-3 mb-6">
          <motion.div 
            className="text-2xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
          >
            🎯
          </motion.div>
          <div>
            <h3
              className={`
                text-xl font-semibold text-academic-heading
                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
              `}
            >
              Areas to Improve
            </h3>
            <p
              className={`
                text-sm text-academic-body
                ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
              `}
            >
              Focus areas for better performance
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {dummyPerformanceData.weaknesses.map((weakness, index) => (
            <PerformanceItem 
              key={index} 
              item={weakness} 
              isStrength={false} 
              index={index}
            />
          ))}
        </div>
      </motion.div>

      {/* Overall Insight */}
      <motion.div
        variants={sectionVariants}
        className={`
          lg:col-span-2 p-4 rounded-lg border-l-4
          ${isDark 
            ? "bg-bg-tertiary-dark border-l-brand-accent-dark text-text-secondary-dark" 
            : "bg-bg-tertiary-light border-l-brand-accent-light text-text-secondary-light"
          }
        `}
      >
        <div className="flex items-start space-x-3">
          <motion.span 
            className="text-lg"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          >
            💡
          </motion.span>
          <div>
            <h5 className="font-medium mb-1 text-academic-heading">Performance Insight</h5>
            <p className="text-sm text-academic-body">
              You're performing strongest in reading and language skills. 
              Consider dedicating more time to quantitative reasoning to balance your performance.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};