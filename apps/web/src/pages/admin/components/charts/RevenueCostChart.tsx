import type { FC } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
    date: string;
    revenue: number;
    cost: number;
    prediction?: boolean;
}

interface RevenueCostChartProps {
    data: DataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const isPrediction = payload[0].payload.prediction;
        return (
            <div className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] p-3 shadow-xl">
                <p className="mb-2 text-sm font-medium text-[#e2e8f0]">
                    {label} {isPrediction && <span className="ml-2 text-[10px] text-indigo-400 uppercase">(Forecast)</span>}
                </p>
                <div className="space-y-1">
                    <p className="text-sm text-[#4ade80]">
                        Revenue: ${(payload[0].value / 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-[#f87171]">
                        Cost: ${(payload[1].value / 100).toFixed(2)}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export const RevenueCostChart: FC<RevenueCostChartProps> = ({ data }) => {
    // To support a "prediction line" that is dashed while historical is solid, 
    // we would ideally split the data. However, for a simple forecast view, 
    // we can use a separate Area for predictions if they are disjoint, 
    // or just render the whole chart as dashed if any entry is a prediction.
    // For now, let's keep it simple: solid lines.

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value / 100}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#4ade80"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        strokeWidth={2}
                        connectNulls
                    />
                    <Area
                        type="monotone"
                        dataKey="cost"
                        stroke="#f87171"
                        fillOpacity={1}
                        fill="url(#colorCost)"
                        strokeWidth={2}
                        connectNulls
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
