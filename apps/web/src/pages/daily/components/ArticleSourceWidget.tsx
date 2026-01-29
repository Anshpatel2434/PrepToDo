import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Library, ChevronDown } from "lucide-react";
import type { Article } from "../../../types";

interface ArticleSourceWidgetProps {
    articles: Article[];
    isLoading?: boolean;
    isDark: boolean;
}

export const ArticleSourceWidget: React.FC<ArticleSourceWidgetProps> = ({
    articles,
    isLoading,
    isDark,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (isLoading) {
        return (
            <div className={`p-6 rounded-2xl border skeleton-loader ${isDark ? "bg-bg-secondary-dark border-border-dark" : "bg-white border-border-light"}`}>
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gray-300 animate-pulse" />
                    <div className="h-4 w-32 bg-gray-300 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    if (!articles || articles.length === 0) return null;

    return (
        <div className={`
            rounded-2xl border overflow-hidden
            ${isDark ? "bg-bg-secondary-dark border-border-dark" : "bg-white border-gray-100"}
        `}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    w-full flex items-center justify-between p-5 text-left transition-colors
                    ${isDark ? "hover:bg-bg-tertiary-dark/30" : "hover:bg-gray-50"}
                `}
            >
                <div className="flex items-center gap-3">
                    <div className={`
                        p-2 rounded-lg
                        ${isDark
                            ? "bg-brand-primary-dark/10 text-brand-primary-dark"
                            : "bg-brand-primary-light/10 text-brand-primary-light"}
                    `}>
                        <Library className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className={`text-base font-semibold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            Source Material
                        </h3>
                        <p className={`text-xs ${isDark ? "text-text-muted-dark" : "text-text-secondary-light"}`}>
                            {articles.length} article{articles.length !== 1 ? 's' : ''} used today
                        </p>
                    </div>
                </div>

                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className={`w-5 h-5 ${isDark ? "text-text-muted-dark" : "text-text-secondary-light"}`} />
                </motion.div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-dashed"
                        style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}
                    >
                        <div className="p-4 space-y-3">
                            {articles.map((article, idx) => (
                                <a
                                    key={article.id || idx} // Fallback key if id is missing
                                    href={article.url || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`
                                        group block p-3 rounded-xl border transition-all duration-200
                                        ${isDark
                                            ? "bg-bg-tertiary-dark border-border-dark hover:border-brand-primary-dark/50"
                                            : "bg-gray-50 border-gray-100 hover:border-brand-primary-light/50"}
                                    `}
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h4 className={`text-sm font-medium truncate mb-1 ${isDark ? "text-text-primary-dark group-hover:text-brand-primary-dark" : "text-text-primary-light group-hover:text-brand-primary-light"}`}>
                                                {article.title || "Untitled Article"}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                                <span className={`px-1.5 py-0.5 rounded truncate max-w-[120px] ${isDark ? "bg-bg-primary-dark text-text-muted-dark" : "bg-white text-gray-500"}`}>
                                                    {article.source_name || "Unknown Source"}
                                                </span>
                                                <span className={isDark ? "text-text-muted-dark" : "text-gray-400"}>•</span>
                                                {article.genre && (
                                                    <span className={isDark ? "text-text-muted-dark" : "text-gray-400"}>
                                                        {article.genre}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};
