import { useEffect, useState } from 'react';
import { adminApiClient } from '../services/adminApiClient';
import { DollarSign, TrendingDown, RefreshCw } from 'lucide-react';
import { CostBreakdownChart } from '../components/charts/CostBreakdownChart';

interface FinancialSummary {
    revenue: {
        total: number;
        thisMonth: number;
        growth: number;
    };
    costs: {
        totalAi: number;
        thisMonthAi: number;
        breakdown: {
            dailyContent: number;
            mocks: number;
            analytics: number;
            teaching: number;
        };
    };
    margins: {
        gross: number;
    };
}

export default function FinancialsPage() {
    const [data, setData] = useState<FinancialSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await adminApiClient<FinancialSummary>('/financials/summary');
                setData(response);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch financials');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) return <div className="p-8 text-[#94a3b8]">Loading financials...</div>;
    if (error) return <div className="p-8 text-red-400">Error loading financials: {error}</div>;
    if (!data) return <div className="p-8 text-[#94a3b8]">No financial data available.</div>;

    const breakdownData = [
        { name: 'Daily Content', value: data.costs.breakdown.dailyContent },
        { name: 'Mocks', value: data.costs.breakdown.mocks },
        { name: 'Analytics', value: data.costs.breakdown.analytics },
        { name: 'Teaching', value: data.costs.breakdown.teaching },
    ].filter(d => d.value > 0);

    const cards = [
        {
            title: 'Total AI Costs',
            value: `$${(data.costs.totalAi / 100).toFixed(2)}`,
            subtitle: 'Lifetime spending on AI APIs',
            icon: DollarSign,
            color: 'text-red-400',
            bg: 'bg-red-400/10',
        },
        {
            title: 'AI Costs (This Month)',
            value: `$${(data.costs.thisMonthAi / 100).toFixed(2)}`,
            subtitle: 'Current month spending',
            icon: RefreshCw,
            color: 'text-orange-400',
            bg: 'bg-orange-400/10',
        },
        {
            title: 'Revenue',
            value: data.revenue.total > 0 ? `$${(data.revenue.total / 100).toFixed(2)}` : 'N/A',
            subtitle: data.revenue.total > 0 ? 'Total earnings' : 'No payment integration yet',
            icon: TrendingDown,
            color: 'text-green-400',
            bg: 'bg-green-400/10',
        },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-white">Financials</h1>

            {/* KPI Cards */}
            <div className="grid gap-6 sm:grid-cols-3">
                {cards.map((card) => (
                    <div key={card.title} className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#94a3b8]">{card.title}</p>
                                <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
                                <p className="mt-1 text-xs text-[#64748b]">{card.subtitle}</p>
                            </div>
                            <div className={`rounded-lg p-3 ${card.bg}`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Cost Breakdown */}
            <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                <h2 className="mb-6 text-lg font-semibold text-white">AI Cost Breakdown by Worker</h2>
                {breakdownData.length > 0 ? (
                    <div className="flex h-[300px] items-center justify-center">
                        <CostBreakdownChart data={breakdownData} />
                    </div>
                ) : (
                    <div className="flex h-[200px] items-center justify-center text-[#64748b] text-sm">
                        No AI cost data recorded yet.
                    </div>
                )}
            </div>
        </div>
    );
}
