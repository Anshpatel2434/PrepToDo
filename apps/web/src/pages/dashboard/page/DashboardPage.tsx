import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import { useFetchUserQuery } from "../../auth/redux_usecases/authApi";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { SummaryCards } from "../components/SummaryCards";
import { ProgressChart } from "../components/ProgressChart";
import { StrengthWeakness } from "../components/StrengthWeakness";
import { NextSteps } from "../components/NextSteps";
import { SocialPreview } from "../components/SocialPreview";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { data: authState } = useFetchUserQuery();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (authState?.role !== "authenticated") {
      navigate("/auth");
    }
  }, [authState, navigate]);

  if (authState?.role !== "authenticated") {
    return null; // or a loading spinner
  }

  return (
    <div
      className={`
        min-h-screen transition-colors duration-300
        ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}
      `}
    >
      {/* Floating Theme Toggle */}
      <FloatingThemeToggle />

      {/* Main Dashboard Content */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1
            className={`
              text-3xl md:text-4xl font-bold mb-2
              ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
            `}
          >
            Your Study Dashboard
          </h1>
          <p
            className={`
              text-lg
              ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
            `}
          >
            Track your progress and plan your next study session
          </p>
        </div>

        {/* Dashboard Sections */}
        <div className="space-y-8">
          {/* 1. Top Summary Strip */}
          <section>
            <SummaryCards isDark={isDark} />
          </section>

          {/* 2. Progress Over Time */}
          <section>
            <ProgressChart isDark={isDark} />
          </section>

          {/* 3. Strengths & Weaknesses */}
          <section>
            <StrengthWeakness isDark={isDark} />
          </section>

          {/* 4. What to Do Next */}
          <section>
            <NextSteps isDark={isDark} />
          </section>

          {/* 5. Social Feature Preview */}
          <section>
            <SocialPreview isDark={isDark} />
          </section>
        </div>
      </div>
    </div>
  );
};