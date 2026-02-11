import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApiClient } from '../services/adminApiClient';
import { ArrowLeft, Calendar, Activity, Clock } from 'lucide-react';

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
                <div className="flex items-start justify-between">
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
                {/* Add more stats here later (Accuracy, etc.) */}
            </div>

            {/* Recent Sessions */}
            <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Recent Sessions</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-[#2a2d3a] text-[#94a3b8]">
                            <tr>
                                <th className="px-4 py-3 font-medium">Date</th>
                                <th className="px-4 py-3 font-medium">Score</th>
                                <th className="px-4 py-3 font-medium">Time Taken</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2d3a]">
                            {user.practiceSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-4 text-center text-[#94a3b8]">No sessions yet</td>
                                </tr>
                            ) : user.practiceSessions.map((session) => (
                                <tr key={session.id} className="hover:bg-[#2a2d3a]/50">
                                    <td className="px-4 py-3 text-[#e2e8f0]">
                                        {new Date(session.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-[#e2e8f0]">
                                        {session.score} / {session.total_questions}
                                    </td>
                                    <td className="px-4 py-3 text-[#94a3b8]">
                                        {Math.round(session.time_spent_seconds / 60)} min
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
