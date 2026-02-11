import { useEffect, useState } from 'react';
import { adminApiClient } from '../services/adminApiClient';
import { FileText, HelpCircle, BookOpen, Layers } from 'lucide-react';
import { DataTable, type Column } from '../components/DataTable';

interface ContentStats {
    passages: { total: number; today: number };
    questions: { total: number; today: number };
    exams: { total: number; today: number };
}

export default function ContentPage() {
    const [stats, setStats] = useState<ContentStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    if (isLoading) return <div className="p-8 text-[#94a3b8]">Loading content stats...</div>;

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await adminApiClient<ContentStats>('/content/stats');
                setStats(response);
            } catch (error) {
                console.error('Failed to fetch content stats', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        {
            title: 'Passages',
            total: stats?.passages.total || 0,
            today: stats?.passages.today || 0,
            icon: BookOpen,
            color: 'text-blue-400',
        },
        {
            title: 'Questions',
            total: stats?.questions.total || 0,
            today: stats?.questions.today || 0,
            icon: HelpCircle,
            color: 'text-green-400',
        },
        {
            title: 'Exams Generated',
            total: stats?.exams.total || 0,
            today: stats?.exams.today || 0,
            icon: Layers,
            color: 'text-purple-400',
        },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-white">Content Management</h1>

            {/* Stats Row */}
            <div className="grid gap-6 sm:grid-cols-3">
                {statCards.map((card) => (
                    <div key={card.title} className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#94a3b8]">{card.title}</p>
                                <p className="mt-2 text-2xl font-bold text-white">{card.total.toLocaleString()}</p>
                                <p className="text-xs text-[#64748b]">+{card.today} today</p>
                            </div>
                            <div className="rounded-lg bg-[#2a2d3a] p-3">
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Placeholder for Content Lists (Phase 7 or later expansion) */}
            <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-[#2a2d3a]" />
                <h3 className="mt-4 text-lg font-medium text-white">Content Browsers</h3>
                <p className="mt-2 text-[#94a3b8]">Detailed content browsers for Passages, Questions, and Exams will be implemented here.</p>
            </div>
        </div>
    );
}
