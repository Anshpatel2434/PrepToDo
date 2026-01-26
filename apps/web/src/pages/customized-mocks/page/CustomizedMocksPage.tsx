import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../context/ThemeContext";
import { FloatingNavigation } from "../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../ui_components/ThemeToggle";
import { MdAdd } from "react-icons/md";
import { useFetchCustomizedMocksQuery } from "../redux_usecase/customizedMocksApi";
import MockCard from "../components/MockCard";
import MockListSkeleton from "../components/MockListSkeleton";
import MockFormModal from "../components/MockFormModal";

const CustomizedMocksPage: React.FC = () => {
    const { isDark } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch user's customized mocks
    const { data: mocks = [], isLoading, isError, error, refetch } = useFetchCustomizedMocksQuery();

    const handleCreateSuccess = () => {
        console.log("[CustomizedMocksPage] Mock creation started");
        setIsModalOpen(false);
        // No need to refetch - RTK Query's optimistic update and invalidatesTags handle this
    };

    if (error) {
        console.error("[CustomizedMocksPage] Error fetching mocks:", error);
    }

    return (
        <div
            className={`min-h-screen ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
                }`}
        >
            <FloatingThemeToggle />
            <FloatingNavigation />

            <div className="container mx-auto px-6 py-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h1
                        className={`
                            font-serif font-bold text-3xl md:text-5xl mb-4
                            ${isDark
                                ? "text-text-primary-dark"
                                : "text-text-primary-light"
                            }
                        `}
                    >
                        Customized Mock Tests
                    </h1>
                    <p
                        className={`
                            text-base md:text-lg max-w-2xl mx-auto
                            ${isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                            }
                        `}
                    >
                        Create personalized mock tests tailored to your preparation needs.
                        Choose your genres, difficulty, and weak areas to target.
                    </p>
                </motion.div>

                {/* Create Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="max-w-6xl mx-auto mb-8 flex justify-end"
                >
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-xl font-medium
                            transition-all duration-300 transform hover:scale-105
                            ${isDark
                                ? "bg-brand-primary-dark text-white hover:bg-opacity-90"
                                : "bg-brand-primary-light text-white hover:bg-opacity-90"
                            }
                            shadow-lg hover:shadow-xl
                        `}
                    >
                        <MdAdd className="w-5 h-5" />
                        <span>Create New Mock</span>
                    </button>
                </motion.div>

                {/* Loading State */}
                {isLoading && (
                    <div className="max-w-6xl mx-auto">
                        <MockListSkeleton />
                    </div>
                )}

                {/* Error State */}
                {isError && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`
                            max-w-2xl mx-auto p-6 rounded-xl border-2 text-center
                            ${isDark
                                ? "bg-red-900/10 border-red-500/30"
                                : "bg-red-50 border-red-200"
                            }
                        `}
                    >
                        <p
                            className={`text-lg ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}
                        >
                            Failed to load your mock tests. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => refetch()}
                            className={`
                                mt-4 px-4 py-2 rounded-lg font-medium
                                ${isDark
                                    ? "bg-brand-primary-dark text-white"
                                    : "bg-brand-primary-light text-white"
                                }
                            `}
                        >
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
                            max-w-2xl mx-auto p-12 rounded-2xl border-2 border-dashed text-center
                            ${isDark ? "border-border-dark" : "border-border-light"}
                        `}
                    >
                        <div className="mb-6">
                            <div
                                className={`
                                    w-20 h-20 mx-auto rounded-full flex items-center justify-center
                                    ${isDark
                                        ? "bg-brand-primary-dark/20"
                                        : "bg-brand-primary-light/20"
                                    }
                                `}
                            >
                                <MdAdd
                                    className={`w-10 h-10 ${isDark
                                        ? "text-brand-primary-dark"
                                        : "text-brand-primary-light"
                                        }`}
                                />
                            </div>
                        </div>
                        <h3
                            className={`
                                text-xl font-semibold mb-2
                                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                            `}
                        >
                            No Mock Tests Yet
                        </h3>
                        <p
                            className={`
                                text-base mb-6
                                ${isDark
                                    ? "text-text-secondary-dark"
                                    : "text-text-secondary-light"
                                }
                            `}
                        >
                            Create your first customized mock test to start practicing with
                            personalized content.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className={`
                                px-6 py-3 rounded-xl font-medium transition-all duration-300
                                ${isDark
                                    ? "bg-brand-primary-dark text-white hover:bg-opacity-90"
                                    : "bg-brand-primary-light text-white hover:bg-opacity-90"
                                }
                            `}
                        >
                            Create Your First Mock
                        </button>
                    </motion.div>
                )}

                {/* Mock List Grid */}
                {!isLoading && !error && mocks.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence>
                            {mocks.map((mock, index) => (
                                <MockCard
                                    key={mock.id}
                                    mock={mock}
                                    index={index}
                                    isDark={isDark}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Info Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className={`
                        mt-12 max-w-2xl mx-auto p-6 rounded-xl border
                        ${isDark
                            ? "bg-bg-secondary-dark border-border-dark"
                            : "bg-bg-secondary-light border-border-light"
                        }
                    `}
                >
                    <h3
                        className={`
                            font-semibold mb-3
                            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                        `}
                    >
                        📊 Customized Mock Features
                    </h3>
                    <ul
                        className={`
                            space-y-2 text-sm
                            ${isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                            }
                        `}
                    >
                        <li>✓ Choose specific genres and topics</li>
                        <li>✓ Set custom difficulty levels</li>
                        <li>✓ Control question type distribution</li>
                        <li>✓ Target weak areas for improvement</li>
                        <li>✓ Track your progress across multiple attempts</li>
                    </ul>
                </motion.div>
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
