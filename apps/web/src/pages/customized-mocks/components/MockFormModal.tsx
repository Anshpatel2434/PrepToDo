import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useCreateCustomizedMockMutation, useFetchUserMetricProficiencyQuery, useFetchAvailableGenresQuery } from "../redux_usecase/customizedMocksApi";
import { useFetchUserQuery } from "../../auth/redux_usecases/authApi";
import { X, ChevronDown, ChevronUp, Timer, BookOpen, ClipboardList, Sparkles, Check } from "lucide-react";

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

    const { data: user, error: userError } = useFetchUserQuery();
    const { data: proficiencyData } = useFetchUserMetricProficiencyQuery(
        user?.id || "",
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
    const weakestGenres = React.useMemo(() => proficiencyData
        ?.filter(p => p.dimension_type === "genre")
        ?.sort((a, b) => (a.proficiency_score || 0) - (b.proficiency_score || 0))
        ?.slice(0, 4)
        ?.map(p => p.dimension_key) || [], [proficiencyData]);

    const weakestMetrics = React.useMemo(() => proficiencyData
        ?.filter(p => p.dimension_type === "core_metric")
        ?.sort((a, b) => (a.proficiency_score || 0) - (b.proficiency_score || 0))
        ?.slice(0, 4)
        ?.map(p => p.dimension_key) || [], [proficiencyData]);

    // Auto-select recommendations if empty
    React.useEffect(() => {
        if (selectedGenres.length === 0 && weakestGenres.length > 0) {
            setSelectedGenres(weakestGenres);
        }
        if (targetMetrics.length === 0 && weakestMetrics.length > 0) {
            setTargetMetrics(weakestMetrics);
        }
    }, [selectedGenres.length, targetMetrics.length, weakestGenres, weakestMetrics]);

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

        if (userError || !user) {
            toast.error("You must be logged in to create a mock test");
            return;
        }

        // Rate limiting: Check if last mock generation was within 20 minutes
        const RATE_LIMIT_KEY = 'lastMockGenerationTime';
        const RATE_LIMIT_MINUTES = 20;

        const lastGenerationTime = localStorage.getItem(RATE_LIMIT_KEY);
        if (lastGenerationTime) {
            const lastTime = new Date(lastGenerationTime).getTime();
            const currentTime = new Date().getTime();
            const timeDiffMinutes = (currentTime - lastTime) / (1000 * 60);

            if (timeDiffMinutes < RATE_LIMIT_MINUTES) {
                const remainingMinutes = Math.ceil(RATE_LIMIT_MINUTES - timeDiffMinutes);
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
                localStorage.removeItem(RATE_LIMIT_KEY);
            }
        }

        // Validation
        if (selectedGenres.length !== 4) {
            toast.error("Please select exactly 4 genres");
            return;
        }

        if (numPassages < 1 || numPassages > 5) {
            toast.error("Number of passages must be between 1 and 5");
            return;
        }

        if (totalQuestions < 5 || totalQuestions > 50) {
            toast.error("Total questions must be between 5 and 50");
            return;
        }

        try {
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

            // Save current timestamp to localStorage for rate limiting
            localStorage.setItem(RATE_LIMIT_KEY, new Date().toISOString());

            // Fire-and-forget: Start the mutation but don't wait for it
            createMock(params).unwrap().then((result) => {
                if (result.success && result.exam_id) {
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
                    localStorage.removeItem(RATE_LIMIT_KEY);
                }
            }).catch((error) => {
                console.error("[MockFormModal] Error creating mock:", error);
                toast.error("An error occurred while creating your mock test");
                localStorage.removeItem(RATE_LIMIT_KEY);
            });

            // Close modal immediately and trigger UI update
            onSuccess();
        } catch (error) {
            console.error("[MockFormModal] Error creating mock:", error);
            toast.error("An error occurred while creating your mock test");
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
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={`
                        relative w-full max-w-2xl max-h-[85vh] overflow-y-auto overflow-x-hidden
                        rounded-3xl shadow-2xl border
                        ${isDark
                            ? "bg-bg-secondary-dark border-white/10"
                            : "bg-white border-white/50"
                        }
                    `}
                >
                    {/* Header */}
                    <div className={`
                        sticky top-0 z-10 px-8 py-5 border-b backdrop-blur-md flex items-center justify-between
                        ${isDark
                            ? "bg-bg-secondary-dark/80 border-white/10"
                            : "bg-white/80 border-black/5"
                        }
                    `}>
                        <h2 className={`
                            text-2xl font-serif font-bold tracking-tight
                            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                        `}>
                            New Mock Test
                        </h2>
                        <button
                            onClick={handleClose}
                            disabled={isLoading}
                            className={`
                                p-2 rounded-full transition-colors
                                ${isDark
                                    ? "hover:bg-white/10 text-text-secondary-dark"
                                    : "hover:bg-black/5 text-text-secondary-light"}
                                ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                            `}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-8">

                        {/* Fixed Metadata Display */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className={`
                                p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-1 border
                                ${isDark ? "bg-bg-tertiary-dark/50 border-white/5" : "bg-gray-50 border-black/5"}
                            `}>
                                <BookOpen className={`w-5 h-5 mb-1 ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`} />
                                <span className={`text-[10px] uppercase tracking-wider font-bold opacity-60 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>Passages</span>
                                <span className={`text-xl font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>{numPassages}</span>
                            </div>
                            <div className={`
                                p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-1 border
                                ${isDark ? "bg-bg-tertiary-dark/50 border-white/5" : "bg-gray-50 border-black/5"}
                            `}>
                                <ClipboardList className={`w-5 h-5 mb-1 ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`} />
                                <span className={`text-[10px] uppercase tracking-wider font-bold opacity-60 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>Questions</span>
                                <span className={`text-xl font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>{totalQuestions}</span>
                            </div>
                            <div className={`
                                p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-1 border
                                ${isDark ? "bg-bg-tertiary-dark/50 border-white/5" : "bg-gray-50 border-black/5"}
                            `}>
                                <Timer className={`w-5 h-5 mb-1 ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}`} />
                                <span className={`text-[10px] uppercase tracking-wider font-bold opacity-60 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>Time</span>
                                <span className={`text-xl font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>{timeLimitMinutes}m</span>
                            </div>
                        </div>

                        {/* Genre Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className={`
                                    text-base font-bold
                                    ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                                `}>
                                    Select Genres
                                </label>
                                <span className={`
                                    text-xs px-2.5 py-1 rounded-md font-bold
                                    ${selectedGenres.length === 4
                                        ? "bg-emerald-500/10 text-emerald-500"
                                        : "bg-amber-500/10 text-amber-500"
                                    }
                                `}>
                                    {selectedGenres.length} / 4 Selected
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {isLoadingGenres ? (
                                    <div className="col-span-4 text-center py-8 opacity-50 text-sm">
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
                                                    relative px-4 py-3 rounded-xl text-xs font-bold transition-all text-left flex flex-col gap-2 border
                                                    ${isSelected
                                                        ? (isDark
                                                            ? "bg-brand-primary-dark text-white border-brand-primary-dark shadow-lg shadow-brand-primary-dark/20"
                                                            : "bg-brand-primary-light text-white border-brand-primary-light shadow-lg shadow-brand-primary-light/20")
                                                        : (isDark
                                                            ? "bg-white/5 border-white/5 text-text-secondary-dark hover:bg-white/10 hover:border-white/10"
                                                            : "bg-white border-gray-100 text-text-secondary-light hover:border-brand-primary-light/30 hover:shadow-md")
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="truncate">{genreName}</span>
                                                    {isSelected && <Check size={12} />}
                                                </div>

                                                {isRecommended && (
                                                    <div className={`flex items-center gap-1 text-[10px] ${isSelected ? "text-white/80" : "text-amber-500"}`}>
                                                        <Sparkles size={10} />
                                                        <span>Recommended</span>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                            {weakestGenres.length > 0 && (
                                <p className={`mt-3 text-xs flex items-center gap-1.5 opacity-60 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                    <Sparkles size={12} className="text-amber-500" />
                                    <span>Based on your recent performance analysis.</span>
                                </p>
                            )}
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className={`
                                block text-base font-bold mb-4
                                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                            `}>
                                Difficulty Level
                            </label>
                            <div className={`p-1 rounded-xl flex ${isDark ? "bg-black/20" : "bg-gray-100"}`}>
                                {(["easy", "medium", "hard", "mixed"] as const).map((difficulty) => (
                                    <button
                                        key={difficulty}
                                        type="button"
                                        onClick={() => setDifficultyTarget(difficulty)}
                                        className={`
                                            flex-1 py-2.5 rounded-lg text-sm font-bold transition-all capitalize
                                            ${difficultyTarget === difficulty
                                                ? (isDark
                                                    ? "bg-brand-secondary-dark text-text-primary-dark shadow-md"
                                                    : "bg-white text-brand-primary-light shadow-md")
                                                : (isDark
                                                    ? "text-text-secondary-dark hover:text-text-primary-dark"
                                                    : "text-gray-500 hover:text-gray-900")
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
                            p-5 rounded-2xl border
                            ${isDark ? "bg-white/5 border-white/5" : "bg-gray-50/50 border-gray-100"}
                        `}>
                            <label className={`
                                block text-xs uppercase tracking-widest font-bold mb-4 opacity-50
                                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                            `}>
                                Layout Configuration
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                {[
                                    { label: "RC per passage", count: rcQuestions },
                                    { label: "Summary", count: paraSummary },
                                    { label: "Completion", count: paraCompletion },
                                    { label: "Jumble", count: paraJumble },
                                    { label: "Odd One", count: oddOneOut },
                                ].map((type) => (
                                    <div key={type.label} className="flex flex-col gap-1">
                                        <span className={`text-[10px] font-medium opacity-60 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>{type.label}</span>
                                        <span className={`text-lg font-bold ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>{type.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Target Metrics */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className={`
                                    text-sm font-bold
                                    ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                                `}>
                                    Target Performance Metrics
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className={`
                                        text-xs flex items-center gap-1 font-bold transition-colors
                                        ${isDark ? "text-brand-primary-dark hover:text-brand-primary-dark/80" : "text-brand-primary-light hover:text-brand-primary-light/80"}
                                    `}
                                >
                                    {showAdvanced ? "Hide Options" : "Select Metrics"}
                                    {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                            </div>

                            {targetMetrics.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {targetMetrics.map(metric => (
                                        <span key={metric} className={`
                                            px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border
                                            ${isDark
                                                ? "bg-brand-primary-dark/10 text-brand-primary-dark border-brand-primary-dark/20"
                                                : "bg-brand-primary-light/5 text-brand-primary-light border-brand-primary-light/20"
                                            }
                                        `}>
                                            {metric.replace(/_/g, " ")}
                                            <button
                                                type="button"
                                                onClick={() => setTargetMetrics(targetMetrics.filter(m => m !== metric))}
                                                className="hover:text-red-500 transition-colors"
                                            >
                                                <X size={12} />
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
                                        ${isDark ? "bg-bg-tertiary-dark border-white/5" : "bg-gray-50 border-gray-100"}
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
                                                    px-4 py-3 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border
                                                    ${isSelected
                                                        ? (isDark ? "bg-brand-primary-dark text-white border-brand-primary-dark" : "bg-brand-primary-light text-white border-brand-primary-light")
                                                        : (isDark ? "bg-bg-secondary-dark text-text-secondary-dark border-white/5 hover:border-white/20" : "bg-white text-text-secondary-light border-gray-200 hover:border-brand-primary-light/50")
                                                    }
                                                `}
                                            >
                                                <span className="flex items-center gap-2">
                                                    {isRecommended && !isSelected && <Sparkles size={12} className="text-amber-500" />}
                                                    {metric.dimension_key.replace(/_/g, " ")}
                                                </span>
                                                {isRecommended && (
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${isSelected ? "bg-white/20 text-white" : "bg-amber-500/10 text-amber-500"}`}>REC</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                    {(!proficiencyData || proficiencyData.filter(p => p.dimension_type === "core_metric").length === 0) && (
                                        <p className="col-span-2 text-center text-xs opacity-50 py-2">
                                            No explicit metrics found. Standard metrics will be used.
                                        </p>
                                    )}
                                </motion.div>
                            )}
                        </div>

                        {/* Submit Actions */}
                        <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isLoading}
                                className={`
                                    px-6 py-3.5 rounded-xl font-bold transition-all
                                    ${isDark
                                        ? "bg-white/5 text-text-primary-dark hover:bg-white/10"
                                        : "bg-gray-100 text-text-primary-light hover:bg-gray-200"}
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`
                                    flex-1 px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg
                                    ${isDark
                                        ? "bg-brand-primary-dark text-white shadow-brand-primary-dark/20 hover:bg-opacity-90"
                                        : "bg-brand-primary-light text-white shadow-brand-primary-light/20 hover:bg-opacity-90"}
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    ${!isLoading && questionDistributionTotal === totalQuestions ? "transform hover:scale-[1.02]" : ""}
                                `}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Generating...</span>
                                    </div>
                                ) : (
                                    "Generate Mock Test"
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MockFormModal;
