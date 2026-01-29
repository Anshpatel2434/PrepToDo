import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../context/ThemeContext";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { Plus, RotateCcw } from "lucide-react";
import { useFetchCustomizedMocksQuery } from "../redux_usecase/customizedMocksApi";
import MockCard from "../components/MockCard";
import MockListSkeleton from "../components/MockListSkeleton";
import MockFormModal from "../components/MockFormModal";
import toast from "react-hot-toast";

// Beta version limit for customized mocks
const BETA_MOCK_LIMIT = 2;

const CustomizedMocksPage: React.FC = () => {
    const { isDark } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch user's customized mocks
    const { data: mocks = [], isLoading, isError, error, refetch } = useFetchCustomizedMocksQuery();

    // Check if user has reached the limit for beta version
    const handleCreateClick = () => {
        // Filter for active mocks (completed or generating)
        const activeMocks = mocks.filter(m =>
            m.generation_status === 'completed' ||
            m.generation_status === 'generating' ||
            m.generation_status === 'initializing'
        );

        if (activeMocks.length >= BETA_MOCK_LIMIT) {
            toast.error(`Beta version is limited to ${BETA_MOCK_LIMIT} customized mocks.`, {
                icon: '🔒',
                style: {
                    borderRadius: '10px',
                    background: isDark ? '#333' : '#fff',
                    color: isDark ? '#fff' : '#333',
                },
            });
            return;
        }
        setIsModalOpen(true);
    };

    const handleCreateSuccess = () => {
        console.log("[CustomizedMocksPage] Mock creation started");
        setIsModalOpen(false);
        // No need to refetch - RTK Query's optimistic update and invalidatesTags handle this
    };

    if (error) {
        console.error("[CustomizedMocksPage] Error fetching mocks:", error);
    }

    return (
        <div className={`min-h-screen relative ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>
            {/* Subtle background gradient from Dashboard + Hint of Brand Accent */}
            <div className={`absolute inset-0 pointer-events-none ${isDark
                ? "bg-linear-to-br from-brand-primary-dark/5 via-transparent to-brand-accent-dark/5"
                : "bg-linear-to-br from-brand-primary-light/5 via-transparent to-brand-accent-light/5"
                }`} />

            <FloatingThemeToggle />
            <FloatingNavigation />

            <div className="min-h-screen overflow-x-hidden pl-18 sm:pl-20 md:pl-24 pr-4 lg:pr-8 py-4 sm:py-6 md:py-10 relative z-10 pb-20 sm:pb-24">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 pr-14"
                >
                    <div>
                        <h1 className={`font-serif font-bold text-3xl md:text-4xl mb-2 flex items-center gap-3 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            Adaptive VARC Sectionals
                        </h1>
                        <p className={`text-base max-w-3xl ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                            Target your specific weaknesses with precision. Generate unlimited tests that adapt to your 'Atomic Proficiency' scores, focusing on the genres and question types where you need the most improvement.
                        </p>
                    </div>

                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        onClick={handleCreateClick}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-xl font-bold tracking-wide transition-all duration-300 transform hover:scale-105 shadow-lg
                            ${isDark
                                ? "bg-brand-primary-dark text-white shadow-brand-primary-dark/20 hover:bg-brand-primary-dark/90"
                                : "bg-brand-primary-light text-white shadow-brand-primary-light/20 hover:bg-brand-primary-light/90"
                            }
                        `}
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create Sectional</span>
                    </motion.button>
                </motion.div>

                {/* Loading State */}
                {isLoading && (
                    <div className="max-w-7xl">
                        <MockListSkeleton />
                    </div>
                )}

                {/* Error State */}
                {isError && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`
                            max-w-2xl mx-auto p-8 rounded-2xl border text-center
                            ${isDark
                                ? "bg-red-900/10 border-red-500/30"
                                : "bg-red-50 border-red-200"
                            }
                        `}
                    >
                        <p className={`text-lg font-medium mb-4 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            Failed to load your sectional tests. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => refetch()}
                            className={`
                                flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium mx-auto transition-colors
                                ${isDark
                                    ? "bg-bg-tertiary-dark text-text-primary-dark hover:bg-bg-secondary-dark"
                                    : "bg-white text-text-primary-light border shadow-sm hover:bg-gray-50"
                                }
                            `}
                        >
                            <RotateCcw size={16} />
                            Retry
                        </button>
                    </motion.div>
                )}

                {/* Empty State */}
                {!isLoading && !error && mocks.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className={`
                            max-w-2xl mx-auto p-12 rounded-[2.5rem] border-2 border-dashed text-center
                            ${isDark ? "border-white/10" : "border-gray-100 bg-gray-50/30"}
                        `}
                    >
                        <div className={`
                            w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6
                            ${isDark ? "bg-brand-primary-dark/10" : "bg-brand-primary-light/10"}
                        `}>
                            <Plus
                                className={`w-10 h-10 ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`}
                            />
                        </div>
                        <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                            Architect Your Preparation
                        </h3>
                        <p className={`text-base mb-8 max-w-md mx-auto ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                            Don't just practice randomly. Configure a test that targets your logic gaps. Select specific genres (e.g., Philosophy, Economics) and question types to build your mastery.
                        </p>
                        <button
                            onClick={handleCreateClick}
                            className={`
                                inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg
                                ${isDark
                                    ? "bg-brand-primary-dark text-white shadow-brand-primary-dark/20 hover:scale-105"
                                    : "bg-brand-primary-light text-white shadow-brand-primary-light/20 hover:scale-105"
                                }
                            `}
                        >
                            <Plus size={20} />
                            Create Your First Sectional
                        </button>
                    </motion.div>
                )}

                {/* Mock List Grid */}
                {!isLoading && !error && mocks.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {mocks.map((mock, index) => (
                                <MockCard
                                    key={mock.id}
                                    mock={mock}
                                    index={index}
                                    isDark={isDark}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Create Mock Modal */}
            <MockFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCreateSuccess}
                isDark={isDark}
            />
        </div>
    );
};

export default CustomizedMocksPage;
