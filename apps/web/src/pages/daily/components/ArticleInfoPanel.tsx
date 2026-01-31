import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdNewspaper, MdExpandMore, MdOpenInNew, MdPerson, MdCalendarToday, MdLabel } from "react-icons/md";
import { useTheme } from "../../../context/ThemeContext";
import type { Article } from "../../../types";
import { PageLoader } from "../../../ui_components/PageLoader";

interface ArticleInfoPanelProps {
    articles: Article[];
    isLoading?: boolean;
}

const ArticleInfoPanel: React.FC<ArticleInfoPanelProps> = ({ articles, isLoading }) => {
    const { isDark } = useTheme();
    const [isExpanded, setIsExpanded] = useState(true);

    const formatDate = (date: Date | null | undefined) => {
        if (!date) return "N/A";
        try {
            return new Date(date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return "N/A";
        }
    };

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`
                    max-w-4xl mx-auto mb-8 p-6 rounded-xl border-2
                    ${isDark
                        ? "bg-bg-secondary-dark border-border-dark"
                        : "bg-bg-secondary-light border-border-light"}
                `}
            >
                <PageLoader variant="inline" size="sm" message="Loading source articles..." />
            </motion.div>
        );
    }

    if (!articles || articles.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className={`
                max-w-4xl mx-auto mb-8 rounded-xl border-2 overflow-hidden
                ${isDark
                    ? "bg-bg-secondary-dark border-border-dark"
                    : "bg-bg-secondary-light border-border-light"}
            `}
        >
            {/* Header - Always Visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    w-full px-6 py-4 flex items-center justify-between
                    transition-colors duration-200
                    ${isDark ? "hover:bg-bg-tertiary-dark/30" : "hover:bg-bg-tertiary-light/30"}
                `}
            >
                <div className="flex items-center gap-3">
                    <div
                        className={`
                            w-10 h-10 rounded-xl flex items-center justify-center
                            ${isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"}
                        `}
                    >
                        <MdNewspaper
                            className={`w-6 h-6 ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"
                                }`}
                        />
                    </div>
                    <div className="text-left">
                        <h3
                            className={`
                                text-lg font-semibold
                                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                            `}
                        >
                            Source Articles
                        </h3>
                        <p
                            className={`
                                text-xs
                                ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                            `}
                        >
                            {articles.length} {articles.length === 1 ? "article" : "articles"} used in this test
                        </p>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <MdExpandMore
                        className={`w-6 h-6 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                            }`}
                    />
                </motion.div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div
                            className={`
                                px-6 pb-6 space-y-4 border-t-2
                                ${isDark ? "border-border-dark" : "border-border-light"}
                            `}
                        >
                            {articles.map((article, index) => (
                                <motion.div
                                    key={article.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.3 }}
                                    className={`
                                        p-4 rounded-lg border
                                        ${isDark
                                            ? "bg-bg-tertiary-dark/30 border-border-dark"
                                            : "bg-bg-tertiary-light/30 border-border-light"}
                                    `}
                                >
                                    {/* Article Title */}
                                    {article.title && (
                                        <h4
                                            className={`
                                                font-semibold mb-2 text-base
                                                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                                            `}
                                        >
                                            {article.title}
                                        </h4>
                                    )}

                                    {/* Article Metadata - Responsive Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                        {/* Source */}
                                        {article.source_name && (
                                            <div className="flex items-center gap-2">
                                                <MdNewspaper
                                                    className={`w-4 h-4 shrink-0 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                                        }`}
                                                />
                                                <span
                                                    className={`
                                                        text-sm truncate
                                                        ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                                                    `}
                                                >
                                                    {article.source_name}
                                                </span>
                                            </div>
                                        )}

                                        {/* Author */}
                                        {article.author && (
                                            <div className="flex items-center gap-2">
                                                <MdPerson
                                                    className={`w-4 h-4 shrink-0 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                                        }`}
                                                />
                                                <span
                                                    className={`
                                                        text-sm truncate
                                                        ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                                                    `}
                                                >
                                                    {article.author}
                                                </span>
                                            </div>
                                        )}

                                        {/* Published Date */}
                                        {article.published_at && (
                                            <div className="flex items-center gap-2">
                                                <MdCalendarToday
                                                    className={`w-4 h-4 shrink-0 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                                        }`}
                                                />
                                                <span
                                                    className={`
                                                        text-sm
                                                        ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                                                    `}
                                                >
                                                    {formatDate(article.published_at)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Genre */}
                                        {article.genre && (
                                            <div className="flex items-center gap-2">
                                                <MdLabel
                                                    className={`w-4 h-4 shrink-0 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                                        }`}
                                                />
                                                <span
                                                    className={`
                                                        text-sm capitalize
                                                        ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                                                    `}
                                                >
                                                    {article.genre.replace(/_/g, " ")}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Topic Tags */}
                                    {article.topic_tags && article.topic_tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {article.topic_tags.map((tag, tagIndex) => (
                                                <span
                                                    key={tagIndex}
                                                    className={`
                                                        px-2 py-1 text-xs rounded-md
                                                        ${isDark
                                                            ? "bg-bg-tertiary-dark text-text-secondary-dark"
                                                            : "bg-bg-tertiary-light text-text-secondary-light"}
                                                    `}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Read Article Link */}
                                    {article.url && (
                                        <a
                                            href={article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`
                                                inline-flex items-center gap-2 text-sm font-medium
                                                transition-colors duration-200
                                                ${isDark
                                                    ? "text-brand-primary-dark hover:text-brand-primary-dark/80"
                                                    : "text-brand-primary-light hover:text-brand-primary-light/80"}
                                            `}
                                        >
                                            <span>Read original article</span>
                                            <MdOpenInNew className="w-4 h-4" />
                                        </a>
                                    )}
                                </motion.div>
                            ))}

                            {/* Info Note */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.3 }}
                                className={`
                                    mt-4 p-3 rounded-lg text-sm
                                    ${isDark
                                        ? "bg-bg-tertiary-dark/50 text-text-muted-dark"
                                        : "bg-bg-tertiary-light/50 text-text-muted-light"}
                                `}
                            >
                                💡 These articles were used to create the passages and questions in this test.
                                Familiarizing yourself with diverse sources helps improve comprehension skills.
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ArticleInfoPanel;
