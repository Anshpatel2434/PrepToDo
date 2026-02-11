import type { FC } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DataPoint {
    date: string;
    totalUsers: number;
    activeUsers: number;
}

interface UserGrowthChartProps {
    data: DataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-[#2a2d3a] bg-[#1a1d27] p-3 shadow-xl">
                <p className="mb-2 text-sm font-medium text-[#e2e8f0]">{label}</p>
                <p className="text-sm text-[#818cf8]">
                    Total: {payload[0].value}
                </p>
                <p className="text-sm text-[#34d399]">
                    Active: {payload[1].value}
                </p>
            </div>
        );
    }
    return null;
};

export const UserGrowthChart: FC<UserGrowthChartProps> = ({ data }) => {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line
                        type="monotone"
                        dataKey="totalUsers"
                        name="Total Users"
                        stroke="#818cf8"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#818cf8' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="activeUsers"
                        name="Active Users"
                        stroke="#34d399"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#34d399' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
