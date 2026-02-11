import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApiClient } from '../services/adminApiClient';
import { ArrowLeft, Calendar, Activity, Clock } from 'lucide-react';
import { ActivityHeatmap } from '../components/charts/ActivityHeatmap';
import { SessionTimeline } from '../components/charts/SessionTimeline';

interface UserDetail {
    id: string;
    email: string;
    role: string;
    created_at: string;
    last_sign_in_at: string | null;
    practiceSessions: {
        id: string;
        score: number;
        total_questions: number;
        created_at: string;
        time_spent_seconds: number;
    }[];
}

export default function UserDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<UserDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await adminApiClient<{ user: UserDetail }>(`/users/${id}`);
                setUser(response.user);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchUser();
    }, [id]);

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
                            <h1 className="text-xl font-bold text-white">{user.email}</h1>
                            <div className="flex items-center mt-1 space-x-2">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.role === 'admin'
                                    ? 'bg-purple-400/10 text-purple-400'
                                    : 'bg-blue-400/10 text-blue-400'
                                    }`}>
                                    {user.role}
                                </span>
                                <span className="text-xs text-[#64748b]">ID: {user.id}</span>
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

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-3">
                <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                    <div className="flex items-center text-[#94a3b8] mb-2">
                        <Activity className="h-4 w-4 mr-2" />
                        Total Sessions
                    </div>
                    <div className="text-2xl font-bold text-white">{user.practiceSessions.length}</div>
                </div>
            </div>

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
                                        <p className="font-bold text-white">{session.score}/{session.total_questions}</p>
                                        <p className="text-[10px] text-green-400">{Math.round((session.score / (session.total_questions || 1)) * 100)}%</p>
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
