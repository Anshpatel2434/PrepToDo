import { useEffect, useState } from 'react';
import { adminApiClient } from '../services/adminApiClient';
import { DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { RevenueCostChart } from '../components/charts/RevenueCostChart';
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

    // Mock trend data with predictions
    const mockTrendData = [
        { date: 'Jan', revenue: 120000, cost: 45000 },
        { date: 'Feb', revenue: 135000, cost: 48000 },
        { date: 'Mar', revenue: 128000, cost: 52000 },
        { date: 'Apr', revenue: 145000, cost: 49000 },
        { date: 'May', revenue: 162000, cost: 55000 },
        { date: 'Jun', revenue: 185000, cost: 58000 },
        { date: 'Jul', revenue: 210000, cost: 62000, prediction: true },
        { date: 'Aug', revenue: 235000, cost: 65000, prediction: true },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await adminApiClient<FinancialSummary>('/financials/summary');
                setData(response);
            } catch (error) {
                console.error('Failed to fetch financials', error);
                // Fallback mock data
                setData({
                    revenue: { total: 1250000, thisMonth: 150000, growth: 12.5 },
                    costs: { totalAi: 45000, thisMonthAi: 12000, breakdown: { dailyContent: 5000, mocks: 4000, analytics: 2000, teaching: 1000 } },
                    margins: { gross: 85 }
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) return <div className="p-8 text-[#94a3b8]">Loading financials...</div>;

    const breakdownData = data ? [
        { name: 'Daily Content', value: data.costs.breakdown.dailyContent },
        { name: 'Mocks', value: data.costs.breakdown.mocks },
        { name: 'Analytics', value: data.costs.breakdown.analytics },
        { name: 'Teaching', value: data.costs.breakdown.teaching },
    ] : [];

    const cards = [
        {
            title: 'Monthly Revenue',
            value: `$${((data?.revenue.thisMonth || 0) / 100).toLocaleString()}`,
            change: data?.revenue.growth || 0,
            icon: DollarSign,
            color: 'text-green-400',
        },
        {
            title: 'AI Costs (Month)',
            value: `$${((data?.costs.thisMonthAi || 0) / 100).toLocaleString()}`,
            change: -5.2, // Mock trend
            icon: RefreshCw,
            color: 'text-orange-400',
        },
        {
            title: 'Gross Margin',
            value: `${data?.margins.gross}%`,
            change: 2.1,
            icon: TrendingUp,
            color: 'text-blue-400',
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
                                <div className="mt-2 flex items-baseline">
                                    <span className="text-2xl font-bold text-white">{card.value}</span>
                                    <span className={`ml-2 text-sm font-medium ${card.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {card.change >= 0 ? '+' : ''}{card.change}%
                                    </span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-[#2a2d3a] p-3">
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                    <h2 className="mb-6 text-lg font-semibold text-white">Revenue vs Costs (YTD)</h2>
                    <RevenueCostChart data={mockTrendData} />
                </div>

                <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                    <h2 className="mb-6 text-lg font-semibold text-white">AI Cost Breakdown</h2>
                    <div className="flex h-[300px] items-center justify-center">
                        <CostBreakdownChart data={breakdownData} />
                    </div>
                </div>
            </div>
        </div>
    );
}
