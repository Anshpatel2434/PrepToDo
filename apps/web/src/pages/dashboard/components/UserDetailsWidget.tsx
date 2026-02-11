import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Flame,
    Sparkles,
    Timer,
    Target,
    Check,
    Loader2,
    AlertCircle,
    AtSign,
} from "lucide-react";
import toast from "react-hot-toast";
import type { UserAnalytics, UserProfile } from "../../../types";
import { useAnimatedCounter, useAnimatedPercentage } from "../hooks/useAnimatedCounter";
import { useUpdateUserProfileMutation, useLazyCheckUsernameAvailabilityQuery } from "../redux_usecases/dashboardApi";
import { useDebounceValue } from "../../../hooks/useDebounce";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// =============================================================================
// Types & Constants
// =============================================================================

interface UserDetailsWidgetProps {
    profile: UserProfile | null | undefined;
    analytics: UserAnalytics | null | undefined;
    isLoadingProfile: boolean;
    isLoadingAnalytics: boolean;
    isDark: boolean;
}

const TOGGLE_OPTIONS = [
    { label: "Your Info", value: "info" },
    { label: "Your Stats", value: "stats" },
] as const;

type ViewMode = (typeof TOGGLE_OPTIONS)[number]["value"];

// =============================================================================
// Colorful Stat Card (unchanged)
// =============================================================================

interface ColorfulStatCardProps {
    label: string;
    value: React.ReactNode;
    subtext?: string;
    icon: React.ReactNode;
    colorScheme: "streak" | "points" | "accuracy" | "practice";
    isDark: boolean;
    delay?: number;
    description?: string;
}

const colorClasses = {
    streak: {
        light: "bg-stat-streak-light",
        dark: "bg-stat-streak-dark",
        accentLight: "text-stat-streak-accent-light",
        accentDark: "text-stat-streak-accent-dark",
        iconBgLight: "backdrop-blur-xl bg-amber-300/10",
        iconBgDark: "backdrop-blur-xl bg-amber-300/10",
    },
    points: {
        light: "bg-stat-points-light",
        dark: "bg-stat-points-dark",
        accentLight: "text-stat-points-accent-light",
        accentDark: "text-stat-points-accent-dark",
        iconBgLight: "backdrop-blur-xl bg-emerald-300/10",
        iconBgDark: "backdrop-blur-xl bg-emerald-300/10",
    },
    accuracy: {
        light: "bg-stat-accuracy-light",
        dark: "bg-stat-accuracy-dark",
        accentLight: "text-stat-accuracy-accent-light",
        accentDark: "text-stat-accuracy-accent-dark",
        iconBgLight: "backdrop-blur-xl bg-blue-300/10",
        iconBgDark: "backdrop-blur-xl bg-blue-300/10",
    },
    practice: {
        light: "bg-stat-practice-light",
        dark: "bg-stat-practice-dark",
        accentLight: "text-stat-practice-accent-light",
        accentDark: "text-stat-practice-accent-dark",
        iconBgLight: "backdrop-blur-xl bg-violet-300/10",
        iconBgDark: "backdrop-blur-xl bg-violet-300/10",
    },
};

function ColorfulStatCard({
    label,
    value,
    subtext,
    icon,
    colorScheme,
    isDark,
    delay = 0,
    description,
}: ColorfulStatCardProps) {
    const colors = colorClasses[colorScheme];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                delay: delay * 0.1,
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1],
            }}
            className={`
                relative p-5 rounded-3xl overflow-hidden cursor-default transition-all duration-300
                ${isDark
                    ? "bg-bg-secondary-dark/10 hover:bg-bg-secondary-dark/20"
                    : "bg-white/30 hover:bg-white/50"
                }
                backdrop-blur-xl
            `}
        >
            {/* Content */}
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-1.5">
                    <div className="flex-1 min-w-0">
                        {/* Large number - hero element */}
                        <div
                            className={`text-3xl sm:text-4xl font-bold tracking-tight mb-1 tabular-nums ${isDark
                                ? "text-text-primary-dark"
                                : "text-text-primary-light"
                                }`}
                        >
                            {value}
                        </div>

                        {/* Label */}
                        <div
                            className={`text-base font-semibold opacity-80 ${isDark
                                ? "text-text-secondary-dark"
                                : "text-text-secondary-light"
                                }`}
                        >
                            {label}
                        </div>
                    </div>

                    {/* Icon */}
                    <div
                        className={`
                        inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl
                        ${isDark ? colors.iconBgDark : colors.iconBgLight}
                    `}
                    >
                        <div className={isDark ? colors.accentDark : colors.accentLight}>
                            {icon}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 mt-1">
                    {subtext && (
                        <span
                            className={`text-sm truncate font-medium opacity-70 ${isDark
                                ? "text-text-muted-dark"
                                : "text-text-muted-light"
                                }`}
                        >
                            {subtext}
                        </span>
                    )}
                </div>

                {/* Description Footer */}
                {description && (
                    <div
                        className={`mt-2 pt-2 border-t text-sm font-medium leading-tight ${isDark
                            ? "border-white/10 text-white/60"
                            : "border-black/5 text-black/60"
                            }`}
                    >
                        {description}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// =============================================================================
// Burning Icon (unchanged)
// =============================================================================

function BurningIcon({ isDark }: { isDark: boolean }) {
    return (
        <div className="relative inline-flex items-center justify-center">
            {/* Particles */}
            <div className="absolute inset-0 overflow-visible pointer-events-none">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className={`absolute bottom-1 left-1/2 w-1 h-1 rounded-full ${isDark ? "bg-orange-400" : "bg-orange-500"
                            }`}
                        style={{
                            left: `${40 + i * 20}%`,
                            animation: `sparkRise ${0.8 + i * 0.2}s infinite linear`,
                            animationDelay: `-${i * 0.3}s`,
                        }}
                    />
                ))}
            </div>
            {/* Main Icon */}
            <Flame
                className={`${isDark ? "text-orange-500" : "text-orange-600"} fire-burn`}
                size={24}
            />
        </div>
    );
}

// =============================================================================
// Helper: detect auto-generated username (first-signup)
// =============================================================================

function isAutoGeneratedUsername(username: string | undefined | null, email: string | undefined | null): boolean {
    if (!username || !email) return false;
    const emailPrefix = email.split("@")[0]?.replace(/[^a-zA-Z0-9]/g, "") || "";
    // Auto-generated format: {emailPrefix}preptodo{3-char-userId}
    const pattern = new RegExp(`^${emailPrefix}preptodo[a-f0-9]{3}$`, "i");
    return pattern.test(username);
}

// =============================================================================
// Username Edit Section (Your Info view)
// =============================================================================

interface UsernameEditProps {
    profile: UserProfile;
    isDark: boolean;
    isFirstSetup: boolean;
}

function UsernameEditSection({ profile, isDark, isFirstSetup }: UsernameEditProps) {
    const [username, setUsername] = useState(profile.username || "");
    // Debounce the username input to prevent API abuse
    const debouncedUsername = useDebounceValue(username, 500);

    const [validationMsg, setValidationMsg] = useState("");
    const [validationStatus, setValidationStatus] = useState<"idle" | "checking" | "valid" | "invalid" | "taken">("idle");

    const [updateProfile, { isLoading: isSaving }] = useUpdateUserProfileMutation();
    const [checkAvailability] = useLazyCheckUsernameAvailabilityQuery();

    // Effect to handle validation when debounced username changes
    useEffect(() => {
        const validate = async () => {
            const trimmed = debouncedUsername.trim();

            // Same as current — no change needed
            if (trimmed === profile.username) {
                setValidationStatus("idle");
                setValidationMsg("");
                return;
            }

            // Length check
            if (trimmed.length < 3) {
                setValidationStatus("invalid");
                setValidationMsg("Username must be at least 3 characters.");
                return;
            }
            if (trimmed.length > 50) {
                setValidationStatus("invalid");
                setValidationMsg("Username must be less than 50 characters.");
                return;
            }

            // Format check
            if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
                setValidationStatus("invalid");
                setValidationMsg("Only letters, numbers, and underscores allowed.");
                return;
            }

            // Availability check
            setValidationStatus("checking");
            setValidationMsg("Checking availability...");

            try {
                const result = await checkAvailability(trimmed).unwrap();
                if (result) {
                    setValidationStatus("valid");
                    setValidationMsg("Username is available!");
                } else {
                    setValidationStatus("taken");
                    setValidationMsg("This username is already taken.");
                }
            } catch {
                setValidationStatus("invalid");
                setValidationMsg("Could not check availability.");
            }
        };

        validate();
    }, [debouncedUsername, profile.username, checkAvailability]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
        // Clear status while typing/debouncing
        if (e.target.value.trim() !== profile.username) {
            setValidationStatus("idle");
            setValidationMsg("Typing...");
        }
    };

    const handleSave = async () => {
        const trimmed = username.trim();
        if (trimmed === profile.username || validationStatus !== "valid") return;

        try {
            await updateProfile({ username: trimmed }).unwrap();
            toast.success("Username updated successfully!");
            setValidationStatus("idle");
            setValidationMsg("");
        } catch (err: any) {
            const code = err?.data?.error?.code;
            if (code === "USERNAME_TAKEN") {
                setValidationStatus("taken");
                setValidationMsg("This username is already taken.");
            } else {
                toast.error(err?.data?.error?.message || "Failed to update username.");
            }
        }
    };


    const canSave = validationStatus === "valid" && username.trim() !== profile.username;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
        >
            {/* First-signup prompt */}
            {isFirstSetup && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-3 rounded-2xl flex items-start gap-3 ${isDark
                        ? "bg-brand-primary-dark/10 border border-brand-primary-dark/20"
                        : "bg-brand-primary-light/5 border border-brand-primary-light/15"
                        }`}
                >
                    <Sparkles
                        size={18}
                        className={`mt-0.5 shrink-0 ${isDark ? "text-brand-accent-dark" : "text-brand-primary-light"}`}
                    />
                    <p className={`text-sm font-medium leading-snug ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                        Set your unique username to get started! This is how others will see you on the leaderboard.
                    </p>
                </motion.div>
            )}

            {/* Username field */}
            <div className="space-y-2">
                <label
                    className={`text-sm font-semibold flex items-center gap-1.5 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }`}
                >
                    <AtSign size={14} />
                    Username
                </label>

                <div className="relative">
                    <input
                        type="text"
                        value={username}
                        onChange={handleInputChange}
                        placeholder="your_username"
                        maxLength={50}
                        className={cn(
                            "w-full px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 outline-none",
                            "border-2 focus:ring-2 focus:ring-offset-1",
                            isDark
                                ? "bg-bg-tertiary-dark text-text-primary-dark placeholder-text-muted-dark focus:ring-brand-primary-dark/30"
                                : "bg-white text-text-primary-light placeholder-text-muted-light focus:ring-brand-primary-light/30",
                            validationStatus === "valid"
                                ? "border-emerald-500/50"
                                : validationStatus === "invalid" || validationStatus === "taken"
                                    ? "border-red-500/50"
                                    : isDark
                                        ? "border-border-dark"
                                        : "border-border-light"
                        )}
                    />

                    {/* Status indicator */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {validationStatus === "checking" && (
                            <Loader2 size={18} className="animate-spin text-blue-400" />
                        )}
                        {validationStatus === "valid" && (
                            <Check size={18} className="text-emerald-500" />
                        )}
                        {(validationStatus === "invalid" || validationStatus === "taken") && (
                            <AlertCircle size={18} className="text-red-500" />
                        )}
                    </div>
                </div>

                {/* Validation message */}
                <AnimatePresence mode="wait">
                    {validationMsg && (
                        <motion.p
                            key={validationMsg}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className={cn(
                                "text-xs font-medium px-1",
                                validationStatus === "valid"
                                    ? "text-emerald-500"
                                    : validationStatus === "checking"
                                        ? (isDark ? "text-blue-400" : "text-blue-500")
                                        : "text-red-500"
                            )}
                        >
                            {validationMsg}
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* Explainer */}
                <p
                    className={`text-xs leading-relaxed ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                        }`}
                >
                    This is your unique username shown on the leaderboard. Only letters, numbers, and underscores.
                </p>
            </div>

            {/* Save button */}
            <motion.button
                whileHover={canSave ? { scale: 1.01 } : {}}
                whileTap={canSave ? { scale: 0.99 } : {}}
                onClick={handleSave}
                disabled={!canSave || isSaving}
                className={cn(
                    "w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                    canSave
                        ? isDark
                            ? "bg-brand-primary-dark text-white hover:opacity-90 shadow-lg shadow-brand-primary-dark/20"
                            : "bg-brand-primary-light text-white hover:opacity-90 shadow-lg shadow-brand-primary-light/20"
                        : isDark
                            ? "bg-bg-tertiary-dark text-text-muted-dark cursor-not-allowed"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
            >
                {isSaving ? (
                    <span className="inline-flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                    </span>
                ) : (
                    "Save Username"
                )}
            </motion.button>
        </motion.div>
    );
}

// =============================================================================
// Main Widget
// =============================================================================

export const UserDetailsWidget: React.FC<UserDetailsWidgetProps> = ({
    profile,
    analytics,
    isLoadingProfile,
    isLoadingAnalytics,
    isDark,
}) => {
    const todayKey = React.useMemo(
        () => new Date().toISOString().split("T")[0],
        []
    );

    const practicedToday = React.useMemo(() => {
        if (!analytics) return false;
        return analytics.last_active_date === todayKey;
    }, [analytics, todayKey]);

    const name = profile?.username || profile?.email || "User";

    // Detect first-signup (auto-generated username)
    const isFirstSetup = React.useMemo(
        () => isAutoGeneratedUsername(profile?.username, profile?.email),
        [profile?.username, profile?.email]
    );

    // Default to "info" tab if first-signup, otherwise "stats"
    const [viewMode, setViewMode] = useState<ViewMode>(isFirstSetup ? "info" : "stats");

    // Update viewMode if isFirstSetup changes (e.g., after profile loads)
    useEffect(() => {
        if (isFirstSetup) setViewMode("info");
    }, [isFirstSetup]);

    // ALL HOOKS AT TOP LEVEL
    const animatedStreak = useAnimatedCounter(
        analytics?.current_streak || 0,
        { duration: 1200, delay: 100 }
    );

    const animatedPoints = useAnimatedCounter(
        analytics?.total_points || 0,
        { duration: 1400, delay: 200 }
    );

    const animatedAccuracy = useAnimatedPercentage(
        analytics?.accuracy_percentage || 0,
        { duration: 1400, delay: 300 }
    );

    const animatedMinutes = useAnimatedCounter(
        analytics?.minutes_practiced || 0,
        { duration: 1400, delay: 400 }
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-4 h-full"
        >
            {isLoadingProfile && !profile ? (
                <div className="space-y-6">
                    {/* Skeleton for header */}
                    <div className="flex items-center gap-4">
                        <div
                            className={`animate-pulse w-16 h-16 rounded-2xl ${isDark
                                ? "bg-bg-tertiary-dark"
                                : "bg-bg-tertiary-light"
                                }`}
                        />
                        <div className="space-y-2 flex-1">
                            <div
                                className={`animate-pulse h-8 w-64 rounded-xl ${isDark
                                    ? "bg-bg-tertiary-dark"
                                    : "bg-bg-tertiary-light"
                                    }`}
                            />
                            <div
                                className={`animate-pulse h-4 w-48 rounded ${isDark
                                    ? "bg-bg-tertiary-dark"
                                    : "bg-bg-tertiary-light"
                                    }`}
                            />
                        </div>
                    </div>
                    {/* Skeleton for stat cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className={`animate-pulse h-36 rounded-3xl ${isDark
                                    ? "bg-bg-tertiary-dark"
                                    : "bg-bg-tertiary-light"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Header: Greeting + Toggle */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="flex items-center gap-3 mb-4"
                    >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center 
                                    border overflow-hidden
                                    ${isDark
                                        ? "bg-bg-tertiary-dark border-border-dark"
                                        : "bg-bg-tertiary-light border-border-light"
                                    }
                                `}
                            >
                                {profile?.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User
                                        className={
                                            isDark
                                                ? "text-brand-primary-dark"
                                                : "text-brand-primary-light"
                                        }
                                        size={24}
                                    />
                                )}
                            </motion.div>
                            {practicedToday && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                        delay: 0.6,
                                        type: "spring",
                                        stiffness: 500,
                                    }}
                                    className={`
                                        absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2
                                        flex items-center justify-center text-[8px]
                                        ${isDark
                                            ? "bg-emerald-500 border-bg-primary-dark text-white"
                                            : "bg-emerald-500 border-bg-primary-light text-white"
                                        }
                                    `}
                                    title="Practiced today!"
                                >
                                    ✓
                                </motion.div>
                            )}
                        </div>

                        {/* Welcome text */}
                        <div className="flex-1 min-w-0">
                            <div
                                className={`text-sm font-medium mb-0.5 opacity-80 ${isDark
                                    ? "text-text-muted-dark"
                                    : "text-text-muted-light"
                                    }`}
                            >
                                Hey,
                            </div>
                            <h2
                                className={`font-bold text-3xl tracking-tight truncate ${isDark
                                    ? "text-text-primary-dark"
                                    : "text-text-primary-light"
                                    }`}
                            >
                                {name}!
                            </h2>
                        </div>
                    </motion.div>

                    {/* Segmented Toggle — Your Info / Your Stats */}
                    <div className="flex justify-center mb-2">
                        <div
                            className={cn(
                                "p-1 rounded-lg flex items-center relative",
                                isDark ? "bg-bg-tertiary-dark" : "bg-gray-100"
                            )}
                            role="tablist"
                        >
                            {TOGGLE_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setViewMode(option.value)}
                                    className={cn(
                                        "relative w-28 sm:w-32 px-4 py-1.5 text-sm font-medium transition-colors z-10 flex justify-center",
                                        viewMode === option.value
                                            ? isDark
                                                ? "text-text-primary-dark"
                                                : "text-gray-900"
                                            : isDark
                                                ? "text-text-secondary-dark hover:text-text-primary-dark"
                                                : "text-gray-500 hover:text-gray-900"
                                    )}
                                    role="tab"
                                    aria-selected={viewMode === option.value}
                                >
                                    {viewMode === option.value && (
                                        <motion.div
                                            layoutId="user-details-pill"
                                            className={cn(
                                                "absolute inset-0 rounded-md shadow-sm",
                                                isDark
                                                    ? "bg-bg-secondary-dark"
                                                    : "bg-white"
                                            )}
                                            transition={{
                                                type: "spring",
                                                bounce: 0.2,
                                                duration: 0.6,
                                            }}
                                            style={{ zIndex: -1 }}
                                        />
                                    )}
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area — Animated */}
                    <AnimatePresence mode="wait">
                        {viewMode === "info" ? (
                            <motion.div
                                key="info-view"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {profile && (
                                    <UsernameEditSection
                                        profile={profile}
                                        isDark={isDark}
                                        isFirstSetup={isFirstSetup}
                                    />
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="stats-view"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Colorful Stat Cards Grid — 2x2 */}
                                <div className="grid grid-cols-2 gap-2.5">
                                    <ColorfulStatCard
                                        label="Day Streak"
                                        value={
                                            <span className="tabular-nums">
                                                {animatedStreak}
                                            </span>
                                        }
                                        icon={
                                            animatedStreak > 0 ? (
                                                <BurningIcon isDark={isDark} />
                                            ) : (
                                                <Flame size={24} />
                                            )
                                        }
                                        subtext={`Best: ${analytics?.longest_streak || 0} days`}
                                        colorScheme="streak"
                                        isDark={isDark}
                                        delay={0}
                                        description="Streak counts if you practice at least 5 mins daily."
                                    />

                                    <ColorfulStatCard
                                        label="Total Points"
                                        value={
                                            <span className="tabular-nums">
                                                {animatedPoints.toLocaleString()}
                                            </span>
                                        }
                                        subtext={
                                            practicedToday
                                                ? `+${analytics?.points_earned_today || 0} today`
                                                : "Practice to earn"
                                        }
                                        icon={<Sparkles size={24} />}
                                        colorScheme="points"
                                        isDark={isDark}
                                        delay={1}
                                        description="Earn points via performance. Redeemable for discounts."
                                    />

                                    <ColorfulStatCard
                                        label="Accuracy"
                                        value={
                                            <span className="tabular-nums">
                                                {animatedAccuracy}
                                                <span className="text-xl font-normal opacity-60">
                                                    %
                                                </span>
                                            </span>
                                        }
                                        subtext={`${analytics?.questions_attempted || 0} questions`}
                                        icon={<Target size={24} />}
                                        colorScheme="accuracy"
                                        isDark={isDark}
                                        delay={2}
                                        description="Your average accuracy across all practice sessions."
                                    />

                                    <ColorfulStatCard
                                        label="Practice Time"
                                        value={
                                            <span className="tabular-nums">
                                                {animatedMinutes}
                                                <span className="text-xl font-normal opacity-60">
                                                    m
                                                </span>
                                            </span>
                                        }
                                        icon={<Timer size={24} />}
                                        colorScheme="practice"
                                        isDark={isDark}
                                        delay={3}
                                        description="Total dedicated time spent learning on the platform."
                                    />
                                </div>

                                {isLoadingAnalytics && !analytics && (
                                    <div
                                        className={`animate-pulse h-4 w-48 rounded ${isDark
                                            ? "bg-bg-tertiary-dark"
                                            : "bg-bg-tertiary-light"
                                            }`}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </motion.div>
    );
};
