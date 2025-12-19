import React from "react";
import { motion } from "framer-motion";

interface SocialPreviewProps {
  isDark: boolean;
}

export const SocialPreview: React.FC<SocialPreviewProps> = ({ isDark }) => {
  const socialFeatures = [
    {
      icon: "👥",
      title: "Study Groups",
      status: "Coming Soon",
      description: "Join study groups with peers at your level"
    },
    {
      icon: "🏆",
      title: "Progress Challenges",
      status: "Coming Soon", 
      description: "Friendly competitions to motivate consistent practice"
    },
    {
      icon: "📊",
      title: "Peer Comparison",
      status: "Coming Soon",
      description: "Compare your progress with friends (opt-in only)"
    },
    {
      icon: "💬",
      title: "Study Chat",
      status: "Coming Soon",
      description: "Discuss strategies and get help from the community"
    }
  ];

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

  const featureVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
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
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          >
            🤝
          </motion.div>
          <h3
            className={`
              text-xl font-semibold text-academic-heading
              ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
            `}
          >
            Community Features
          </h3>
        </div>
        <p
          className={`
            text-sm text-academic-body
            ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
          `}
        >
          Connect with fellow learners and enhance your study journey
        </p>
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {socialFeatures.map((feature, index) => (
          <motion.div
            key={index}
            variants={featureVariants}
            whileHover={{ scale: 1.02 }}
            className={`
              p-4 rounded-lg border focus-calm
              ${isDark 
                ? "bg-bg-tertiary-dark border-border-darker" 
                : "bg-bg-tertiary-light border-border-lighter"
              }
            `}
          >
            <div className="flex items-start space-x-3">
              <motion.span 
                className="text-xl"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  repeatDelay: 1 + index * 0.5 
                }}
              >
                {feature.icon}
              </motion.span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4
                    className={`
                      font-semibold text-sm text-academic-heading
                      ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                    `}
                  >
                    {feature.title}
                  </h4>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 300 }}
                    className={`
                      text-xs px-2 py-1 rounded-full font-medium text-academic-heading
                      ${isDark 
                        ? "bg-brand-accent-dark text-text-primary-dark" 
                        : "bg-brand-accent-light text-text-primary-light"
                      }
                    `}
                  >
                    {feature.status}
                  </motion.span>
                </div>
                <p
                  className={`
                    text-xs text-academic-body
                    ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}
                  `}
                >
                  {feature.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Privacy Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={`
          p-4 rounded-lg border-l-4
          ${isDark 
            ? "bg-bg-tertiary-dark border-l-brand-secondary-dark text-text-secondary-dark" 
            : "bg-bg-tertiary-light border-l-brand-secondary-light text-text-secondary-light"
          }
        `}
      >
        <div className="flex items-start space-x-3">
          <motion.span 
            className="text-lg"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🔒
          </motion.span>
          <div>
            <h5 className="font-medium mb-1 text-academic-heading">Privacy First</h5>
            <p className="text-sm text-academic-body">
              All community features will be completely optional and privacy-controlled. 
              You'll choose what information to share and with whom.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Current Activity Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className={`
          mt-4 p-3 rounded-lg border text-center text-sm
          ${isDark 
            ? "bg-bg-tertiary-dark border-border-darker text-text-muted-dark" 
            : "bg-bg-tertiary-light border-border-lighter text-text-muted-light"
          }
        `}
      >
        👥 <strong>Community Growing:</strong> 1,247 students are already using PrepToDo. Join the learning community soon!
      </motion.div>
    </motion.div>
  );
};