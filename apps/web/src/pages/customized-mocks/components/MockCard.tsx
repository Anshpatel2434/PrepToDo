import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Play, Clock, AlertCircle, Loader2, ArrowRight, FileText, Timer } from "lucide-react";
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
            month: "short",
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
                icon: Loader2,
                text: shortMessage,
                fullMessage: message,
                bgClass: isDark
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-amber-50 text-amber-600 border-amber-200",
                animate: true,
            };
        }

        // Check for failed generation with null/undefined checks
        if (generationData?.state?.status === 'failed') {
            return {
                icon: AlertCircle,
                text: "Failed",
                fullMessage: generationData.state.error_message || "Generation failed",
                bgClass: isDark
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : "bg-red-50 text-red-600 border-red-200",
                animate: false,
            };
        }

        // Check if this is an optimistic mock (still generating) with null/undefined checks
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unsafeMock = mock as any;
        if (unsafeMock?.isOptimistic || unsafeMock?.generation_status === 'generating') {
            return {
                icon: Loader2,
                text: "Generating...",
                fullMessage: "Generating your customized mock...",
                bgClass: isDark
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-amber-50 text-amber-600 border-amber-200",
                animate: true,
            };
        }

        // Regular session status with null/undefined checks
        switch (mock?.session_status) {
            case "completed":
                return {
                    icon: CheckCircle2,
                    text: "Completed",
                    fullMessage: "Test completed",
                    bgClass: isDark
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-emerald-50 text-emerald-600 border-emerald-200",
                    animate: false,
                };
            case "in_progress":
                return {
                    icon: Clock,
                    text: "In Progress",
                    fullMessage: "Test in progress",
                    bgClass: isDark
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        : "bg-blue-50 text-blue-600 border-blue-200",
                    animate: false,
                };
            case "not_started":
            default:
                return {
                    icon: Play,
                    text: "Not Started",
                    fullMessage: "Ready to start",
                    bgClass: isDark
                        ? "bg-bg-tertiary-dark text-text-secondary-dark border-transparent"
                        : "bg-gray-100 text-gray-500 border-gray-200",
                    animate: false,
                };
        }
    }, [mock, generationData, isDark]);

    const StatusIcon = statusBadge?.icon ?? Play;
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
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={handleClick}
            className={`
                group relative p-5 rounded-3xl border cursor-pointer overflow-hidden
                transition-all duration-300
                ${isDark
                    ? "bg-white/5 border-white/5 hover:border-brand-primary-dark/30 hover:bg-white/10"
                    : "bg-white border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-primary-light/30"
                }
                ${isGenerating ? "opacity-80" : ""}
            `}
        >
            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Header: Date & Status */}
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${statusBadge?.bgClass}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${statusBadge?.animate ? "animate-spin" : ""}`} />
                        {statusBadge?.text}
                    </div>
                </div>

                {/* Title and Icon */}
                <div className="flex-1 mb-6">
                    <div className={`
                        w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-xl
                        ${isDark ? "bg-bg-tertiary-dark text-text-primary-dark" : "bg-bg-secondary-light text-brand-primary-light"}
                    `}>
                        <FileText size={20} />
                    </div>

                    <h3 className={`font-serif font-bold text-lg leading-tight mb-2 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                        {"Customized Sectional Test"}
                    </h3>

                    <div className={`flex items-center gap-2 text-2xl opacity-60 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                        <Clock size={16} />
                        <span>{mock?.created_at ? formatDate(mock.created_at) : "Unknown date"}</span>
                    </div>

                </div>

                {/* Footer Metrics */}
                <div className={`
                    pt-4 border-t flex items-center justify-between text-xs font-medium
                    ${isDark ? "border-white/5 text-text-secondary-dark" : "border-gray-100 text-text-secondary-light"}
                `}>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <FileText size={12} />
                            {mock?.questions_count ?? 0} Qs
                        </span>
                        <span className="flex items-center gap-1">
                            <Timer size={12} />
                            {mock?.time_limit_minutes ?? 0}m
                        </span>
                    </div>

                    {!isGenerating && generationData?.state?.status !== 'failed' && (
                        <div className={`
                            flex items-center gap-1 transition-transform group-hover:translate-x-1
                            ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}
                        `}>
                            {mock?.session_status === "completed" ? "Results" : "Start"}
                            <ArrowRight size={12} />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

export default MockCard;
