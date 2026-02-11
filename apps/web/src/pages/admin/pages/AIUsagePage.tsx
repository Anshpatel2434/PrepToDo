import { useEffect, useState } from 'react';
import { adminApiClient } from '../services/adminApiClient';
import { Cpu, DollarSign } from 'lucide-react';
import { CostBreakdownChart } from '../components/charts/CostBreakdownChart';

interface AiCostSummary {
    totalCost: number;
    totalTokens: number;
    byModel: Record<string, number>;
    byWorker: Record<string, number>;
}

export default function AIUsagePage() {
    const [data, setData] = useState<AiCostSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await adminApiClient<AiCostSummary>('/financials/ai-costs');
                setData(response);
            } catch (error) {
                // Mock data for dev
                setData({
                    totalCost: 15432,
                    totalTokens: 1540000,
                    byModel: { 'gpt-4o-mini': 8500, 'text-embedding-3-small': 2500, 'gpt-4o': 4432 },
                    byWorker: { 'daily_content': 6000, 'customized_mocks': 8000, 'analytics': 1432 }
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) return <div className="p-8 text-[#94a3b8]">Loading AI usage...</div>;

    const modelData = data ? Object.entries(data.byModel).map(([name, value]) => ({ name, value })) : [];
    const workerData = data ? Object.entries(data.byWorker).map(([name, value]) => ({ name: name.replace('_', ' '), value })) : [];

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-white">AI Usage & Costs</h1>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[#94a3b8]">Total Cost (Lifetime)</p>
                            <p className="mt-2 text-2xl font-bold text-white">${((data?.totalCost || 0) / 100).toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg bg-red-400/10 p-3 text-red-400"><DollarSign className="h-6 w-6" /></div>
                    </div>
                </div>

                <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[#94a3b8]">Total Tokens</p>
                            <p className="mt-2 text-2xl font-bold text-white">{(data?.totalTokens || 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-blue-400/10 p-3 text-blue-400"><Cpu className="h-6 w-6" /></div>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Model Breakdown */}
                <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                    <h2 className="mb-6 text-lg font-semibold text-white">Cost by Model</h2>
                    <div className="flex h-[300px] items-center justify-center">
                        <CostBreakdownChart data={modelData} />
                    </div>
                </div>

                {/* Worker Breakdown */}
                <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                    <h2 className="mb-6 text-lg font-semibold text-white">Cost by Worker</h2>
                    <div className="flex h-[300px] items-center justify-center">
                        <CostBreakdownChart data={workerData} />
                    </div>
                </div>
            </div>
        </div>
    );
}
