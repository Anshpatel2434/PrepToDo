import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`
        min-h-screen theme-transition
        ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}
      `}
    >
      {/* Floating Theme Toggle */}
      <FloatingThemeToggle />

      {/* Main Dashboard Content */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Dashboard Header */}
        <motion.div 
          variants={sectionVariants}
          className="mb-8"
        >
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`
              text-3xl md:text-4xl font-bold mb-2 text-academic-heading
              ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
            `}
          >
            Your Study Dashboard
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`
              text-lg text-academic-body
              ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
            `}
          >
            Track your progress and plan your next study session
          </motion.p>
        </motion.div>

        {/* Dashboard Sections */}
        <div className="space-y-8">
          {/* 1. Top Summary Strip */}
          <motion.section variants={sectionVariants}>
            <SummaryCards isDark={isDark} />
          </motion.section>

          {/* 2. Progress Over Time */}
          <motion.section variants={sectionVariants}>
            <ProgressChart isDark={isDark} />
          </motion.section>

          {/* 3. Strengths & Weaknesses */}
          <motion.section variants={sectionVariants}>
            <StrengthWeakness isDark={isDark} />
          </motion.section>

          {/* 4. What to Do Next */}
          <motion.section variants={sectionVariants}>
            <NextSteps isDark={isDark} />
          </motion.section>

          {/* 5. Social Feature Preview */}
          <motion.section variants={sectionVariants}>
            <SocialPreview isDark={isDark} />
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
};