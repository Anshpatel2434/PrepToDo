import { useEffect, useState } from 'react';
import { adminApiClient } from '../services/adminApiClient';
import { Cpu, DollarSign, Zap } from 'lucide-react';
import { CostBreakdownChart } from '../components/charts/CostBreakdownChart';
import { DataTable, type Column } from '../components/DataTable';

interface AiCostSummary {
    totalCost: number;
    totalTokens: number;
    byModel: Record<string, number>;
    byWorker: Record<string, number>;
    byFunction: { name: string; cost: number; calls: number }[];
}

export default function AIUsagePage() {
    const [data, setData] = useState<AiCostSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await adminApiClient<AiCostSummary>('/financials/ai-costs');
                setData(response);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch AI usage data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) return <div className="p-8 text-[#94a3b8]">Loading AI usage...</div>;
    if (error) return <div className="p-8 text-red-400">Error loading AI usage: {error}</div>;
    if (!data) return <div className="p-8 text-[#94a3b8]">No AI usage data available.</div>;

    const modelData = Object.entries(data.byModel).map(([name, value]) => ({ name, value }));
    const workerData = Object.entries(data.byWorker).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

    const functionColumns: Column<{ name: string; cost: number; calls: number }>[] = [
        { header: 'Function', cell: (f) => <span className="font-mono text-white">{f.name}</span> },
        { header: 'Cost', cell: (f) => <span className="text-orange-400 font-mono">${(f.cost / 100).toFixed(4)}</span> },
        { header: 'Calls', cell: (f) => <span className="text-[#94a3b8]">{f.calls.toLocaleString()}</span> },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-white">AI Usage & Costs</h1>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[#94a3b8]">Total Cost (Lifetime)</p>
                            <p className="mt-2 text-2xl font-bold text-white">${(data.totalCost / 100).toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg bg-red-400/10 p-3 text-red-400"><DollarSign className="h-6 w-6" /></div>
                    </div>
                </div>

                <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[#94a3b8]">Total Tokens</p>
                            <p className="mt-2 text-2xl font-bold text-white">{data.totalTokens.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-blue-400/10 p-3 text-blue-400"><Cpu className="h-6 w-6" /></div>
                    </div>
                </div>

                <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[#94a3b8]">Total API Calls</p>
                            <p className="mt-2 text-2xl font-bold text-white">
                                {(data.byFunction?.reduce((sum, f) => sum + f.calls, 0) || 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="rounded-lg bg-purple-400/10 p-3 text-purple-400"><Zap className="h-6 w-6" /></div>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Model Breakdown */}
                <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                    <h2 className="mb-6 text-lg font-semibold text-white">Cost by Model</h2>
                    {modelData.length > 0 ? (
                        <div className="flex h-[300px] items-center justify-center">
                            <CostBreakdownChart data={modelData} />
                        </div>
                    ) : (
                        <div className="flex h-[200px] items-center justify-center text-[#64748b] text-sm">
                            No model cost data recorded yet.
                        </div>
                    )}
                </div>

                {/* Worker Breakdown */}
                <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                    <h2 className="mb-6 text-lg font-semibold text-white">Cost by Worker</h2>
                    {workerData.length > 0 ? (
                        <div className="flex h-[300px] items-center justify-center">
                            <CostBreakdownChart data={workerData} />
                        </div>
                    ) : (
                        <div className="flex h-[200px] items-center justify-center text-[#64748b] text-sm">
                            No worker cost data recorded yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Top Functions Table */}
            {data.byFunction && data.byFunction.length > 0 && (
                <DataTable
                    data={data.byFunction}
                    columns={functionColumns}
                    title="Most Expensive Functions (Top 10)"
                />
            )}
        </div>
    );
}
