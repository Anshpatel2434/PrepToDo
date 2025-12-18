import React from "react";

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
        <h3
          className={`
            text-xl font-semibold mb-2
            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
          `}
        >
          Progress Over Time
        </h3>
        <p
          className={`
            text-sm
            ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
          `}
        >
          Track your improvement over the past weeks
        </p>
      </div>

      {/* Placeholder Chart */}
      <div className="relative">
        {/* Simple SVG Bar Chart */}
        <div className="mb-4">
          <h4
            className={`
              text-sm font-medium mb-3
              ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
            `}
          >
            Accuracy Trend (%)
          </h4>
          
          <div className="flex items-end justify-between h-40 space-x-2">
            {dummyProgressData.map((data, index) => {
              const height = (data.accuracy / maxAccuracy) * 100;
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className={`
                      w-full max-w-[60px] rounded-t transition-all duration-300
                      ${isDark 
                        ? "bg-brand-primary-dark hover:bg-brand-primary-hover-dark" 
                        : "bg-brand-primary-light hover:bg-brand-primary-hover-light"
                      }
                    `}
                    style={{ height: `${Math.max(height, 10)}%` }}
                    title={`${data.week}: ${data.accuracy}%`}
                  />
                  <span
                    className={`
                      text-xs mt-2 text-center
                      ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}
                    `}
                  >
                    {data.week}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Insight */}
        <div
          className={`
            p-4 rounded-lg border-l-4 mt-6
            ${isDark 
              ? "bg-bg-tertiary-dark border-l-brand-accent-dark text-text-secondary-dark" 
              : "bg-bg-tertiary-light border-l-brand-accent-light text-text-secondary-light"
            }
          `}
        >
          <div className="flex items-start space-x-3">
            <span className="text-lg">📈</span>
            <div>
              <h5 className="font-medium mb-1">Insight</h5>
              <p className="text-sm">
                Your accuracy has improved by <strong>11%</strong> over the past 6 weeks. 
                Keep practicing to maintain this upward trend!
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
          📊 <strong>Placeholder Data:</strong> Progress tracking will appear here with your real study data
        </div>
      </div>
    </div>
  );
};