import type { FC } from 'react';

interface DataPoint {
    date: string;
    count: number;
}

interface ActivityHeatmapProps {
    data: DataPoint[];
}

export const ActivityHeatmap: FC<ActivityHeatmapProps> = ({ data }) => {
    // Calculate 90 days ago for the range
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 90);

    // Map data for quick lookup
    const dataMap = new Map(data.map(d => [d.date, d.count]));

    // Generate dates for the last 90 days
    const dates = [];
    const current = new Date(startDate);
    while (current <= today) {
        dates.push(new Date(current).toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }

    const getColor = (count: number) => {
        if (count === 0) return 'bg-[#1a1d27]';
        if (count < 2) return 'bg-indigo-900/40';
        if (count < 4) return 'bg-indigo-700/60';
        if (count < 6) return 'bg-indigo-500/80';
        return 'bg-indigo-400';
    };

    return (
        <div className="flex flex-col space-y-2">
            <div className="flex flex-wrap gap-1">
                {dates.map(date => {
                    const count = dataMap.get(date) || 0;
                    return (
                        <div
                            key={date}
                            title={`${date}: ${count} sessions`}
                            className={`h-3 w-3 rounded-sm ${getColor(count)} transition-colors cursor-help`}
                        />
                    );
                })}
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#64748b]">
                <span>{startDate.toLocaleDateString()}</span>
                <div className="flex items-center space-x-1">
                    <span>Less</span>
                    <div className="h-2 w-2 rounded-sm bg-[#1a1d27]" />
                    <div className="h-2 w-2 rounded-sm bg-indigo-900/40" />
                    <div className="h-2 w-2 rounded-sm bg-indigo-700/60" />
                    <div className="h-2 w-2 rounded-sm bg-indigo-500/80" />
                    <div className="h-2 w-2 rounded-sm bg-indigo-400" />
                    <span>More</span>
                </div>
                <span>Today</span>
            </div>
        </div>
    );
};
