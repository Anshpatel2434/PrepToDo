import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useCreateCustomizedMockMutation, useFetchUserMetricProficiencyQuery, useFetchAvailableGenresQuery } from "../redux_usecase/customizedMocksApi";
import { useFetchUserQuery } from "../../auth/redux_usecases/authApi";
import { supabase } from "../../../services/apiClient";
import { MdClose, MdExpandMore, MdExpandLess, MdTimer, MdLibraryBooks, MdAssignment, MdRecommend } from "react-icons/md";

interface MockFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    isDark: boolean;
}


const MockFormModal: React.FC<MockFormModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    isDark,
}) => {
    const [createMock, { isLoading }] = useCreateCustomizedMockMutation();

    const { data: user } = useFetchUserQuery();
    const { data: proficiencyData } = useFetchUserMetricProficiencyQuery(
        user?.id || "" as any,
        { skip: !user?.id }
    );
    const { data: genresData, isLoading: isLoadingGenres } = useFetchAvailableGenresQuery();

    // Form state
    const mockName = "Customized Mock";

    // Fixed values (no longer in input fields)
    const numPassages = 4;
    const totalQuestions = 24;
    const timeLimitMinutes = 40;

    // Fixed question distribution
    const rcQuestions = 4;
    const paraSummary = 2;
    const paraCompletion = 2;
    const paraJumble = 2;
    const oddOneOut = 2;

    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [difficultyTarget, setDifficultyTarget] = useState<"easy" | "medium" | "hard" | "mixed">("mixed");
    const [targetMetrics, setTargetMetrics] = useState<string[]>([]);

    // Advanced options
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Get recommendations from proficiency
    const weakestGenres = proficiencyData
        ?.filter(p => p.dimension_type === "genre")
        ?.sort((a, b) => (a.proficiency_score || 0) - (b.proficiency_score || 0))
        ?.slice(0, 4)
        ?.map(p => p.dimension_key) || [];

    const weakestMetrics = proficiencyData
        ?.filter(p => p.dimension_type === "core_metric")
        ?.sort((a, b) => (a.proficiency_score || 0) - (b.proficiency_score || 0))
        ?.slice(0, 4)
        ?.map(p => p.dimension_key) || [];

    // Auto-select recommendations if empty
    React.useEffect(() => {
        if (selectedGenres.length === 0 && weakestGenres.length > 0) {
            setSelectedGenres(weakestGenres);
        }
        if (targetMetrics.length === 0 && weakestMetrics.length > 0) {
            setTargetMetrics(weakestMetrics);
        }
    }, [proficiencyData]);

    const questionDistributionTotal = rcQuestions + paraSummary + paraCompletion + paraJumble + oddOneOut;

    const handleGenreToggle = (genre: string) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genre));
        } else {
            if (selectedGenres.length < 4) {
                setSelectedGenres([...selectedGenres, genre]);
            } else {
                toast.error("You can select exactly 4 genres");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log("[MockFormModal] Form submitted");

        // Rate limiting: Check if last mock generation was within 20 minutes
        const RATE_LIMIT_KEY = 'lastMockGenerationTime';
        const RATE_LIMIT_MINUTES = 20;

        const lastGenerationTime = localStorage.getItem(RATE_LIMIT_KEY);
        if (lastGenerationTime) {
            const lastTime = new Date(lastGenerationTime).getTime();
            const currentTime = new Date().getTime();
            const timeDiffMinutes = (currentTime - lastTime) / (1000 * 60);

            console.log("[MockFormModal] Rate limit check:", {
                lastGenerationTime,
                timeDiffMinutes: timeDiffMinutes.toFixed(2),
                rateLimitMinutes: RATE_LIMIT_MINUTES,
            });

            if (timeDiffMinutes < RATE_LIMIT_MINUTES) {
                const remainingMinutes = Math.ceil(RATE_LIMIT_MINUTES - timeDiffMinutes);
                console.log("[MockFormModal] Rate limit exceeded, remaining minutes:", remainingMinutes);
                toast.error(
                    `⏱️ Please wait ${remainingMinutes} more minute${remainingMinutes > 1 ? 's' : ''} before generating another mock test.`,
                    {
                        duration: 6000,
                        style: {
                            fontSize: '14px',
                            fontWeight: '600',
                            padding: '16px',
                        },
                    }
                );
                return;
            } else {
                // More than 20 minutes have passed, clear the old timestamp
                console.log("[MockFormModal] Rate limit passed, clearing old timestamp");
                localStorage.removeItem(RATE_LIMIT_KEY);
            }
        } else {
            console.log("[MockFormModal] No previous generation timestamp found");
        }

        // Validation
        if (selectedGenres.length !== 4) {
            console.log("[MockFormModal] Validation failed: Invalid genre count:", selectedGenres.length);
            toast.error("Please select exactly 4 genres");
            return;
        }

        if (numPassages < 1 || numPassages > 5) {
            console.log("[MockFormModal] Validation failed: Invalid passage count:", numPassages);
            toast.error("Number of passages must be between 1 and 5");
            return;
        }

        if (totalQuestions < 5 || totalQuestions > 50) {
            console.log("[MockFormModal] Validation failed: Invalid question count:", totalQuestions);
            toast.error("Total questions must be between 5 and 50");
            return;
        }

        console.log("[MockFormModal] Validation passed");

        try {
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                toast.error("You must be logged in to create a mock test");
                return;
            }

            const params = {
                user_id: user.id,
                mock_name: mockName,
                target_genres: selectedGenres,
                num_passages: numPassages,
                total_questions: totalQuestions,
                question_type_distribution: {
                    rc_questions: rcQuestions,
                    para_summary: paraSummary,
                    para_completion: paraCompletion,
                    para_jumble: paraJumble,
                    odd_one_out: oddOneOut,
                },
                difficulty_target: difficultyTarget,
                time_limit_minutes: timeLimitMinutes,
                target_metrics: targetMetrics,
            };

            console.log("[MockFormModal] Creating mock with params:", params);

            // Save current timestamp to localStorage for rate limiting
            localStorage.setItem(RATE_LIMIT_KEY, new Date().toISOString());
            console.log("[MockFormModal] Rate limit timestamp saved");

            // Fire-and-forget: Start the mutation but don't wait for it
            createMock(params).unwrap().then((result) => {
                console.log("[MockFormModal] Mock creation response received:", {
                    success: result.success,
                    examId: result.exam_id,
                    mockName: result.mock_name,
                    message: result.message,
                });

                if (result.success && result.exam_id) {
                    // The optimistic update already added the mock
                    // The fetchGenerationState subscription will handle updates
                    console.log("[MockFormModal] Mock generation started successfully, exam_id:", result.exam_id);

                    toast.success(
                        `Mock "${result.mock_name || mockName}" generation started!`,
                        {
                            duration: 5000,
                            style: {
                                fontSize: '14px',
                                fontWeight: '500',
                            },
                        }
                    );
                } else {
                    console.error("[MockFormModal] Mock creation failed:", result.message);
                    toast.error(result.message || "Failed to create mock test");
                    // Remove timestamp if generation failed
                    localStorage.removeItem(RATE_LIMIT_KEY);
                    console.log("[MockFormModal] Rate limit timestamp removed due to failure");
                }
            }).catch((error) => {
                console.error("[MockFormModal] Error creating mock:", error);
                toast.error("An error occurred while creating your mock test");
                // Remove timestamp if generation failed
                localStorage.removeItem(RATE_LIMIT_KEY);
                console.log("[MockFormModal] Rate limit timestamp removed due to error");
            });

            // Close modal immediately and trigger UI update
            console.log("[MockFormModal] Closing modal and triggering UI update");
            onSuccess();
        } catch (error) {
            console.error("[MockFormModal] Error creating mock:", error);
            toast.error("An error occurred while creating your mock test");
            // Remove timestamp if there was an error
            localStorage.removeItem(RATE_LIMIT_KEY);
        }
    };

    const resetForm = () => {
        setSelectedGenres([]);
        setTargetMetrics([]);
        setDifficultyTarget("mixed");
        setShowAdvanced(false);
    };

    const handleClose = () => {
        if (!isLoading) {
            resetForm();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={`
                        relative w-full max-w-2xl max-h-[90vh] overflow-y-auto
                        rounded-2xl shadow-2xl
                        ${isDark ? "bg-bg-secondary-dark" : "bg-bg-secondary-light"}
                    `}
                >
                    {/* Header */}
                    <div className={`
                        sticky top-0 z-10 px-6 py-4 border-b
                        ${isDark ? "bg-bg-secondary-dark border-border-dark" : "bg-bg-secondary-light border-border-light"}
                    `}>
                        <div className="flex items-center justify-between">
                            <h2 className={`
                                text-2xl font-serif font-bold
                                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                            `}>
                                Create Custom Mock Test
                            </h2>
                            <button
                                onClick={handleClose}
                                disabled={isLoading}
                                className={`
                                    p-2 rounded-lg transition-colors
                                    ${isDark
                                        ? "hover:bg-bg-tertiary-dark text-text-secondary-dark"
                                        : "hover:bg-bg-tertiary-light text-text-secondary-light"}
                                    ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                                `}
                            >
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {/* Fixed Metadata Display */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className={`
                                p-4 rounded-xl border flex flex-col items-center justify-center text-center
                                ${isDark ? "bg-bg-tertiary-dark/50 border-border-dark" : "bg-bg-tertiary-light/50 border-border-light"}
                            `}>
                                <MdLibraryBooks className={`w-6 h-6 mb-2 ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`} />
                                <span className={`text-xs uppercase tracking-wider font-semibold ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>Passages</span>
                                <span className={`text-xl font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>{numPassages}</span>
                            </div>
                            <div className={`
                                p-4 rounded-xl border flex flex-col items-center justify-center text-center
                                ${isDark ? "bg-bg-tertiary-dark/50 border-border-dark" : "bg-bg-tertiary-light/50 border-border-light"}
                            `}>
                                <MdAssignment className={`w-6 h-6 mb-2 ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`} />
                                <span className={`text-xs uppercase tracking-wider font-semibold ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>Questions</span>
                                <span className={`text-xl font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>{totalQuestions}</span>
                            </div>
                            <div className={`
                                p-4 rounded-xl border flex flex-col items-center justify-center text-center
                                ${isDark ? "bg-bg-tertiary-dark/50 border-border-dark" : "bg-bg-tertiary-light/50 border-border-light"}
                            `}>
                                <MdTimer className={`w-6 h-6 mb-2 ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`} />
                                <span className={`text-xs uppercase tracking-wider font-semibold ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>Time</span>
                                <span className={`text-xl font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>{timeLimitMinutes}m</span>
                            </div>
                        </div>

                        {/* Genre Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className={`
                                    text-sm font-medium
                                    ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                                `}>
                                    Select Exactly 4 Genres
                                </label>
                                <span className={`
                                    text-xs px-2 py-1 rounded-full
                                    ${selectedGenres.length === 4
                                        ? (isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700")
                                        : (isDark ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-700")
                                    }
                                `}>
                                    {selectedGenres.length} / 4 Selected
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {isLoadingGenres ? (
                                    <div className="col-span-4 text-center py-4 text-sm text-text-secondary-light italic">
                                        Loading available genres...
                                    </div>
                                ) : (
                                    genresData?.map((genreObj) => {
                                        const genreName = genreObj.name;
                                        const isSelected = selectedGenres.includes(genreName);
                                        const isRecommended = weakestGenres.includes(genreName);
                                        return (
                                            <button
                                                key={genreObj.id || genreName}
                                                type="button"
                                                onClick={() => handleGenreToggle(genreName)}
                                                className={`
                                                    relative px-3 py-2 rounded-lg text-xs font-medium transition-all text-left flex flex-col gap-1
                                                    ${isSelected
                                                        ? (isDark ? "bg-brand-primary-dark text-white shadow-lg" : "bg-brand-primary-light text-white shadow-lg")
                                                        : (isDark ? "bg-bg-tertiary-dark text-text-secondary-dark border border-border-dark hover:border-brand-primary-dark" : "bg-gray-50 text-text-secondary-light border border-border-light hover:border-brand-primary-light")
                                                    }
                                                `}
                                            >
                                                <span className="flex items-center gap-2">
                                                    {isRecommended && !isSelected && <MdRecommend className="text-amber-500" />}
                                                    {genreName}
                                                </span>
                                                {isRecommended && (
                                                    <span className={`text-[8px] px-1 rounded self-start ${isSelected ? "bg-white/20 text-white" : "bg-amber-50 text-white"}`}>REC</span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                            {weakestGenres.length > 0 && (
                                <p className={`mt-2 text-xs flex items-center gap-1 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>
                                    <MdRecommend className="text-amber-500" />
                                    We recommended your weakest genres first.
                                </p>
                            )}
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className={`
                                block text-sm font-medium mb-2
                                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                            `}>
                                Difficulty Level
                            </label>
                            <div className="grid grid-cols-4 gap-3">
                                {(["easy", "medium", "hard", "mixed"] as const).map((difficulty) => (
                                    <button
                                        key={difficulty}
                                        type="button"
                                        onClick={() => setDifficultyTarget(difficulty)}
                                        className={`
                                            px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                                            ${difficultyTarget === difficulty
                                                ? (isDark
                                                    ? "bg-brand-primary-dark text-white"
                                                    : "bg-brand-primary-light text-white")
                                                : (isDark
                                                    ? "bg-bg-tertiary-dark text-text-secondary-dark border-2 border-border-dark"
                                                    : "bg-white text-text-secondary-light border-2 border-border-light")
                                            }
                                        `}
                                    >
                                        {difficulty}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Question Distribution (Fixed Info) */}
                        <div className={`
                            p-4 rounded-xl border
                            ${isDark ? "bg-bg-tertiary-dark/30 border-border-dark" : "bg-gray-50 border-border-light"}
                        `}>
                            <label className={`
                                block text-sm font-medium mb-3
                                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                            `}>
                                Question Type Distribution
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {[
                                    { label: "RC per passage", count: rcQuestions },
                                    { label: "Summary", count: paraSummary },
                                    { label: "Completion", count: paraCompletion },
                                    { label: "Jumble", count: paraJumble },
                                    { label: "Odd One", count: oddOneOut },
                                ].map((type) => (
                                    <div key={type.label} className="flex flex-col items-center">
                                        <span className={`text-[10px] uppercase font-semibold ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>{type.label}</span>
                                        <span className={`text-sm font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>{type.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Target Metrics */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className={`
                                    text-sm font-medium
                                    ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                                `}>
                                    Target Performance Metrics
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className={`
                                        text-xs flex items-center gap-1 font-medium transition-colors
                                        ${isDark ? "text-brand-primary-dark hover:text-brand-primary-dark/80" : "text-brand-primary-light hover:text-brand-primary-light/80"}
                                    `}
                                >
                                    {showAdvanced ? "Hide Options" : "Select Metrics"}
                                    {showAdvanced ? <MdExpandLess /> : <MdExpandMore />}
                                </button>
                            </div>

                            {targetMetrics.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {targetMetrics.map(metric => (
                                        <span key={metric} className={`
                                            px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2
                                            ${isDark ? "bg-brand-primary-dark/20 text-brand-primary-dark border border-brand-primary-dark/30" : "bg-brand-primary-light/10 text-brand-primary-light border border-brand-primary-light/20"}
                                        `}>
                                            {metric.replace(/_/g, " ")}
                                            <button
                                                type="button"
                                                onClick={() => setTargetMetrics(targetMetrics.filter(m => m !== metric))}
                                                className="hover:text-red-500"
                                            >
                                                <MdClose />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {showAdvanced && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={`
                                        p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-2
                                        ${isDark ? "bg-bg-tertiary-dark border-border-dark" : "bg-gray-50 border-border-light"}
                                    `}
                                >
                                    {proficiencyData?.filter(p => p.dimension_type === "core_metric").map(metric => {
                                        const isSelected = targetMetrics.includes(metric.dimension_key);
                                        const isRecommended = weakestMetrics.includes(metric.dimension_key);
                                        return (
                                            <button
                                                key={metric.dimension_key}
                                                type="button"
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setTargetMetrics(targetMetrics.filter(m => m !== metric.dimension_key));
                                                    } else {
                                                        setTargetMetrics([...targetMetrics, metric.dimension_key]);
                                                    }
                                                }}
                                                className={`
                                                    px-3 py-2 rounded-lg text-xs font-medium transition-all text-left flex items-center justify-between
                                                    ${isSelected
                                                        ? (isDark ? "bg-brand-primary-dark text-white" : "bg-brand-primary-light text-white")
                                                        : (isDark ? "bg-bg-secondary-dark text-text-secondary-dark border border-border-dark hover:border-brand-primary-dark" : "bg-white text-text-secondary-light border border-border-light hover:border-brand-primary-light")
                                                    }
                                                `}
                                            >
                                                <span className="flex items-center gap-2">
                                                    {isRecommended && !isSelected && <MdRecommend className="text-amber-500" />}
                                                    {metric.dimension_key.replace(/_/g, " ")}
                                                </span>
                                                {isRecommended && (
                                                    <span className={`text-[8px] px-1 rounded ${isSelected ? "bg-white/20 text-white" : "bg-amber-500 text-white"}`}>REC</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                    {(!proficiencyData || proficiencyData.filter(p => p.dimension_type === "core_metric").length === 0) && (
                                        <p className="col-span-2 text-center text-xs text-text-muted-light py-2">
                                            No explicit metrics found. Standard metrics will be used.
                                        </p>
                                    )}
                                </motion.div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`
                                    flex-1 px-6 py-3 rounded-xl font-medium transition-all
                                    ${isDark
                                        ? "bg-brand-primary-dark text-white hover:bg-opacity-90"
                                        : "bg-brand-primary-light text-white hover:bg-opacity-90"}
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    ${!isLoading && questionDistributionTotal === totalQuestions ? "transform hover:scale-105" : ""}
                                `}
                            >
                                {isLoading ? "Generating..." : "Generate Mock Test"}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isLoading}
                                className={`
                                    px-6 py-3 rounded-xl font-medium transition-all
                                    ${isDark
                                        ? "bg-bg-tertiary-dark text-text-primary-dark hover:bg-opacity-80"
                                        : "bg-gray-200 text-text-primary-light hover:bg-gray-300"}
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MockFormModal;
