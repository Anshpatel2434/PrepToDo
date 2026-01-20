import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { MdClose, MdExpandMore, MdExpandLess } from "react-icons/md";
import { useCreateCustomizedMockMutation } from "../redux_usecase/customizedMocksApi";
import { supabase } from "../../../services/apiClient";

interface MockFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    isDark: boolean;
}

const AVAILABLE_GENRES = [
    "Philosophy",
    "History",
    "Economics",
    "Science",
    "Politics",
    "Sociology",
    "Literature",
    "Art & Culture",
];

const MockFormModal: React.FC<MockFormModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    isDark,
}) => {
    const [createMock, { isLoading }] = useCreateCustomizedMockMutation();

    // Form state
    const [mockName, setMockName] = useState("Custom Mock Test");
    const [numPassages, setNumPassages] = useState(3);
    const [totalQuestions, setTotalQuestions] = useState(15);
    const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
    const [selectedGenres, setSelectedGenres] = useState<string[]>(["Philosophy", "History"]);
    const [difficultyTarget, setDifficultyTarget] = useState<"easy" | "medium" | "hard" | "mixed">("mixed");

    // Question type distribution
    const [rcQuestions, setRcQuestions] = useState(4);
    const [paraSummary, setParaSummary] = useState(3);
    const [paraCompletion, setParaCompletion] = useState(3);
    const [paraJumble, setParaJumble] = useState(3);
    const [oddOneOut, setOddOneOut] = useState(2);

    // Advanced options
    const [showAdvanced, setShowAdvanced] = useState(false);

    const questionDistributionTotal = rcQuestions + paraSummary + paraCompletion + paraJumble + oddOneOut;

    const handleGenreToggle = (genre: string) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genre));
        } else {
            setSelectedGenres([...selectedGenres, genre]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (selectedGenres.length === 0) {
            toast.error("Please select at least one genre");
            return;
        }

        if (questionDistributionTotal !== totalQuestions) {
            toast.error(`Question distribution (${questionDistributionTotal}) must equal total questions (${totalQuestions})`);
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
            };

            console.log("[MockFormModal] Creating mock with params:", params);

            const loadingToast = toast.loading("⏳ Generating your customized mock... This may take a few minutes.");

            const result = await createMock(params).unwrap();

            toast.dismiss(loadingToast);

            if (result.success) {
                console.log("[MockFormModal] Mock created successfully:", result);
                onSuccess();
            } else {
                toast.error(result.message || "Failed to create mock test");
            }
        } catch (error) {
            console.error("[MockFormModal] Error creating mock:", error);
            toast.error("An error occurred while creating your mock test");
        }
    };

    const resetForm = () => {
        setMockName("Custom Mock Test");
        setNumPassages(3);
        setTotalQuestions(15);
        setTimeLimitMinutes(60);
        setSelectedGenres(["Philosophy", "History"]);
        setDifficultyTarget("mixed");
        setRcQuestions(4);
        setParaSummary(3);
        setParaCompletion(3);
        setParaJumble(3);
        setOddOneOut(2);
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
                        {/* Mock Name */}
                        <div>
                            <label className={`
                                block text-sm font-medium mb-2
                                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                            `}>
                                Mock Test Name
                            </label>
                            <input
                                type="text"
                                value={mockName}
                                onChange={(e) => setMockName(e.target.value)}
                                className={`
                                    w-full px-4 py-2 rounded-lg border-2 transition-colors
                                    ${isDark
                                        ? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark focus:border-brand-primary-dark"
                                        : "bg-white border-border-light text-text-primary-light focus:border-brand-primary-light"}
                                    outline-none
                                `}
                                required
                            />
                        </div>

                        {/* Basic Configuration Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className={`
                                    block text-sm font-medium mb-2
                                    ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                                `}>
                                    Passages
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={numPassages}
                                    onChange={(e) => setNumPassages(parseInt(e.target.value))}
                                    className={`
                                        w-full px-4 py-2 rounded-lg border-2 transition-colors
                                        ${isDark
                                            ? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark focus:border-brand-primary-dark"
                                            : "bg-white border-border-light text-text-primary-light focus:border-brand-primary-light"}
                                        outline-none
                                    `}
                                    required
                                />
                            </div>

                            <div>
                                <label className={`
                                    block text-sm font-medium mb-2
                                    ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                                `}>
                                    Total Questions
                                </label>
                                <input
                                    type="number"
                                    min="5"
                                    max="50"
                                    value={totalQuestions}
                                    onChange={(e) => setTotalQuestions(parseInt(e.target.value))}
                                    className={`
                                        w-full px-4 py-2 rounded-lg border-2 transition-colors
                                        ${isDark
                                            ? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark focus:border-brand-primary-dark"
                                            : "bg-white border-border-light text-text-primary-light focus:border-brand-primary-light"}
                                        outline-none
                                    `}
                                    required
                                />
                            </div>

                            <div>
                                <label className={`
                                    block text-sm font-medium mb-2
                                    ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                                `}>
                                    Time (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="10"
                                    max="180"
                                    value={timeLimitMinutes}
                                    onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value))}
                                    className={`
                                        w-full px-4 py-2 rounded-lg border-2 transition-colors
                                        ${isDark
                                            ? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark focus:border-brand-primary-dark"
                                            : "bg-white border-border-light text-text-primary-light focus:border-brand-primary-light"}
                                        outline-none
                                    `}
                                    required
                                />
                            </div>
                        </div>

                        {/* Genre Selection */}
                        <div>
                            <label className={`
                                block text-sm font-medium mb-2
                                ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                            `}>
                                Select Genres
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_GENRES.map((genre) => (
                                    <button
                                        key={genre}
                                        type="button"
                                        onClick={() => handleGenreToggle(genre)}
                                        className={`
                                            px-4 py-2 rounded-lg text-sm font-medium transition-all
                                            ${selectedGenres.includes(genre)
                                                ? (isDark
                                                    ? "bg-brand-primary-dark text-white"
                                                    : "bg-brand-primary-light text-white")
                                                : (isDark
                                                    ? "bg-bg-tertiary-dark text-text-secondary-dark border-2 border-border-dark hover:border-brand-primary-dark"
                                                    : "bg-white text-text-secondary-light border-2 border-border-light hover:border-brand-primary-light")
                                            }
                                        `}
                                    >
                                        {genre}
                                    </button>
                                ))}
                            </div>
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

                        {/* Question Distribution */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className={`
                                    text-sm font-medium
                                    ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                                `}>
                                    Question Distribution
                                </label>
                                <span className={`
                                    text-xs px-2 py-1 rounded-full
                                    ${questionDistributionTotal === totalQuestions
                                        ? (isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700")
                                        : (isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700")
                                    }
                                `}>
                                    {questionDistributionTotal} / {totalQuestions}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`
                                        block text-xs mb-1
                                        ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                                    `}>
                                        RC Questions
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={rcQuestions}
                                        onChange={(e) => setRcQuestions(parseInt(e.target.value) || 0)}
                                        className={`
                                            w-full px-3 py-2 rounded-lg border transition-colors text-sm
                                            ${isDark
                                                ? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark"
                                                : "bg-white border-border-light text-text-primary-light"}
                                            outline-none
                                        `}
                                    />
                                </div>
                                <div>
                                    <label className={`
                                        block text-xs mb-1
                                        ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                                    `}>
                                        Para Summary
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={paraSummary}
                                        onChange={(e) => setParaSummary(parseInt(e.target.value) || 0)}
                                        className={`
                                            w-full px-3 py-2 rounded-lg border transition-colors text-sm
                                            ${isDark
                                                ? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark"
                                                : "bg-white border-border-light text-text-primary-light"}
                                            outline-none
                                        `}
                                    />
                                </div>
                                <div>
                                    <label className={`
                                        block text-xs mb-1
                                        ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                                    `}>
                                        Para Completion
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={paraCompletion}
                                        onChange={(e) => setParaCompletion(parseInt(e.target.value) || 0)}
                                        className={`
                                            w-full px-3 py-2 rounded-lg border transition-colors text-sm
                                            ${isDark
                                                ? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark"
                                                : "bg-white border-border-light text-text-primary-light"}
                                            outline-none
                                        `}
                                    />
                                </div>
                                <div>
                                    <label className={`
                                        block text-xs mb-1
                                        ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                                    `}>
                                        Para Jumble
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={paraJumble}
                                        onChange={(e) => setParaJumble(parseInt(e.target.value) || 0)}
                                        className={`
                                            w-full px-3 py-2 rounded-lg border transition-colors text-sm
                                            ${isDark
                                                ? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark"
                                                : "bg-white border-border-light text-text-primary-light"}
                                            outline-none
                                        `}
                                    />
                                </div>
                                <div>
                                    <label className={`
                                        block text-xs mb-1
                                        ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                                    `}>
                                        Odd One Out
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={oddOneOut}
                                        onChange={(e) => setOddOneOut(parseInt(e.target.value) || 0)}
                                        className={`
                                            w-full px-3 py-2 rounded-lg border transition-colors text-sm
                                            ${isDark
                                                ? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark"
                                                : "bg-white border-border-light text-text-primary-light"}
                                            outline-none
                                        `}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Advanced Options Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={`
                                flex items-center gap-2 text-sm font-medium transition-colors
                                ${isDark
                                    ? "text-brand-primary-dark hover:text-brand-primary-dark/80"
                                    : "text-brand-primary-light hover:text-brand-primary-light/80"}
                            `}
                        >
                            {showAdvanced ? <MdExpandLess className="w-5 h-5" /> : <MdExpandMore className="w-5 h-5" />}
                            Advanced Options (Optional)
                        </button>

                        {/* Advanced Options Content */}
                        {showAdvanced && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`
                                    p-4 rounded-lg border
                                    ${isDark ? "bg-bg-tertiary-dark border-border-dark" : "bg-gray-50 border-border-light"}
                                `}
                            >
                                <p className={`
                                    text-xs mb-3
                                    ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                                `}>
                                    These options can be configured later for more personalized test generation.
                                </p>
                                <div className="space-y-2 text-sm">
                                    <div className={isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}>
                                        • Target specific core metrics
                                    </div>
                                    <div className={isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}>
                                        • Address weak areas based on analytics
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <div className="flex items-center gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={isLoading || questionDistributionTotal !== totalQuestions}
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
