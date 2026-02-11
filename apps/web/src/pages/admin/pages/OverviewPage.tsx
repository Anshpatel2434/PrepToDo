import { useEffect, useState } from 'react';
import { adminApiClient } from '../services/adminApiClient';
import { motion } from 'framer-motion';
import {
    Users,
    Activity,
    DollarSign,
    CreditCard
} from 'lucide-react';
import { RevenueCostChart } from '../components/charts/RevenueCostChart';
import { UserGrowthChart } from '../components/charts/UserGrowthChart';
import { DataTable, type Column } from '../components/DataTable';

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

    // Mock trend data until API provides it
    const mockTrendData = [
        { date: 'Jan', revenue: 120000, cost: 45000, totalUsers: 150, activeUsers: 80 },
        { date: 'Feb', revenue: 135000, cost: 48000, totalUsers: 220, activeUsers: 120 },
        { date: 'Mar', revenue: 128000, cost: 52000, totalUsers: 310, activeUsers: 180 },
        { date: 'Apr', revenue: 145000, cost: 49000, totalUsers: 400, activeUsers: 250 },
        { date: 'May', revenue: 162000, cost: 55000, totalUsers: 550, activeUsers: 320 },
        { date: 'Jun', revenue: 185000, cost: 58000, totalUsers: 720, activeUsers: 450 },
    ];

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

    const activityColumns: Column<ActivityLog>[] = [
        {
            header: 'User',
            accessorKey: 'user',
            cell: (log) => <span className="font-medium text-white">{log.user}</span>
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

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                    <h2 className="mb-4 text-lg font-semibold text-white">Revenue vs Cost (6 Months)</h2>
                    <RevenueCostChart data={mockTrendData} />
                </div>
                <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                    <h2 className="mb-4 text-lg font-semibold text-white">User Growth</h2>
                    <UserGrowthChart data={mockTrendData} />
                </div>
            </div>

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
