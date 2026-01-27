import React from "react";
import { motion } from "framer-motion";
import {
    MdPerson,
    MdLocalFireDepartment,
    MdStars,
    MdTimer,
    MdTrendingUp,
    MdTrendingDown,
} from "react-icons/md";
import type { UserAnalytics, UserProfile } from "../../../types";
import { useAnimatedCounter, useAnimatedPercentage } from "../hooks/useAnimatedCounter";

interface UserDetailsWidgetProps {
    profile: UserProfile | null | undefined;
    analytics: UserAnalytics | null | undefined;
    isLoadingProfile: boolean;
    isLoadingAnalytics: boolean;
    isDark: boolean;
}

// Colorful stat card component - inspired by Zarss/Aonix dashboards
interface ColorfulStatCardProps {
    label: string;
    value: React.ReactNode;
    subtext?: string;
    change?: { value: number; type: 'positive' | 'negative' | 'neutral' };
    icon: React.ReactNode;
    colorScheme: 'streak' | 'points' | 'accuracy' | 'practice';
    isDark: boolean;
    delay?: number;
    description?: string;
}

const colorClasses = {
    streak: {
        light: 'bg-stat-streak-light',
        dark: 'bg-stat-streak-dark',
        accentLight: 'text-stat-streak-accent-light',
        accentDark: 'text-stat-streak-accent-dark',
        iconBgLight: 'bg-amber-200/60',
        iconBgDark: 'bg-amber-500/20',
    },
    points: {
        light: 'bg-stat-points-light',
        dark: 'bg-stat-points-dark',
        accentLight: 'text-stat-points-accent-light',
        accentDark: 'text-stat-points-accent-dark',
        iconBgLight: 'bg-emerald-200/60',
        iconBgDark: 'bg-emerald-500/20',
    },
    accuracy: {
        light: 'bg-stat-accuracy-light',
        dark: 'bg-stat-accuracy-dark',
        accentLight: 'text-stat-accuracy-accent-light',
        accentDark: 'text-stat-accuracy-accent-dark',
        iconBgLight: 'bg-blue-200/60',
        iconBgDark: 'bg-blue-500/20',
    },
    practice: {
        light: 'bg-stat-practice-light',
        dark: 'bg-stat-practice-dark',
        accentLight: 'text-stat-practice-accent-light',
        accentDark: 'text-stat-practice-accent-dark',
        iconBgLight: 'bg-violet-200/60',
        iconBgDark: 'bg-violet-500/20',
    },
};

function ColorfulStatCard({
    label,
    value,
    subtext,
    change,
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
                ease: [0.34, 1.56, 0.64, 1]
            }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`
                relative p-4 sm:p-5 rounded-3xl overflow-hidden cursor-default
                transition-shadow duration-300
                ${isDark ? colors.dark : colors.light}
                ${isDark
                    ? 'shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30'
                    : 'shadow-md shadow-black/5 hover:shadow-lg hover:shadow-black/10'
                }
            `}
        >
            {/* Background pattern - subtle dots */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                }}
            />

            {/* Content */}
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        {/* Large number - hero element */}
                        <div className={`text-3xl sm:text-4xl font-bold tracking-tight mb-0.5 tabular-nums number-shimmer ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}>
                            {value}
                        </div>

                        {/* Label */}
                        <div className={`text-sm font-medium ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                            }`}>
                            {label}
                        </div>
                    </div>

                    {/* Icon */}
                    <div className={`
                        inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl
                        ${isDark ? colors.iconBgDark : colors.iconBgLight}
                    `}>
                        <div className={isDark ? colors.accentDark : colors.accentLight}>
                            {icon}
                        </div>
                    </div>
                </div>

                {/* Footer: subtext + change badge */}
                <div className="flex items-center justify-between gap-2 mt-1.5">
                    {subtext && (
                        <span className={`text-xs ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                            }`}>
                            {subtext}
                        </span>
                    )}

                    {change && change.value !== 0 && (
                        <span className={`
                            inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full
                            ${change.type === 'positive'
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : change.type === 'negative'
                                    ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                                    : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                            }
                        `}>
                            {change.type === 'positive' ? (
                                <MdTrendingUp className="w-3 h-3" />
                            ) : (
                                <MdTrendingDown className="w-3 h-3" />
                            )}
                            {change.type === 'positive' ? '+' : ''}{change.value}%
                        </span>
                    )}
                </div>

                {/* Description Footer */}
                {description && (
                    <div className={`mt-2 pt-2 border-t text-[10px] leading-tight ${isDark ? "border-white/10 text-white/40" : "border-black/5 text-black/40"}`}>
                        {description}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// Burning icon with particles
function BurningIcon({ isDark }: { isDark: boolean }) {
    return (
        <div className="relative inline-flex items-center justify-center">
            {/* Particles */}
            <div className="absolute inset-0 overflow-visible pointer-events-none">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className={`absolute bottom-1 left-1/2 w-1 h-1 rounded-full ${isDark ? "bg-orange-400" : "bg-orange-500"}`}
                        style={{
                            left: `${40 + (i * 20)}%`,
                            animation: `sparkRise ${0.8 + (i * 0.2)}s infinite linear`,
                            animationDelay: `-${i * 0.3}s`
                        }}
                    />
                ))}
            </div>
            {/* Main Icon */}
            <MdLocalFireDepartment
                className={`${isDark ? "text-orange-500" : "text-orange-600"} fire-burn`}
                size={24}
            />
        </div>
    );
}

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

    const name = profile?.display_name || profile?.username || "User";

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
            className="space-y-6"
        >
            {isLoadingProfile && !profile ? (
                <div className="space-y-6">
                    {/* Skeleton for header */}
                    <div className="flex items-center gap-4">
                        <div className={`animate-pulse w-16 h-16 rounded-2xl ${isDark ? 'bg-bg-tertiary-dark' : 'bg-bg-tertiary-light'
                            }`} />
                        <div className="space-y-2 flex-1">
                            <div className={`animate-pulse h-8 w-64 rounded-xl ${isDark ? 'bg-bg-tertiary-dark' : 'bg-bg-tertiary-light'
                                }`} />
                            <div className={`animate-pulse h-4 w-48 rounded ${isDark ? 'bg-bg-tertiary-dark' : 'bg-bg-tertiary-light'
                                }`} />
                        </div>
                    </div>
                    {/* Skeleton for stat cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className={`animate-pulse h-36 rounded-3xl ${isDark ? 'bg-bg-tertiary-dark' : 'bg-bg-tertiary-light'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Welcome Header - Zarss style */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="flex items-center gap-4"
                    >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className={`
                                    w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center 
                                    border-2 overflow-hidden
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
                                    <MdPerson
                                        className={isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}
                                        size={28}
                                    />
                                )}
                            </motion.div>
                            {practicedToday && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.6, type: "spring", stiffness: 500 }}
                                    className={`
                                        absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2
                                        flex items-center justify-center text-[10px]
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
                        <div>
                            <div className={`text-sm ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>
                                Welcome back,
                            </div>
                            <h2 className={`font-bold text-2xl sm:text-3xl tracking-tight ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}>
                                {name}!
                            </h2>
                        </div>
                    </motion.div>



                    {/* Colorful Stat Cards Grid - The main attraction! */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <ColorfulStatCard
                            label="Day Streak"
                            value={
                                <span className="tabular-nums">{animatedStreak}</span>
                            }
                            icon={
                                animatedStreak > 0 ? (
                                    <BurningIcon isDark={isDark} />
                                ) : (
                                    <MdLocalFireDepartment size={24} />
                                )
                            }
                            subtext={`Best: ${analytics?.longest_streak || 0} days`}
                            change={animatedStreak > 3 ? { value: 15, type: 'positive' } : undefined}

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
                            subtext={practicedToday ? `+${analytics?.points_earned_today || 0} today` : "Practice to earn"}
                            change={practicedToday && analytics?.points_earned_today
                                ? { value: 8, type: 'positive' }
                                : undefined
                            }
                            icon={<MdStars size={24} />}
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
                                    <span className="text-xl font-normal opacity-60">%</span>
                                </span>
                            }
                            subtext={`${analytics?.questions_attempted || 0} questions`}
                            change={(analytics?.accuracy_percentage || 0) >= 70
                                ? { value: 5, type: 'positive' }
                                : (analytics?.accuracy_percentage || 0) < 50
                                    ? { value: 3, type: 'negative' }
                                    : undefined
                            }
                            icon={<MdTrendingUp size={24} />}
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
                                    <span className="text-xl font-normal opacity-60">m</span>
                                </span>
                            }
                            icon={<MdTimer size={24} />}
                            colorScheme="practice"
                            isDark={isDark}
                            delay={3}
                            description="Total dedicated time spent learning on the platform."
                        />
                    </div>

                    {isLoadingAnalytics && !analytics && (
                        <div className={`animate-pulse h-4 w-48 rounded ${isDark ? 'bg-bg-tertiary-dark' : 'bg-bg-tertiary-light'
                            }`} />
                    )}
                </>
            )}
        </motion.div>
    );
}
