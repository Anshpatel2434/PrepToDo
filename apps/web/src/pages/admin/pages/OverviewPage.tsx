import React, { useEffect, useState } from 'react';
import { adminApiClient } from '../services/adminApiClient';
import { motion } from 'framer-motion';
import {
    Users,
    Activity,
    DollarSign,
    TrendingUp,
    CreditCard
} from 'lucide-react';

interface DashboardMetrics {
    totalUsers: number;
    totalSessions: number;
    totalRevenueCents: number;
    dailyActiveUsers: number;
    aiCostTodayCents: number;
}

interface ActivityLog {
    type: string;
    user: string;
    details: string;
    time: string;
}

export default function OverviewPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await adminApiClient<{ metrics: DashboardMetrics; recentActivity: ActivityLog[] }>('/dashboard/overview');
                setMetrics(data.metrics);
                setActivity(data.recentActivity);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) return <div className="p-8 text-[#94a3b8]">Loading dashboard...</div>;
    if (error) return <div className="p-8 text-red-400">Error: {error}</div>;

    const cards = [
        {
            title: 'Total Users',
            value: metrics?.totalUsers.toLocaleString(),
            icon: Users,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10'
        },
        {
            title: 'Total Sessions',
            value: metrics?.totalSessions.toLocaleString(),
            icon: Activity,
            color: 'text-green-400',
            bg: 'bg-green-400/10'
        },
        {
            title: 'AI Cost (Today)',
            value: `$${(metrics?.aiCostTodayCents! / 100).toFixed(2)}`,
            icon: CreditCard,
            color: 'text-orange-400',
            bg: 'bg-orange-400/10'
        },
        {
            title: 'Revenue (Total)',
            value: `$${(metrics?.totalRevenueCents! / 100).toFixed(2)}`,
            icon: DollarSign,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10'
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                <div className="text-sm text-[#94a3b8]">Last updated: {new Date().toLocaleTimeString()}</div>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#94a3b8]">{card.title}</p>
                                <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
                            </div>
                            <div className={`rounded-lg p-3 ${card.bg}`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Recent Activity Table */}
            <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Recent Activity</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-[#2a2d3a] text-[#94a3b8]">
                            <tr>
                                <th className="px-4 py-3 font-medium">User</th>
                                <th className="px-4 py-3 font-medium">Action</th>
                                <th className="px-4 py-3 font-medium">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2d3a]">
                            {activity.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-4 text-center text-[#94a3b8]">No recent activity</td>
                                </tr>
                            ) : activity.map((log, i) => (
                                <tr key={i} className="hover:bg-[#2a2d3a]/50">
                                    <td className="px-4 py-3 font-medium text-white">{log.user}</td>
                                    <td className="px-4 py-3 text-[#cbd5e1]">{log.details}</td>
                                    <td className="px-4 py-3 text-[#94a3b8]">{new Date(log.time).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
