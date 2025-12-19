import React from "react";
import { motion } from "framer-motion";

interface ProgressChartProps {
  isDark: boolean;
}

// Dummy data for progress over time - placeholder for real user data
const dummyProgressData = [
  { week: "Week 1", accuracy: 65, questions: 120 },
  { week: "Week 2", accuracy: 68, questions: 150 },
  { week: "Week 3", accuracy: 71, questions: 180 },
  { week: "Week 4", accuracy: 73, questions: 200 },
  { week: "Week 5", accuracy: 75, questions: 220 },
  { week: "Week 6", accuracy: 73, questions: 190 },
  { week: "Current", accuracy: 76, questions: 140 }
];

export const ProgressChart: React.FC<ProgressChartProps> = ({ isDark }) => {
  const maxAccuracy = Math.max(...dummyProgressData.map(d => d.accuracy));

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

  const chartVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: 0.2,
      },
    },
  };

  const barVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: (i: number) => ({
      height: "auto",
      opacity: 1,
      transition: {
        height: {
          duration: 0.8,
          delay: 0.3 + i * 0.1,
          ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
        opacity: {
          duration: 0.3,
          delay: 0.3 + i * 0.1,
        },
      },
    }),
  };

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
      <div className="mb-6">
        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`
            text-xl font-semibold mb-2 text-academic-heading
            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
          `}
        >
          Progress Over Time
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`
            text-sm text-academic-body
            ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
          `}
        >
          Track your improvement over the past weeks
        </motion.p>
      </div>

      {/* Placeholder Chart */}
      <motion.div variants={chartVariants} className="relative">
        {/* Simple SVG Bar Chart */}
        <div className="mb-4">
          <motion.h4
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`
              text-sm font-medium mb-3 text-academic-heading
              ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
            `}
          >
            Accuracy Trend (%)
          </motion.h4>
          
          <div className="flex items-end justify-between h-40 space-x-2">
            {dummyProgressData.map((data, index) => {
              const height = (data.accuracy / maxAccuracy) * 100;
              return (
                <motion.div
                  key={index}
                  custom={index}
                  variants={barVariants}
                  className="flex flex-col items-center flex-1"
                >
                  <motion.div
                    className={`
                      w-full max-w-[60px] rounded-t progress-bar-premium
                      ${isDark 
                        ? "bg-brand-primary-dark" 
                        : "bg-brand-primary-light"
                      }
                    `}
                    style={{ height: `${Math.max(height, 10)}%` }}
                    title={`${data.week}: ${data.accuracy}%`}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className={`
                      text-xs mt-2 text-center text-academic-body
                      ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}
                    `}
                  >
                    {data.week}
                  </motion.span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Summary Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`
            p-4 rounded-lg border-l-4 mt-6
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
              📈
            </motion.span>
            <div>
              <h5 className="font-medium mb-1 text-academic-heading">Insight</h5>
              <p className="text-sm text-academic-body">
                Your accuracy has improved by <strong>11%</strong> over the past 6 weeks. 
                Keep practicing to maintain this upward trend!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Placeholder Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className={`
            mt-4 p-3 rounded-lg border text-center text-sm
            ${isDark 
              ? "bg-bg-tertiary-dark border-border-darker text-text-muted-dark" 
              : "bg-bg-tertiary-light border-border-lighter text-text-muted-light"
            }
          `}
        >
          📊 <strong>Placeholder Data:</strong> Progress tracking will appear here with your real study data
        </motion.div>
      </motion.div>
    </motion.div>
  );
};