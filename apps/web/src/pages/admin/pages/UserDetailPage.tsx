import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApiClient } from '../services/adminApiClient';
import { ArrowLeft, Calendar, Activity, Clock, DollarSign, Target, Zap, Trophy, Flame, Save, Pencil } from 'lucide-react';
import { ActivityHeatmap } from '../components/charts/ActivityHeatmap';
import { SessionTimeline } from '../components/charts/SessionTimeline';

interface UserDetail {
    id: string;
    email: string;
    role: string;
    created_at: string;
    last_sign_in_at: string | null;
    ai_insights_remaining: number;
    customized_mocks_remaining: number;
    profile?: {
        display_name: string | null;
        username: string | null;
        subscription_tier: string | null;
    };
    practiceSessions: {
        id: string;
        correct_answers: number;
        total_questions: number;
        score_percentage: string | null;
        session_type: string;
        status: string;
        created_at: string;
        time_spent_seconds: number;
    }[];
}

interface AiCostData {
    totalCostUsd: number;
    callCount: number;
}

interface QuestionStats {
    totalAttempted: number;
    totalCorrect: number;
    totalTimeSpent: number;
    accuracy: number;
}

interface UserAnalyticsData {
    minutesPracticed: number;
    questionsAttempted: number;
    questionsCorrect: number;
    accuracyPercentage: number;
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
}

export default function UserDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<UserDetail | null>(null);
    const [aiCost, setAiCost] = useState<AiCostData | null>(null);
    const [questionStats, setQuestionStats] = useState<QuestionStats | null>(null);
    const [analytics, setAnalytics] = useState<UserAnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Admin edit form state
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        role: '',
        email: '',
        ai_insights_remaining: 0,
        customized_mocks_remaining: 0,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await adminApiClient<{
                    user: UserDetail;
                    aiCost: AiCostData;
                    questionStats: QuestionStats;
                    analytics: UserAnalyticsData | null;
                }>(`/users/${id}`);
                setUser(response.user);
                setAiCost(response.aiCost);
                setQuestionStats(response.questionStats);
                setAnalytics(response.analytics);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchUser();
    }, [id]);

    // Sync edit form when user data loads
    useEffect(() => {
        if (user) {
            setEditForm({
                role: user.role,
                email: user.email,
                ai_insights_remaining: user.ai_insights_remaining ?? 0,
                customized_mocks_remaining: user.customized_mocks_remaining ?? 0,
            });
        }
    }, [user]);

    const handleSaveUser = async () => {
        if (!id) return;
        setIsSaving(true);
        setSaveMessage(null);
        try {
            await adminApiClient(`/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(editForm),
            });
            // Update local state to reflect changes
            setUser(prev => prev ? { ...prev, ...editForm } : prev);
            setSaveMessage({ type: 'success', text: 'User updated successfully' });
            setIsEditing(false);
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (err: any) {
            setSaveMessage({ type: 'error', text: err.message || 'Failed to update user' });
        } finally {
            setIsSaving(false);
        }
    };

    const heatmapData = useMemo(() => {
        if (!user) return [];
        const counts: Record<string, number> = {};
        user.practiceSessions.forEach(s => {
            const date = new Date(s.created_at).toISOString().split('T')[0];
            counts[date] = (counts[date] || 0) + 1;
        });
        return Object.entries(counts).map(([date, count]) => ({ date, count }));
    }, [user]);

    if (isLoading) return <div className="p-8 text-[#94a3b8]">Loading user details...</div>;
    if (error) return <div className="p-8 text-red-400">Error: {error}</div>;
    if (!user) return <div className="p-8 text-[#94a3b8]">User not found</div>;

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        const hours = Math.floor(seconds / 3600);
        const mins = Math.round((seconds % 3600) / 60);
        return `${hours}h ${mins}m`;
    };

    const statCards = [
        {
            title: 'Total Sessions',
            value: user.practiceSessions.length.toString(),
            icon: Activity,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
        },
        {
            title: 'Questions Attempted',
            value: (questionStats?.totalAttempted || 0).toLocaleString(),
            subtitle: `${questionStats?.totalCorrect || 0} correct`,
            icon: Target,
            color: 'text-green-400',
            bg: 'bg-green-400/10',
        },
        {
            title: 'Accuracy',
            value: `${questionStats?.accuracy || 0}%`,
            icon: Zap,
            color: 'text-yellow-400',
            bg: 'bg-yellow-400/10',
        },
        {
            title: 'Time Practiced',
            value: formatTime(questionStats?.totalTimeSpent || 0),
            icon: Clock,
            color: 'text-cyan-400',
            bg: 'bg-cyan-400/10',
        },
        {
            title: 'AI Cost (User)',
            value: `$${(aiCost?.totalCostUsd || 0).toFixed(4)}`,
            subtitle: `${aiCost?.callCount || 0} API calls`,
            icon: DollarSign,
            color: 'text-orange-400',
            bg: 'bg-orange-400/10',
        },
        {
            title: 'Total Points',
            value: (analytics?.totalPoints || 0).toLocaleString(),
            icon: Trophy,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
        },
    ];

    return (
        <div className="space-y-8">
            <button
                onClick={() => navigate('/admin/users')}
                className="flex items-center text-sm text-[#94a3b8] hover:text-white transition-colors"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
            </button>

            {/* Header Card */}
            <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 rounded-full bg-[#6366f1] flex items-center justify-center text-2xl font-bold text-white">
                            {user.email[0].toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">
                                {user.profile?.display_name || user.email}
                            </h1>
                            <p className="text-sm text-[#94a3b8]">{user.email}</p>
                            <div className="flex items-center mt-1 space-x-2">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.role === 'admin'
                                    ? 'bg-purple-400/10 text-purple-400'
                                    : 'bg-blue-400/10 text-blue-400'
                                    }`}>
                                    {user.role}
                                </span>
                                {user.profile?.subscription_tier && (
                                    <span className="inline-flex items-center rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                                        {user.profile.subscription_tier}
                                    </span>
                                )}
                                {user.profile?.username && (
                                    <span className="text-xs text-[#64748b]">@{user.profile.username}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 max-w-md">
                        <p className="text-xs font-medium text-[#94a3b8] mb-2 uppercase tracking-wider">Activity (Last 90 Days)</p>
                        <ActivityHeatmap data={heatmapData} />
                    </div>

                    <div className="text-right text-sm text-[#94a3b8]">
                        <div className="flex items-center justify-end mb-1">
                            <Calendar className="mr-2 h-4 w-4" />
                            Joined {new Date(user.created_at).toLocaleDateString()}
                        </div>
                        {user.last_sign_in_at && (
                            <div className="flex items-center justify-end">
                                <Clock className="mr-2 h-4 w-4" />
                                Last seen {new Date(user.last_sign_in_at).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Admin Actions Card */}
            <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Admin Actions</h2>
                    <div className="flex items-center gap-2">
                        {saveMessage && (
                            <span className={`text-sm ${saveMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {saveMessage.text}
                            </span>
                        )}
                        {isEditing ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        if (user) setEditForm({
                                            role: user.role,
                                            email: user.email,
                                            ai_insights_remaining: user.ai_insights_remaining ?? 0,
                                            customized_mocks_remaining: user.customized_mocks_remaining ?? 0,
                                        });
                                    }}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-[#2a2d3a] text-[#94a3b8] hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveUser}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-[#6366f1] text-white hover:bg-[#5558e8] transition-colors disabled:opacity-50"
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[#2a2d3a] text-[#94a3b8] hover:text-white hover:border-[#6366f1] transition-colors"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Email */}
                    <div>
                        <label className="block text-xs font-medium text-[#94a3b8] mb-1.5 uppercase tracking-wider">Email</label>
                        {isEditing ? (
                            <input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                                className="w-full rounded-lg border border-[#2a2d3a] bg-[#0f1117] px-3 py-2 text-sm text-white focus:border-[#6366f1] focus:outline-none"
                            />
                        ) : (
                            <p className="text-sm text-white truncate" title={user.email}>{user.email}</p>
                        )}
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-xs font-medium text-[#94a3b8] mb-1.5 uppercase tracking-wider">Role</label>
                        {isEditing ? (
                            <select
                                value={editForm.role}
                                onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value }))}
                                className="w-full rounded-lg border border-[#2a2d3a] bg-[#0f1117] px-3 py-2 text-sm text-white focus:border-[#6366f1] focus:outline-none"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        ) : (
                            <p className="text-sm text-white capitalize">{user.role}</p>
                        )}
                    </div>

                    {/* AI Insights Remaining */}
                    <div>
                        <label className="block text-xs font-medium text-[#94a3b8] mb-1.5 uppercase tracking-wider">AI Insights Remaining</label>
                        {isEditing ? (
                            <input
                                type="number"
                                min={0}
                                value={editForm.ai_insights_remaining}
                                onChange={(e) => setEditForm(f => ({ ...f, ai_insights_remaining: parseInt(e.target.value) || 0 }))}
                                className="w-full rounded-lg border border-[#2a2d3a] bg-[#0f1117] px-3 py-2 text-sm text-white focus:border-[#6366f1] focus:outline-none"
                            />
                        ) : (
                            <p className="text-sm text-white">{user.ai_insights_remaining ?? 'N/A'}</p>
                        )}
                    </div>

                    {/* Customized Mocks Remaining */}
                    <div>
                        <label className="block text-xs font-medium text-[#94a3b8] mb-1.5 uppercase tracking-wider">Customized Mocks Remaining</label>
                        {isEditing ? (
                            <input
                                type="number"
                                min={0}
                                value={editForm.customized_mocks_remaining}
                                onChange={(e) => setEditForm(f => ({ ...f, customized_mocks_remaining: parseInt(e.target.value) || 0 }))}
                                className="w-full rounded-lg border border-[#2a2d3a] bg-[#0f1117] px-3 py-2 text-sm text-white focus:border-[#6366f1] focus:outline-none"
                            />
                        ) : (
                            <p className="text-sm text-white">{user.customized_mocks_remaining ?? 'N/A'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {statCards.map((card) => (
                    <div key={card.title} className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className={`rounded-lg p-2 ${card.bg}`}>
                                <card.icon className={`h-4 w-4 ${card.color}`} />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-white">{card.value}</p>
                        <p className="text-xs text-[#94a3b8] mt-0.5">{card.title}</p>
                        {card.subtitle && (
                            <p className="text-[10px] text-[#64748b] mt-0.5">{card.subtitle}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Streaks Row (if analytics available) */}
            {analytics && (analytics.currentStreak > 0 || analytics.longestStreak > 0) && (
                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                        <div className="flex items-center text-[#94a3b8] mb-2">
                            <Flame className="h-4 w-4 mr-2 text-orange-400" />
                            Current Streak
                        </div>
                        <div className="text-3xl font-bold text-white">{analytics.currentStreak} <span className="text-sm font-normal text-[#64748b]">days</span></div>
                    </div>
                    <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                        <div className="flex items-center text-[#94a3b8] mb-2">
                            <Trophy className="h-4 w-4 mr-2 text-purple-400" />
                            Longest Streak
                        </div>
                        <div className="text-3xl font-bold text-white">{analytics.longestStreak} <span className="text-sm font-normal text-[#64748b]">days</span></div>
                    </div>
                </div>
            )}

            {/* Timeline & History */}
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                        <h2 className="mb-6 text-lg font-semibold text-white">Session Timeline</h2>
                        <SessionTimeline sessions={user.practiceSessions.slice(0, 5)} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                        <h2 className="mb-4 text-lg font-semibold text-white">Recent Sessions</h2>
                        <div className="space-y-4">
                            {user.practiceSessions.length === 0 ? (
                                <p className="text-center py-4 text-[#64748b]">No sessions yet</p>
                            ) : user.practiceSessions.slice(0, 10).map((session) => (
                                <div key={session.id} className="flex items-center justify-between text-sm border-b border-[#2a2d3a] pb-3 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium text-[#e2e8f0]">{new Date(session.created_at).toLocaleDateString()}</p>
                                        <p className="text-xs text-[#94a3b8]">{Math.round(session.time_spent_seconds / 60)} mins</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-white">{session.correct_answers}/{session.total_questions}</p>
                                        <p className="text-[10px] text-green-400">{session.score_percentage ? `${Math.round(Number(session.score_percentage))}%` : `${Math.round((session.correct_answers / (session.total_questions || 1)) * 100)}%`}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
