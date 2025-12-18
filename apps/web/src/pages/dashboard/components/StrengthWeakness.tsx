import React from "react";

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
  const getScoreColor = (_score: number, isStrength: boolean) => {
    if (isStrength) {
      return isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light";
    } else {
      return isDark ? "bg-brand-secondary-dark" : "bg-brand-secondary-light";
    }
  };

  const getScoreTextColor = (_score: number, isStrength: boolean) => {
    if (isStrength) {
      return isDark ? "text-text-primary-dark" : "text-text-primary-light";
    } else {
      return isDark ? "text-text-secondary-dark" : "text-text-secondary-light";
    }
  };

  const getBorderColor = (isStrength: boolean) => {
    return isStrength 
      ? (isDark ? "border-l-brand-accent-dark" : "border-l-brand-accent-light")
      : (isDark ? "border-l-brand-secondary-dark" : "border-l-brand-secondary-light");
  };

  const PerformanceItem = ({ 
    item, 
    isStrength 
  }: { 
    item: typeof dummyPerformanceData.strengths[0]; 
    isStrength: boolean;
  }) => (
    <div className={`border-l-4 pl-4 py-3 ${getBorderColor(isStrength)}`}>
      <div className="flex justify-between items-start mb-2">
        <h4
          className={`
            font-semibold text-sm
            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
          `}
        >
          {item.topic}
        </h4>
        <span
          className={`
            text-xs font-bold px-2 py-1 rounded
            ${getScoreTextColor(item.score, isStrength)}
          `}
        >
          {item.score}%
        </span>
      </div>
      <p
        className={`
          text-xs
          ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}
        `}
      >
        {item.description}
      </p>
      {/* Progress Bar */}
      <div
        className={`
          mt-3 h-2 rounded-full overflow-hidden
          ${isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"}
        `}
      >
        <div
          className={`
            h-full transition-all duration-500 ease-out
            ${getScoreColor(item.score, isStrength)}
          `}
          style={{ width: `${item.score}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Strengths Section */}
      <div
        className={`
          rounded-xl p-6 border
          ${isDark 
            ? "bg-bg-secondary-dark border-border-dark" 
            : "bg-bg-secondary-light border-border-light"
          }
        `}
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="text-2xl">💪</div>
          <div>
            <h3
              className={`
                text-xl font-semibold
                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
              `}
            >
              Your Strengths
            </h3>
            <p
              className={`
                text-sm
                ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
              `}
            >
              Areas where you excel
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {dummyPerformanceData.strengths.map((strength, index) => (
            <PerformanceItem key={index} item={strength} isStrength={true} />
          ))}
        </div>
      </div>

      {/* Weaknesses Section */}
      <div
        className={`
          rounded-xl p-6 border
          ${isDark 
            ? "bg-bg-secondary-dark border-border-dark" 
            : "bg-bg-secondary-light border-border-light"
          }
        `}
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="text-2xl">🎯</div>
          <div>
            <h3
              className={`
                text-xl font-semibold
                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
              `}
            >
              Areas to Improve
            </h3>
            <p
              className={`
                text-sm
                ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
              `}
            >
              Focus areas for better performance
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {dummyPerformanceData.weaknesses.map((weakness, index) => (
            <PerformanceItem key={index} item={weakness} isStrength={false} />
          ))}
        </div>
      </div>

      {/* Overall Insight */}
      <div
        className={`
          lg:col-span-2 p-4 rounded-lg border-l-4
          ${isDark 
            ? "bg-bg-tertiary-dark border-l-brand-accent-dark text-text-secondary-dark" 
            : "bg-bg-tertiary-light border-l-brand-accent-light text-text-secondary-light"
          }
        `}
      >
        <div className="flex items-start space-x-3">
          <span className="text-lg">💡</span>
          <div>
            <h5 className="font-medium mb-1">Performance Insight</h5>
            <p className="text-sm">
              You're performing strongest in reading and language skills. 
              Consider dedicating more time to quantitative reasoning to balance your performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};