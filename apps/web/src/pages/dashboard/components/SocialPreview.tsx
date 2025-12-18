import React from "react";

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
          <div className="text-2xl">🤝</div>
          <h3
            className={`
              text-xl font-semibold
              ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
            `}
          >
            Community Features
          </h3>
        </div>
        <p
          className={`
            text-sm
            ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
          `}
        >
          Connect with fellow learners and enhance your study journey
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {socialFeatures.map((feature, index) => (
          <div
            key={index}
            className={`
              p-4 rounded-lg border transition-all duration-200 hover:shadow-sm
              ${isDark 
                ? "bg-bg-tertiary-dark border-border-darker hover:border-brand-secondary-dark" 
                : "bg-bg-tertiary-light border-border-lighter hover:border-brand-secondary-light"
              }
            `}
          >
            <div className="flex items-start space-x-3">
              <span className="text-xl">{feature.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4
                    className={`
                      font-semibold text-sm
                      ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                    `}
                  >
                    {feature.title}
                  </h4>
                  <span
                    className={`
                      text-xs px-2 py-1 rounded-full font-medium
                      ${isDark 
                        ? "bg-brand-accent-dark text-text-primary-dark" 
                        : "bg-brand-accent-light text-text-primary-light"
                      }
                    `}
                  >
                    {feature.status}
                  </span>
                </div>
                <p
                  className={`
                    text-xs
                    ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}
                  `}
                >
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Privacy Notice */}
      <div
        className={`
          p-4 rounded-lg border-l-4
          ${isDark 
            ? "bg-bg-tertiary-dark border-l-brand-secondary-dark text-text-secondary-dark" 
            : "bg-bg-tertiary-light border-l-brand-secondary-light text-text-secondary-light"
          }
        `}
      >
        <div className="flex items-start space-x-3">
          <span className="text-lg">🔒</span>
          <div>
            <h5 className="font-medium mb-1">Privacy First</h5>
            <p className="text-sm">
              All community features will be completely optional and privacy-controlled. 
              You'll choose what information to share and with whom.
            </p>
          </div>
        </div>
      </div>

      {/* Current Activity Hint */}
      <div
        className={`
          mt-4 p-3 rounded-lg border text-center text-sm
          ${isDark 
            ? "bg-bg-tertiary-dark border-border-darker text-text-muted-dark" 
            : "bg-bg-tertiary-light border-border-lighter text-text-muted-light"
          }
        `}
      >
        👥 <strong>Community Growing:</strong> 1,247 students are already using PrepToDo. Join the learning community soon!
      </div>
    </div>
  );
};