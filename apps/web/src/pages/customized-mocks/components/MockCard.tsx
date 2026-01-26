import React from "react";
import { motion } from "framer-motion";
import { MdCheckCircle, MdPlayArrow, MdPending, MdAccessTime, MdErrorOutline } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { CustomizedMockWithSession } from "../redux_usecase/customizedMocksApi";
import { useFetchGenerationStateQuery, getStatusMessage } from "../redux_usecase/customizedMocksApi";

interface MockCardProps {
    mock: CustomizedMockWithSession;
    index: number;
    isDark: boolean;
}

const MockCard = React.memo<MockCardProps>(({ mock, index, isDark }) => {
    const navigate = useNavigate();

    const {
        data: generationData,
    } = useFetchGenerationStateQuery(
        mock.id,
        {
            skip: !mock.id || mock.id.startsWith('temp-'),
            pollingInterval: 0, // Rely on subscription only
            refetchOnMountOrArgChange: true,
        }
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const statusBadge = React.useMemo(() => {
        // Check generation state first with null/undefined checks
        if (generationData?.isGenerating && generationData?.state) {
            const status = generationData.state.status ?? "initializing";
            const currentStep = generationData.state.current_step ?? 1;
            const totalSteps = generationData.state.total_steps ?? 7;

            const { message, shortMessage } = getStatusMessage(
                status,
                currentStep,
                totalSteps
            );

            return {
                icon: MdPending,
                text: shortMessage,
                fullMessage: message,
                bgClass: isDark
                    ? "bg-purple-900/30 text-purple-400"
                    : "bg-purple-100 text-purple-700",
                animate: true,
            };
        }

        // Check for failed generation with null/undefined checks
        if (generationData?.state?.status === 'failed') {
            return {
                icon: MdErrorOutline,
                text: "Failed",
                fullMessage: generationData.state.error_message || "Generation failed",
                bgClass: isDark
                    ? "bg-red-900/30 text-red-400"
                    : "bg-red-100 text-red-700",
                animate: false,
            };
        }

        // Check if this is an optimistic mock (still generating) with null/undefined checks
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unsafeMock = mock as any;
        if (unsafeMock?.isOptimistic || unsafeMock?.generation_status === 'generating') {
            return {
                icon: MdPending,
                text: "Generating...",
                fullMessage: "Generating your customized mock...",
                bgClass: isDark
                    ? "bg-purple-900/30 text-purple-400"
                    : "bg-purple-100 text-purple-700",
                animate: true,
            };
        }

        // Regular session status with null/undefined checks
        switch (mock?.session_status) {
            case "completed":
                return {
                    icon: MdCheckCircle,
                    text: "Completed",
                    fullMessage: "Test completed",
                    bgClass: isDark
                        ? "bg-green-900/30 text-green-400"
                        : "bg-green-100 text-green-700",
                    animate: false,
                };
            case "in_progress":
                return {
                    icon: MdPending,
                    text: "In Progress",
                    fullMessage: "Test in progress",
                    bgClass: isDark
                        ? "bg-yellow-900/30 text-yellow-400"
                        : "bg-yellow-100 text-yellow-700",
                    animate: false,
                };
            case "not_started":
            default:
                return {
                    icon: MdPlayArrow,
                    text: "Not Started",
                    fullMessage: "Ready to start",
                    bgClass: isDark
                        ? "bg-blue-900/30 text-blue-400"
                        : "bg-blue-100 text-blue-700",
                    animate: false,
                };
        }
    }, [mock, generationData, isDark]);

    const StatusIcon = statusBadge?.icon ?? MdPlayArrow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isGenerating = generationData?.isGenerating || (mock as any)?.isOptimistic;

    const handleClick = React.useCallback(() => {
        // Don't navigate if still generating
        if (isGenerating) {
            toast(statusBadge?.fullMessage || "Mock test is still being generated.", {
                icon: "⏳",
                duration: 4000,
            });
            return;
        }

        // Don't navigate if failed
        if (generationData?.state?.status === 'failed') {
            toast.error("This mock generation failed. Please try creating a new one.");
            return;
        }

        // Validate mock.id exists before navigation
        if (!mock?.id) {
            toast.error("Invalid mock test. Please try again.");
            return;
        }

        navigate(`/mock?exam_id=${mock.id}`);
    }, [isGenerating, statusBadge, generationData, mock, navigate]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }} // Faster stagger
            onClick={handleClick}
            className={`
                relative overflow-hidden p-6 rounded-2xl border-2 cursor-pointer
                group transition-all duration-300
                ${isDark
                    ? "bg-bg-secondary-dark border-border-dark hover:border-brand-primary-dark"
                    : "bg-bg-secondary-light border-border-light hover:border-brand-primary-light"
                }
                ${!isGenerating ? "hover:shadow-xl transform hover:-translate-y-1" : ""}
                ${isGenerating ? "opacity-75" : ""}
            `}
        >
            {/* Gradient Background on Hover - Optimized with will-change */}
            <div
                className={`
                    absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 will-change-opacity
                    ${isDark
                        ? "bg-gradient-to-br from-purple-600/10 to-blue-600/10"
                        : "bg-gradient-to-br from-purple-500/5 to-blue-500/5"
                    }
                `}
            />

            {/* Content */}
            <div className="relative z-10">
                {/* Header with Status Badge */}
                <div className="flex items-start justify-between mb-4">
                    <h3
                        className={`
                            font-serif font-bold text-xl flex-1
                            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
                        `}
                    >
                        {mock?.name || "Untitled Mock"}
                    </h3>
                    <span
                        className={`
                            flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                            ${statusBadge?.bgClass || (isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700")}
                        `}
                    >
                        {statusBadge?.animate ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            >
                                <StatusIcon className="w-4 h-4" />
                            </motion.div>
                        ) : (
                            <StatusIcon className="w-4 h-4" />
                        )}
                        {statusBadge?.text || "Unknown"}
                    </span>
                </div>

                {/* Progress Message (if generating or failed) */}
                {(isGenerating || generationData?.state?.status === 'failed') && statusBadge?.fullMessage && (
                    <div className={`
                        mb-3 text-sm
                        ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                    `}>
                        {statusBadge.fullMessage}
                    </div>
                )}

                {/* Date */}
                <div className="flex items-center gap-2 mb-4">
                    <MdAccessTime
                        className={`w-4 h-4 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                            }`}
                    />
                    <p
                        className={`
                            text-sm
                            ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                        `}
                    >
                        {mock?.created_at ? formatDate(mock.created_at) : "Unknown date"}
                    </p>
                </div>

                {/* Metadata */}
                <div
                    className={`
                        flex items-center gap-3 text-sm mb-4
                        ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
                    `}
                >
                    <span>{mock?.passages_count ?? 0} Passages</span>
                    <span>•</span>
                    <span>{mock?.questions_count ?? 0} Questions</span>
                    {mock?.time_limit_minutes && (
                        <>
                            <span>•</span>
                            <span>{mock.time_limit_minutes} min</span>
                        </>
                    )}
                </div>

                {/* Action Indicator - CSS Animation Replacement */}
                {!isGenerating && generationData?.state?.status !== 'failed' && (
                    <div className="flex items-center gap-2 mt-4">
                        <span
                            className={`
                            text-sm font-medium
                            ${isDark
                                    ? "text-brand-primary-dark"
                                    : "text-brand-primary-light"
                                }
                        `}
                        >
                            {mock?.session_status === "completed"
                                ? "View Results"
                                : mock?.session_status === "in_progress"
                                    ? "Continue Test"
                                    : "Start Test"}
                        </span>
                        <span
                            className={`
                                transform transition-transform duration-300 group-hover:translate-x-1
                                ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}
                            `}
                        >
                            →
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
});

export default MockCard;
