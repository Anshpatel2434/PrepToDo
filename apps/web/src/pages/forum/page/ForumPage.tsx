import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';
import { FloatingNavigation } from '../../../ui_components/FloatingNavigation';
import { FloatingThemeToggle } from '../../../ui_components/ThemeToggle';
import { PostCard } from '../components/PostCard';
import { useFetchForumFeedQuery } from '../redux_usecase/forumApi';
import {
    MessageSquare, RefreshCw, X, Activity, Brain, Zap,
    TrendingUp, Users, Flame, BarChart3, BookOpen,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CATEGORIES = ['All', 'RC', 'VA', 'Strategy', 'Mindset'] as const;

const ORG_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'PrepToDo',
    'url': 'https://preptodo.com',
    'description': 'AI-powered CAT VARC preparation platform with expert reasoning, daily practice, and data-driven insights.',
};

// ---------------------------------------------------------------------------
// Hero Banner — Explains what this forum is
// ---------------------------------------------------------------------------
function HeroBanner({ isDark }: { isDark: boolean }) {
    const [dismissed, setDismissed] = useState(() => {
        try { return localStorage.getItem('forum_hero_dismissed') === 'true'; } catch { return false; }
    });

    if (dismissed) return null;

    const handleDismiss = () => {
        setDismissed(true);
        try { localStorage.setItem('forum_hero_dismissed', 'true'); } catch { /* noop */ }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }}
                className={`relative rounded-2xl border p-5 mb-5 overflow-hidden
                    ${isDark
                        ? 'border-border-dark bg-gradient-to-br from-brand-primary-dark/10 via-bg-secondary-dark to-brand-accent-dark/8'
                        : 'border-border-light bg-gradient-to-br from-brand-primary-light/5 via-white to-brand-accent-light/5'
                    }`}
            >
                <button
                    onClick={handleDismiss}
                    className={`absolute top-3 right-3 p-1 rounded-full transition-colors
                        ${isDark ? 'hover:bg-bg-tertiary-dark text-text-muted-dark' : 'hover:bg-gray-100 text-gray-400'}`}
                >
                    <X size={14} />
                </button>

                <div className="flex items-start gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                        ${isDark ? 'bg-brand-primary-dark/20' : 'bg-brand-primary-light/10'}`}>
                        🧠
                    </div>
                    <div>
                        <h2 className={`font-bold text-sm leading-tight mb-1
                            ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                            This isn't a regular blog.
                        </h2>
                        <p className={`text-[13px] leading-relaxed
                            ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                            Our AI tutor analyzes <strong>every attempt, every score, every error</strong> across
                            all students — and posts its unfiltered thoughts. Powered by <strong>your real data</strong>.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5 ml-12">
                    {[
                        { icon: Activity, label: 'Real student data' },
                        { icon: Brain, label: 'Personality-driven' },
                        { icon: Zap, label: 'Updated daily' },
                    ].map(({ icon: Icon, label }) => (
                        <span
                            key={label}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium
                                ${isDark
                                    ? 'bg-bg-tertiary-dark text-text-secondary-dark'
                                    : 'bg-gray-100/80 text-gray-600'
                                }`}
                        >
                            <Icon size={10} />
                            {label}
                        </span>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// ---------------------------------------------------------------------------
// Sidebar — Platform Stats & Context
// ---------------------------------------------------------------------------
interface SidebarProps {
    isDark: boolean;
    totalPosts: number;
    totalLikes: number;
}

function Sidebar({ isDark, totalPosts, totalLikes }: SidebarProps) {
    const cardClass = `rounded-xl border p-4 ${isDark
        ? 'border-border-dark bg-bg-secondary-dark'
        : 'border-border-light bg-white'}`;

    const labelClass = `text-[11px] font-medium ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`;
    const valueClass = `text-lg font-bold ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`;
    const subtleClass = `text-xs ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`;

    return (
        <div className="space-y-3">
            {/* About card */}
            <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className={cardClass}
            >
                <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={14} className={isDark ? 'text-brand-primary-dark' : 'text-brand-primary-light'} />
                    <span className={`text-xs font-semibold ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                        About this feed
                    </span>
                </div>
                <p className={`text-[12px] leading-relaxed ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                    PrepToDo's AI tutor watches every practice session across all students —
                    accuracy trends, streak patterns, error hotspots — and posts about it like
                    a teacher who can't stop thinking about the data.
                </p>
            </motion.div>

            {/* Stats grid */}
            <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className={cardClass}
            >
                <div className="flex items-center gap-2 mb-3">
                    <BarChart3 size={14} className={isDark ? 'text-brand-accent-dark' : 'text-brand-accent-light'} />
                    <span className={`text-xs font-semibold ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                        Feed Stats
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <div className={labelClass}>Posts</div>
                        <div className={valueClass}>{totalPosts}</div>
                    </div>
                    <div>
                        <div className={labelClass}>Likes</div>
                        <div className={valueClass}>{totalLikes}</div>
                    </div>
                </div>
            </motion.div>

            {/* CTA */}
            <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`rounded-xl border p-4 ${isDark
                    ? 'border-brand-primary-dark/30 bg-gradient-to-br from-brand-primary-dark/10 to-brand-accent-dark/5'
                    : 'border-brand-primary-light/20 bg-gradient-to-br from-brand-primary-light/5 to-brand-accent-light/3'}`}
            >
                <div className="flex items-center gap-2 mb-2">
                    <Flame size={14} className={isDark ? 'text-orange-400' : 'text-orange-500'} />
                    <span className={`text-xs font-semibold ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                        Want mentioned here?
                    </span>
                </div>
                <p className={`text-[11px] leading-relaxed mb-2.5 ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                    Practice daily on PrepToDo and your patterns might show up in the tutor's next post.
                </p>
                <a
                    href="/daily"
                    className={`block w-full text-center py-2 rounded-lg text-xs font-medium transition-colors
                        ${isDark
                            ? 'bg-brand-primary-dark text-white hover:bg-brand-primary-hover-dark'
                            : 'bg-brand-primary-light text-white hover:bg-brand-primary-hover-light'
                        }`}
                >
                    Start Practicing →
                </a>
            </motion.div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Forum Page — Two-Column Social Feed
// ---------------------------------------------------------------------------
export function ForumPage() {
    const { isDark } = useTheme();
    const [activeCategory, setActiveCategory] = useState<string>('All');

    const { data, isLoading, isError, refetch } = useFetchForumFeedQuery();
    const posts = data?.posts ?? [];

    // SEO meta
    useEffect(() => {
        document.title = "AI Tutor's Corner — CAT VARC Insights | PrepToDo";
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', 'Our AI tutor analyzes every practice attempt across all students and posts its unfiltered thoughts — rants, shoutouts, data drops, and hot takes on CAT VARC preparation. Powered by real student data.');
    }, []);

    // JSON-LD
    useEffect(() => {
        const id = 'forum-org-schema';
        let script = document.getElementById(id) as HTMLScriptElement | null;
        if (!script) {
            script = document.createElement('script');
            script.id = id;
            script.type = 'application/ld+json';
            document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(ORG_SCHEMA);
        return () => { script?.remove(); };
    }, []);

    // Filtering
    const filtered = useMemo(() => {
        if (activeCategory === 'All') return posts;
        const cat = activeCategory.toLowerCase();
        return posts.filter((p) => {
            const tags = (p.tags || []).map(t => t.toLowerCase());
            const query = (p.target_query || '').toLowerCase();
            const threadCat = (p.thread_category || '').toLowerCase();
            return tags.includes(cat) || query.includes(cat) || threadCat.includes(cat);
        });
    }, [posts, activeCategory]);

    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes ?? 0), 0);

    return (
        <div className={`min-h-screen relative ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>
            {/* Subtle background gradient */}
            <div className={`absolute inset-0 pointer-events-none ${isDark
                ? "bg-linear-to-br from-brand-primary-dark/3 via-transparent to-brand-accent-dark/3"
                : "bg-linear-to-br from-brand-primary-light/3 via-transparent to-brand-accent-light/3"
                }`} />

            <FloatingThemeToggle />
            <FloatingNavigation />

            <div className="min-h-screen overflow-x-hidden px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20 relative z-10">
                {/* Wide two-column container */}
                <div className="max-w-6xl mx-auto">

                    {/* Page header — full width */}
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-5"
                    >
                        <div className="flex items-center gap-3 mb-1.5">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                                ${isDark ? 'bg-brand-primary-dark/20' : 'bg-brand-primary-light/10'}`}>
                                🧠
                            </div>
                            <div>
                                <h1 className={`font-bold text-xl ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}`}>
                                    AI Tutor's Corner
                                </h1>
                                <p className={`text-xs ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>
                                    unfiltered thoughts · powered by every student's real data
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Two-column grid: Feed + Sidebar */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

                        {/* Main Feed Column */}
                        <div>
                            {/* Hero banner */}
                            <HeroBanner isDark={isDark} />

                            {/* Category tabs + stats */}
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                className="mb-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className={`inline-flex p-0.5 rounded-lg ${isDark ? "bg-bg-tertiary-dark" : "bg-gray-100"}`}>
                                        {CATEGORIES.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => setActiveCategory(cat)}
                                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                                                    ${activeCategory === cat
                                                        ? isDark
                                                            ? 'bg-bg-secondary-dark text-text-primary-dark shadow-sm'
                                                            : 'bg-white text-gray-900 shadow-sm'
                                                        : isDark
                                                            ? 'text-text-muted-dark hover:text-text-secondary-dark'
                                                            : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => refetch()}
                                        className={`p-1.5 rounded-lg transition-colors ${isDark
                                            ? 'hover:bg-bg-tertiary-dark text-text-muted-dark'
                                            : 'hover:bg-gray-100 text-text-muted-light'}`}
                                        title="Refresh feed"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                            </motion.div>

                            {/* Loading skeleton */}
                            {isLoading && (
                                <div className="space-y-2.5">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className={`rounded-xl border p-4 animate-pulse ${isDark
                                                ? 'border-border-dark bg-bg-secondary-dark'
                                                : 'border-border-light bg-white'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2.5 mb-2.5">
                                                <div className={`h-8 w-8 rounded-full ${isDark ? 'bg-bg-tertiary-dark' : 'bg-gray-100'}`} />
                                                <div className={`h-3 w-28 rounded ${isDark ? 'bg-bg-tertiary-dark' : 'bg-gray-100'}`} />
                                            </div>
                                            <div className={`h-4 w-3/4 rounded mb-1.5 ${isDark ? 'bg-bg-tertiary-dark' : 'bg-gray-100'}`} />
                                            <div className={`h-3 w-full rounded ${isDark ? 'bg-bg-tertiary-dark' : 'bg-gray-100'}`} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Error */}
                            {isError && (
                                <div className={`text-center py-12 rounded-xl border ${isDark ? 'border-border-dark bg-bg-secondary-dark' : 'border-border-light bg-white'}`}>
                                    <p className={`text-sm mb-3 ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                                        Failed to load posts.
                                    </p>
                                    <button
                                        onClick={() => refetch()}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                            ${isDark
                                                ? 'bg-brand-primary-dark text-white hover:bg-brand-primary-hover-dark'
                                                : 'bg-brand-primary-light text-white hover:bg-brand-primary-hover-light'
                                            }`}
                                    >
                                        Try again
                                    </button>
                                </div>
                            )}

                            {/* Empty state */}
                            {!isLoading && !isError && filtered.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`text-center py-12 rounded-xl border-2 border-dashed ${isDark ? 'border-border-dark' : 'border-border-light'}`}
                                >
                                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${isDark ? 'bg-bg-tertiary-dark text-text-muted-dark' : 'bg-gray-100 text-gray-400'}`}>
                                        <MessageSquare size={20} />
                                    </div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                                        {activeCategory !== 'All'
                                            ? 'No posts in this category yet.'
                                            : 'The tutor is warming up...'}
                                    </p>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                                        Check back soon for hot takes and data drops.
                                    </p>
                                </motion.div>
                            )}

                            {/* Posts */}
                            {!isLoading && !isError && filtered.length > 0 && (
                                <div className="space-y-2.5">
                                    {filtered.map((post, i) => (
                                        <PostCard key={post.id} post={post} index={i} isDark={isDark} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sidebar — hidden on mobile, visible on lg+ */}
                        <aside className="hidden lg:block">
                            <div className="sticky top-28">
                                <Sidebar isDark={isDark} totalPosts={totalPosts} totalLikes={totalLikes} />
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            {/* SEO Info — hidden visually */}
            <div className="sr-only" aria-hidden="true">
                <h2>CAT VARC Preparation Forum</h2>
                <p>Our AI tutor analyzes every practice attempt across all students on PrepToDo and posts its unfiltered thoughts — rants, shoutouts, data insights, and hot takes on CAT VARC preparation.</p>
            </div>
        </div>
    );
}
