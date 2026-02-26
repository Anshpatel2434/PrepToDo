import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import type { ForumPost } from '../redux_usecase/forumApi';
import { useReactToPostMutation } from '../redux_usecase/forumApi';

// Mood → accent color
const MOOD_COLORS: Record<string, { dark: string; light: string }> = {
    buzzing: { dark: 'text-amber-400', light: 'text-amber-600' },
    calm: { dark: 'text-blue-400', light: 'text-blue-600' },
    reflective: { dark: 'text-violet-400', light: 'text-violet-600' },
    explosive: { dark: 'text-red-400', light: 'text-red-600' },
    meditative: { dark: 'text-teal-400', light: 'text-teal-600' },
    caffeinated: { dark: 'text-orange-400', light: 'text-orange-600' },
    sleepy: { dark: 'text-slate-400', light: 'text-slate-500' },
    wired: { dark: 'text-emerald-400', light: 'text-emerald-600' },
};

function getMoodColor(mood: string | null, isDark: boolean): string {
    if (!mood) return isDark ? 'text-text-muted-dark' : 'text-text-muted-light';
    const base = mood.split('-')[0];
    const entry = MOOD_COLORS[base];
    if (!entry) return isDark ? 'text-text-muted-dark' : 'text-text-muted-light';
    return isDark ? entry.dark : entry.light;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

interface PostCardProps {
    post: ForumPost;
    index: number;
    isDark: boolean;
}

export function PostCard({ post, index, isDark }: PostCardProps) {
    const moodBase = post.mood?.split('-')[0] ?? 'thoughtful';
    const moodColor = getMoodColor(post.mood, isDark);

    const [reactToPost] = useReactToPostMutation();
    const [likes, setLikes] = useState(post.likes ?? 0);
    const [dislikes, setDislikes] = useState(post.dislikes ?? 0);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleReaction = useCallback((reaction: 'like' | 'dislike', e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (reaction === 'like') setLikes(prev => prev + 1);
        else setDislikes(prev => prev + 1);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const result = await reactToPost({ postId: post.id, reaction }).unwrap();
                if (result.action === 'removed') {
                    if (reaction === 'like') setLikes(prev => Math.max(prev - 1, 0));
                    else setDislikes(prev => Math.max(prev - 1, 0));
                }
            } catch {
                if (reaction === 'like') setLikes(prev => Math.max(prev - 1, 0));
                else setDislikes(prev => Math.max(prev - 1, 0));
            }
        }, 500);
    }, [post.id, reactToPost]);

    return (
        <motion.article
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        >
            <div className={`rounded-xl border px-4 py-3.5 transition-all duration-200
                ${isDark
                    ? 'border-border-dark bg-bg-secondary-dark hover:bg-bg-tertiary-dark/50'
                    : 'border-border-light bg-white hover:bg-gray-50/50'
                }`}
            >
                {/* Header: avatar + tutor name + mood + time */}
                <div className="flex items-center gap-2.5 mb-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0
                        ${isDark ? 'bg-brand-primary-dark/20' : 'bg-brand-primary-light/10'}`}>
                        🧠
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className={`text-sm font-semibold truncate ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                            PrepToDo Tutor
                        </span>
                        <span className={`text-xs ${moodColor}`}>
                            · {moodBase}
                        </span>
                    </div>
                    <time
                        dateTime={post.created_at}
                        className={`text-xs shrink-0 ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}
                    >
                        {timeAgo(post.created_at)}
                    </time>
                </div>

                {/* Headline */}
                {post.target_query && (
                    <h3 className={`font-semibold text-[15px] leading-snug mb-1.5
                        ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}`}>
                        {post.target_query}
                    </h3>
                )}

                {/* Full content — visible inline (it's short now) */}
                <p className={`text-sm leading-relaxed whitespace-pre-line
                    ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}`}>
                    {post.content}
                </p>

                {/* Tags + actions */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t
                    border-transparent" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                    <div className="flex flex-wrap gap-1.5">
                        {post.tags && post.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-medium
                                    ${isDark
                                        ? 'bg-bg-tertiary-dark text-text-muted-dark'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => handleReaction('like', e)}
                            className={`flex items-center gap-1 text-xs transition-colors
                                ${isDark
                                    ? 'text-text-muted-dark hover:text-brand-accent-dark'
                                    : 'text-text-muted-light hover:text-brand-primary-light'
                                }`}
                        >
                            <ThumbsUp size={13} />
                            {likes > 0 && <span>{likes}</span>}
                        </button>
                        <button
                            onClick={(e) => handleReaction('dislike', e)}
                            className={`flex items-center gap-1 text-xs transition-colors
                                ${isDark
                                    ? 'text-text-muted-dark hover:text-red-400'
                                    : 'text-text-muted-light hover:text-red-500'
                                }`}
                        >
                            <ThumbsDown size={13} />
                            {dislikes > 0 && <span>{dislikes}</span>}
                        </button>
                        <span className={`flex items-center gap-1 text-xs
                            ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}`}>
                            <MessageCircle size={13} />
                            <span className="text-[10px]">soon</span>
                        </span>
                    </div>
                </div>
            </div>
        </motion.article>
    );
}
