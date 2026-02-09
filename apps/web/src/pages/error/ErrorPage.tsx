import React from "react";
import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, RefreshCw, AlertTriangle, FileQuestion } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { FloatingNavigation } from "../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../ui_components/ThemeToggle";

const ErrorPage: React.FC = () => {
    const error = useRouteError();
    const navigate = useNavigate();
    const { isDark } = useTheme();

    let errorMessage = "An unexpected error occurred.";
    let errorTitle = "Something went wrong";
    let errorStatus = "500";
    let Icon = AlertTriangle;

    if (isRouteErrorResponse(error)) {
        errorStatus = error.status.toString();
        if (error.status === 404) {
            errorTitle = "Page Not Found";
            errorMessage = "The page you are looking for doesn't exist or has been moved.";
            Icon = FileQuestion;
        } else if (error.status === 401) {
            errorTitle = "Unauthorized";
            errorMessage = "You aren't authorized to see this.";
        } else if (error.status === 503) {
            errorTitle = "Service Unavailable";
            errorMessage = "Our servers are currently unavailable.";
        } else {
            errorMessage = error.statusText || errorMessage;
        }
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    return (
        <div className={`min-h-screen relative flex flex-col items-center justify-center overflow-hidden font-sans transition-colors duration-500 ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
            }`}>

            {/* Navigation & Theme Toggle */}
            <FloatingNavigation />
            <FloatingThemeToggle />

            {/* Background Ambience */}
            <div className={`absolute inset-0 pointer-events-none ${isDark
                ? "bg-linear-to-br from-brand-primary-dark/5 via-transparent to-brand-accent-dark/5"
                : "bg-linear-to-br from-brand-primary-light/5 via-transparent to-brand-accent-light/5"
                }`} />

            {/* Glow Effect */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary-light/20 blur-[120px] rounded-full pointer-events-none ${isDark ? "opacity-20" : "opacity-30"
                }`} />


            {/* Content Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 text-center px-4 max-w-2xl mx-auto"
            >
                {/* 3D Icon Container */}
                <motion.div
                    initial={{ rotateY: -90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-8 inline-block"
                >
                    <div className={`relative w-32 h-32 md:w-40 md:h-40 rounded-3xl flex items-center justify-center shadow-xl backdrop-blur-md border ${isDark
                        ? "bg-white/5 border-white/10 shadow-brand-primary-dark/20"
                        : "bg-white/60 border-white/40 shadow-brand-primary-light/20"
                        }`}>
                        <Icon
                            className={`w-16 h-16 md:w-20 md:h-20 ${isDark ? "text-brand-accent-dark" : "text-brand-primary-light"
                                }`}
                            strokeWidth={1.5}
                        />

                        {/* Status Code Badge */}
                        <div className={`absolute -bottom-4 -right-4 px-4 py-1 rounded-full text-sm font-bold shadow-lg ${isDark
                                ? "bg-bg-secondary-dark text-text-primary-dark border border-white/10"
                                : "bg-white text-text-primary-light border border-gray-100"
                            }`}>
                            {errorStatus}
                        </div>
                    </div>
                </motion.div>

                {/* Text Content */}
                <h1 className={`text-4xl md:text-5xl font-bold mb-4 tracking-tight ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                    }`}>
                    {errorTitle}
                </h1>

                <p className={`text-lg md:text-xl mb-10 leading-relaxed ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                    }`}>
                    {errorMessage}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate('/home')}
                        className={`group h-12 px-8 rounded-xl font-semibold text-white shadow-lg shadow-brand-primary-light/20 transition-all duration-300 hover:shadow-brand-primary-light/50 hover:-translate-y-0.5 flex items-center gap-2 ${isDark
                            ? "bg-linear-to-r from-brand-primary-dark to-brand-secondary-dark"
                            : "bg-linear-to-r from-brand-primary-light to-brand-secondary-light"
                            }`}
                    >
                        <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>Go Home</span>
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className={`group h-12 px-8 rounded-xl font-medium border backdrop-blur-sm transition-all duration-300 hover:bg-white/10 flex items-center gap-2 ${isDark
                            ? "bg-white/5 border-white/10 text-white"
                            : "bg-black/5 border-black/10 text-gray-900"
                            }`}
                    >
                        <RefreshCw className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:rotate-180 transition-transform duration-500" />
                        <span>Try Again</span>
                    </button>
                </div>
            </motion.div>

            {/* Footer / Copyright hint */}
            <div className={`absolute bottom-8 text-xs opacity-40 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                PrepToDo System
            </div>
        </div>
    );
};

export default ErrorPage;
