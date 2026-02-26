import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { FloatingNavigation } from '../../../ui_components/FloatingNavigation';
import { FloatingThemeToggle } from '../../../ui_components/ThemeToggle';
import { useFetchForumThreadQuery, useFetchThreadSchemaQuery } from '../redux_usecase/forumApi';
import type { ForumPost } from '../redux_usecase/forumApi';

// ------------------------------------------------------------------
// Lightweight markdown renderer
// ------------------------------------------------------------------
function renderMarkdown(content: string, isDark: boolean): React.ReactNode[] {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    const textPrimary = isDark ? 'text-text-primary-dark' : 'text-text-primary-light';
    const textSecondary = isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light';

    lines.forEach((line, i) => {
        const key = `md-${i}`;
        const trimmed = line.trim();

        if (trimmed.startsWith('### ')) {
            elements.push(<h4 key={key} className={`${textPrimary} font-semibold text-sm mt-5 mb-2`}>{renderInline(trimmed.slice(4), isDark)}</h4>);
        } else if (trimmed.startsWith('## ')) {
            elements.push(<h3 key={key} className={`${textPrimary} font-semibold text-base mt-6 mb-2`}>{renderInline(trimmed.slice(3), isDark)}</h3>);
        } else if (trimmed.startsWith('# ')) {
            elements.push(<h2 key={key} className={`${textPrimary} font-bold text-lg mt-6 mb-3`}>{renderInline(trimmed.slice(2), isDark)}</h2>);
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            elements.push(<li key={key} className={`${textSecondary} text-sm leading-relaxed ml-4 list-disc`}>{renderInline(trimmed.slice(2), isDark)}</li>);
        } else if (/^\d+\.\s/.test(trimmed)) {
            elements.push(<li key={key} className={`${textSecondary} text-sm leading-relaxed ml-4 list-decimal`}>{renderInline(trimmed.replace(/^\d+\.\s/, ''), isDark)}</li>);
        } else if (trimmed === '') {
            elements.push(<div key={key} className="h-2" />);
        } else {
            elements.push(<p key={key} className={`${textSecondary} text-sm leading-relaxed`}>{renderInline(trimmed, isDark)}</p>);
        }
    });

    return elements;
}

function renderInline(text: string, isDark: boolean): React.ReactNode {
    const textPrimary = isDark ? 'text-text-primary-dark' : 'text-text-primary-light';
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className={`font-semibold ${textPrimary}`}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={i} className="italic">{part.slice(1, -1)}</em>;
        }
        return part;
    });
}

// ------------------------------------------------------------------
// Single post detail card
// ------------------------------------------------------------------
function PostDetail({ post, index, isDark }: { post: ForumPost; index: number; isDark: boolean }) {
    const moodLabel = post.mood?.split('-').slice(0, 2).join(' · ') ?? null;

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.35 }}
            className={`rounded-2xl border p-4 sm:p-6 ${isDark
                ? 'border-border-dark bg-bg-secondary-dark'
                : 'border-border-light bg-white'
                }`}
        >
            {/* Post meta */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                {moodLabel && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${isDark ? 'bg-brand-primary-dark/15 text-brand-accent-dark' : 'bg-brand-primary-light/10 text-brand-primary-light'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {moodLabel}
                    </span>
                )}
                <time dateTime={post.created_at} className={`text-xs ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                    {new Date(post.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                    })}
                </time>
            </div>

            {/* Hook block */}
            {post.answer_summary && (
                <div className={`mb-4 p-3 sm:p-4 rounded-xl border ${isDark
                    ? 'bg-brand-primary-dark/8 border-brand-primary-dark/15'
                    : 'bg-brand-primary-light/5 border-brand-primary-light/10'
                    }`}>
                    <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                        {post.answer_summary}
                    </p>
                </div>
            )}

            {/* Full content */}
            <div className="text-measure space-y-0.5">
                {renderMarkdown(post.content, isDark)}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
                <div className={`flex flex-wrap gap-1.5 mt-5 pt-4 border-t ${isDark ? 'border-border-dark' : 'border-border-light'}`}>
                    {post.tags.map((tag) => (
                        <span
                            key={tag}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium border
                                ${isDark
                                    ? 'bg-bg-tertiary-dark text-text-muted-dark border-border-dark'
                                    : 'bg-gray-50 text-gray-500 border-border-light'
                                }`}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </motion.article>
    );
}

// ------------------------------------------------------------------
// Thread Page
// ------------------------------------------------------------------
export default function ForumThreadPage() {
    const { slug } = useParams<{ slug: string }>();
    const { isDark } = useTheme();

    // RTK Query — handles loading, error, caching automatically
    const { data: threadData, isLoading, isError, refetch } = useFetchForumThreadQuery(slug ?? '', { skip: !slug });
    const thread = threadData?.thread ?? null;

    // Schema for JSON-LD
    const { data: schemaData } = useFetchThreadSchemaQuery(slug ?? '', { skip: !slug });

    // SEO meta
    useEffect(() => {
        if (thread) {
            document.title = `${thread.title} | PrepToDo Forum`;
            const meta = document.querySelector('meta[name="description"]');
            if (meta && thread.seo_description) meta.setAttribute('content', thread.seo_description);
        }
    }, [thread]);

    // JSON-LD injection
    useEffect(() => {
        if (!schemaData?.schema) return;
        const id = 'forum-thread-schema';
        let script = document.getElementById(id) as HTMLScriptElement | null;
        if (!script) {
            script = document.createElement('script');
            script.id = id;
            script.type = 'application/ld+json';
            document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(schemaData.schema);
        return () => { script?.remove(); };
    }, [schemaData]);

    return (
        <div className={`min-h-screen relative ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>
            {/* Subtle background gradient */}
            <div className={`absolute inset-0 pointer-events-none ${isDark
                ? "bg-linear-to-br from-brand-primary-dark/5 via-transparent to-brand-accent-dark/5"
                : "bg-linear-to-br from-brand-primary-light/5 via-transparent to-brand-accent-light/5"
                }`} />

            <FloatingThemeToggle />
            <FloatingNavigation />

            <div className="min-h-screen overflow-x-hidden px-4 sm:px-6 md:px-8 pt-24 sm:pt-28 pb-20 sm:pb-24 relative z-10">
                <div className="max-w-4xl mx-auto">
                    {/* Back link */}
                    <Link
                        to="/forum"
                        className={`inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-colors
                            ${isDark
                                ? 'text-text-muted-dark hover:text-brand-accent-dark'
                                : 'text-text-muted-light hover:text-brand-primary-light'
                            }`}
                    >
                        <ArrowLeft size={14} />
                        <span>Back to forum</span>
                    </Link>

                    {/* Loading skeleton */}
                    {isLoading && (
                        <div className="space-y-4 animate-pulse">
                            <div className={`h-7 w-2/3 rounded ${isDark ? 'bg-bg-tertiary-dark' : 'bg-gray-100'}`} />
                            <div className={`h-4 w-1/3 rounded ${isDark ? 'bg-bg-tertiary-dark' : 'bg-gray-100'}`} />
                            <div className={`rounded-2xl border p-6 space-y-3 ${isDark ? 'border-border-dark bg-bg-secondary-dark' : 'border-border-light bg-white'}`}>
                                <div className={`h-4 w-full rounded ${isDark ? 'bg-bg-tertiary-dark' : 'bg-gray-100'}`} />
                                <div className={`h-4 w-5/6 rounded ${isDark ? 'bg-bg-tertiary-dark' : 'bg-gray-100'}`} />
                                <div className={`h-4 w-3/4 rounded ${isDark ? 'bg-bg-tertiary-dark' : 'bg-gray-100'}`} />
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {isError && (
                        <div className="text-center py-16">
                            <p className={`text-sm mb-4 ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                                Thread not found or failed to load.
                            </p>
                            <button
                                onClick={() => refetch()}
                                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors
                                    ${isDark
                                        ? 'bg-brand-primary-dark text-white hover:bg-brand-primary-hover-dark'
                                        : 'bg-brand-primary-light text-white hover:bg-brand-primary-hover-light'
                                    }`}
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Thread content */}
                    {!isLoading && !isError && thread && (
                        <>
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6"
                            >
                                <h1 className={`font-serif font-bold text-2xl sm:text-3xl leading-snug mb-3 ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                                    {thread.title}
                                </h1>
                                {thread.category && (
                                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border
                                        ${isDark
                                            ? 'bg-bg-tertiary-dark text-text-muted-dark border-border-dark'
                                            : 'bg-gray-50 text-gray-500 border-border-light'
                                        }`}>
                                        {thread.category}
                                    </span>
                                )}
                            </motion.div>

                            <div className="space-y-4">
                                {thread.posts.map((post, i) => (
                                    <PostDetail key={post.id} post={post} index={i} isDark={isDark} />
                                ))}
                            </div>

                            {thread.posts.length === 0 && (
                                <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${isDark ? 'border-border-dark' : 'border-border-light'}`}>
                                    <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isDark ? 'bg-bg-tertiary-dark text-text-muted-dark' : 'bg-gray-100 text-gray-400'}`}>
                                        <MessageSquare size={24} />
                                    </div>
                                    <p className={`text-sm ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                                        No posts in this thread yet.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
