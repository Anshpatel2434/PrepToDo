import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';
import { FloatingNavigation } from '../../../ui_components/FloatingNavigation';
import { FloatingThemeToggle } from '../../../ui_components/ThemeToggle';
import { PostCard } from '../components/PostCard';
import { useFetchForumFeedQuery } from '../redux_usecase/forumApi';
import { MessageSquare, RefreshCw } from 'lucide-react';

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
// Forum Page — Social Feed
// ---------------------------------------------------------------------------
export function ForumPage() {
    const { isDark } = useTheme();
    const [activeCategory, setActiveCategory] = useState<string>('All');

    const { data, isLoading, isError, refetch } = useFetchForumFeedQuery();
    const posts = data?.posts ?? [];

    // SEO meta
    useEffect(() => {
        document.title = "Tutor's Corner — CAT VARC | PrepToDo";
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', 'Your AI tutor\'s daily rants, shoutouts, and hot takes on CAT VARC preparation. Powered by real student data.');
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

            <div className="min-h-screen overflow-x-hidden px-4 sm:px-6 pt-24 sm:pt-28 pb-20 relative z-10">
                {/* Centered container — max-width for social feed feel */}
                <div className="max-w-2xl mx-auto">

                    {/* Header — compact */}
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
                                    Tutor's Corner
                                </h1>
                                <p className={`text-xs ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}`}>
                                    daily rants · shoutouts · hot takes · powered by your data
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats bar + Category tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="mb-4"
                    >
                        {/* Stats inline */}
                        <div className="flex items-center justify-between mb-3">
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
                            <div className="flex items-center gap-3">
                                <span className={`text-[11px] ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                                    {totalPosts} posts · {totalLikes} ❤️
                                </span>
                                <button
                                    onClick={() => refetch()}
                                    className={`p-1.5 rounded-lg transition-colors ${isDark
                                        ? 'hover:bg-bg-tertiary-dark text-text-muted-dark'
                                        : 'hover:bg-gray-100 text-text-muted-light'}`}
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>
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
                        <div className="text-center py-12">
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

                    {/* Posts — tight spacing for social feed */}
                    {!isLoading && !isError && filtered.length > 0 && (
                        <div className="space-y-2.5">
                            {filtered.map((post, i) => (
                                <PostCard key={post.id} post={post} index={i} isDark={isDark} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* SEO Info — hidden visually */}
            <div className="sr-only" aria-hidden="true">
                <h2>CAT VARC Preparation Forum</h2>
                <p>Expert insights on RC strategies, para jumble tips, vocabulary analysis, and CAT exam preparation from PrepToDo's AI Tutor.</p>
            </div>
        </div>
    );
}
