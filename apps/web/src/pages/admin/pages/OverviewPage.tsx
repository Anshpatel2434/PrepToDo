import { useEffect, useState } from 'react';
import { adminApiClient } from '../services/adminApiClient';
import { motion } from 'framer-motion';
import {
    Users,
    Activity,
    CreditCard,
    UserPlus,
    TrendingUp,
} from 'lucide-react';
import { RevenueCostChart } from '../components/charts/RevenueCostChart';
import { UserGrowthChart } from '../components/charts/UserGrowthChart';
import { DataTable, type Column } from '../components/DataTable';

interface DashboardMetrics {
    totalUsers: number;
    newUsersToday: number;
    dailyActiveUsers: number;
    newLoginsToday: number;
    totalSessions: number;
    totalRevenueUsd: number;
    aiCostTodayUsd: number;
    aiCostTotalUsd: number;
    avgCostPerUserUsd: number;
    usersWithAiCost: number;
}

interface SpendingUser {
    userId: string | null;
    email: string;
    totalCostUsd: number;
    callCount: number;
}

interface ActivityLog {
    type: string;
    userId: string;
    details: string;
    time: string;
}

interface MetricsHistory {
    date: string;
    total_users: number;
    new_users_today: number;
    active_users_today: number;
    total_sessions: number;
    sessions_today: number;
    ai_cost_cumulative_usd: number;
    ai_cost_today_usd: number;
}

export default function OverviewPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [topSpenders, setTopSpenders] = useState<SpendingUser[]>([]);
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [chartData, setChartData] = useState<MetricsHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [overview, metricsHistory] = await Promise.all([
                    adminApiClient<{
                        metrics: DashboardMetrics;
                        topSpendingUsers: SpendingUser[];
                        recentActivity: ActivityLog[];
                    }>('/dashboard/overview'),
                    adminApiClient<{ history: MetricsHistory[] }>('/dashboard/metrics-history'),
                ]);

                setMetrics(overview.metrics);
                setTopSpenders(overview.topSpendingUsers || []);
                setActivity(overview.recentActivity || []);
                setChartData(metricsHistory.history || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const activityColumns: Column<ActivityLog>[] = [
        {
            header: 'User',
            accessorKey: 'userId',
            cell: (log) => <span className="font-medium text-white">{log.userId?.substring(0, 8) || 'System'}...</span>
        },
        {
            header: 'Action',
            accessorKey: 'details',
            cell: (log) => <span className="text-[#cbd5e1]">{log.details}</span>
        },
        {
            header: 'Time',
            accessorKey: 'time',
            cell: (log) => <span className="text-[#94a3b8]">{new Date(log.time).toLocaleString()}</span>
        }
    ];

    const spenderColumns: Column<SpendingUser>[] = [
        {
            header: 'User',
            cell: (u) => <span className="font-medium text-white">{u.email}</span>
        },
        {
            header: 'Total Cost',
            cell: (u) => <span className="text-orange-400 font-mono">${u.totalCostUsd.toFixed(4)}</span>
        },
        {
            header: 'API Calls',
            cell: (u) => <span className="text-[#94a3b8]">{u.callCount.toLocaleString()}</span>
        },
    ];

    if (isLoading) return <div className="p-8 text-[#94a3b8]">Loading dashboard...</div>;
    if (error) return <div className="p-8 text-red-400">Error: {error}</div>;

    // Transform chart data for the chart components
    const revenueCostChartData = chartData.map(d => ({
        date: d.date,
        revenue: 0, // No revenue yet
        cost: Number(d.ai_cost_today_usd || 0),
    }));

    const userGrowthChartData = chartData.map(d => ({
        date: d.date,
        totalUsers: d.total_users,
        activeUsers: d.active_users_today,
    }));

    const cards = [
        {
            title: 'Total Users',
            value: metrics?.totalUsers.toLocaleString(),
            subtitle: `+${metrics?.newUsersToday || 0} today`,
            icon: Users,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10'
        },
        {
            title: 'Active Users (7d)',
            value: metrics?.dailyActiveUsers.toLocaleString(),
            subtitle: `${metrics?.newLoginsToday || 0} logins today`,
            icon: UserPlus,
            color: 'text-green-400',
            bg: 'bg-green-400/10'
        },
        {
            title: 'Total Sessions',
            value: metrics?.totalSessions.toLocaleString(),
            subtitle: '',
            icon: Activity,
            color: 'text-cyan-400',
            bg: 'bg-cyan-400/10'
        },
        {
            title: 'AI Cost (Today)',
            value: `$${(metrics?.aiCostTodayUsd || 0).toFixed(4)}`,
            subtitle: `$${(metrics?.aiCostTotalUsd || 0).toFixed(4)} total`,
            icon: CreditCard,
            color: 'text-orange-400',
            bg: 'bg-orange-400/10'
        },
        {
            title: 'Avg Cost / User',
            value: `$${(metrics?.avgCostPerUserUsd || 0).toFixed(4)}`,
            subtitle: `${metrics?.usersWithAiCost || 0} users with AI usage`,
            icon: TrendingUp,
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
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
                                {card.subtitle && (
                                    <p className="mt-1 text-xs text-[#64748b]">{card.subtitle}</p>
                                )}
                            </div>
                            <div className={`rounded-lg p-3 ${card.bg}`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                    <h2 className="mb-4 text-lg font-semibold text-white">AI Cost Trend</h2>
                    {revenueCostChartData.length > 0 ? (
                        <RevenueCostChart data={revenueCostChartData} />
                    ) : (
                        <div className="flex h-[200px] items-center justify-center text-[#64748b] text-sm">
                            No trend data available yet. Daily snapshots will populate this chart.
                        </div>
                    )}
                </div>
                <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                    <h2 className="mb-4 text-lg font-semibold text-white">User Growth</h2>
                    {userGrowthChartData.length > 0 ? (
                        <UserGrowthChart data={userGrowthChartData} />
                    ) : (
                        <div className="flex h-[200px] items-center justify-center text-[#64748b] text-sm">
                            No trend data available yet. Daily snapshots will populate this chart.
                        </div>
                    )}
                </div>
            </div>

            {/* Top Spending Users */}
            {topSpenders.length > 0 && (
                <DataTable
                    data={topSpenders}
                    columns={spenderColumns}
                    title="Top 10 Spending Users (by AI cost)"
                />
            )}

            {/* Recent Activity Table */}
            <DataTable
                data={activity}
                columns={activityColumns}
                title="Recent Activity"
                showExport={true}
            />
        </div>
    );
}
