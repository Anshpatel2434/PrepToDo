import React from "react";

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

  const NextStepCard = ({ step }: { step: typeof dummyNextSteps[0] }) => (
    <div
      className={`
        rounded-xl p-6 border transition-all duration-200 hover:shadow-md
        ${isDark 
          ? "bg-bg-secondary-dark border-border-dark hover:border-brand-primary-dark" 
          : "bg-bg-secondary-light border-border-light hover:border-brand-primary-light"
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">{step.icon}</span>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span
                className={`
                  text-xs px-2 py-1 rounded-full font-medium
                  ${getPriorityColor(step.priority)}
                  ${getPriorityTextColor(step.priority)}
                `}
              >
                {step.priority} Priority
              </span>
              <span
                className={`
                  text-xs px-2 py-1 rounded-full
                  ${isDark ? "bg-bg-tertiary-dark text-text-muted-dark" : "bg-bg-tertiary-light text-text-muted-light"}
                `}
              >
                {step.type}
              </span>
            </div>
            <h4
              className={`
                font-semibold
                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
              `}
            >
              {step.title}
            </h4>
          </div>
        </div>
        <div
          className={`
            text-xs px-2 py-1 rounded
            ${isDark ? "bg-bg-tertiary-dark text-text-muted-dark" : "bg-bg-tertiary-light text-text-muted-light"}
          `}
        >
          {step.estimatedTime}
        </div>
      </div>

      {/* Description */}
      <p
        className={`
          text-sm mb-4
          ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
        `}
      >
        {step.description}
      </p>

      {/* Action Button */}
      <button
        className={`
          w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:shadow-md
          ${isDark 
            ? "bg-brand-primary-dark hover:bg-brand-primary-hover-dark text-text-primary-dark" 
            : "bg-brand-primary-light hover:bg-brand-primary-hover-light text-text-primary-light"
          }
        `}
      >
        {step.action}
      </button>
    </div>
  );

  return (
    <div
      className={`
        rounded-xl p-6 border
        ${isDark 
          ? "bg-bg-secondary-dark border-border-dark" 
          : "bg-bg-secondary-light border-border-light"
        }
      `}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="text-2xl">🎯</div>
          <h3
            className={`
              text-xl font-semibold
              ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
            `}
          >
            What to Do Next
          </h3>
        </div>
        <p
          className={`
            text-sm
            ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
          `}
        >
          Recommended actions based on your recent performance
        </p>
      </div>

      {/* Next Steps Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {dummyNextSteps.map((step) => (
          <NextStepCard key={step.id} step={step} />
        ))}
      </div>

      {/* Quick Actions */}
      <div
        className={`
          p-4 rounded-lg border-l-4
          ${isDark 
            ? "bg-bg-tertiary-dark border-l-brand-accent-dark text-text-secondary-dark" 
            : "bg-bg-tertiary-light border-l-brand-accent-light text-text-secondary-light"
          }
        `}
      >
        <div className="flex items-start space-x-3">
          <span className="text-lg">💪</span>
          <div>
            <h5 className="font-medium mb-1">Study Tip</h5>
            <p className="text-sm">
              Consistent daily practice is more effective than marathon sessions. 
              Try to practice at the same time each day to build a strong study habit.
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder Notice */}
      <div
        className={`
          mt-4 p-3 rounded-lg border text-center text-sm
          ${isDark 
            ? "bg-bg-tertiary-dark border-border-darker text-text-muted-dark" 
            : "bg-bg-tertiary-light border-border-lighter text-text-muted-light"
          }
        `}
      >
        🎯 <strong>Smart Recommendations:</strong> These suggestions will be personalized based on your real performance data
      </div>
    </div>
  );
};