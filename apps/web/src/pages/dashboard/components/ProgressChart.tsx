import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { UserAnalytics } from "../../../types";

interface ProgressChartProps {
	analytics: UserAnalytics[];
	isDark: boolean;
}

const parseYmdUtc = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);

const startOfWeekUtc = (d: Date) => {
	const day = d.getUTCDay(); // Sun=0
	const diff = (day + 6) % 7; // Monday=0
	const monday = new Date(d.getTime() - diff * 24 * 60 * 60 * 1000);
	return new Date(
		Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate())
	);
};

const formatWeekLabel = (d: Date) => {
	const mm = `${d.getUTCMonth() + 1}`.padStart(2, "0");
	const dd = `${d.getUTCDate()}`.padStart(2, "0");
	return `${mm}/${dd}`;
};

const ChartTooltip: React.FC<{
	active?: boolean;
	payload?: ReadonlyArray<{ value?: unknown }>;
	label?: string | number;
	isDark: boolean;
}> = ({ active, payload, label, isDark }) => {
	if (!active || !payload || payload.length === 0) return null;

	const raw = payload[0]?.value;
	const accuracy = typeof raw === "number" ? raw : Number(raw ?? 0);

	return (
		<div
			className={`rounded-xl border px-3 py-2 shadow-lg ${
				isDark
					? "bg-bg-secondary-dark border-border-dark text-text-primary-dark"
					: "bg-bg-secondary-light border-border-light text-text-primary-light"
			}`}
		>
			<div className="text-xs font-semibold">Week of {label}</div>
			<div className="mt-1 text-xs">Avg accuracy: {accuracy}%</div>
		</div>
	);
};

export const ProgressChart: React.FC<ProgressChartProps> = ({
	analytics,
	isDark,
}) => {
	const data = useMemo(() => {
		const byWeek = new Map<
			string,
			{ start: Date; correct: number; total: number }
		>();

		for (const a of analytics) {
			const d = parseYmdUtc(a.date);
			const w = startOfWeekUtc(d);
			const key = w.toISOString().slice(0, 10);
			const prev = byWeek.get(key) ?? { start: w, correct: 0, total: 0 };
			byWeek.set(key, {
				start: w,
				correct: prev.correct + a.questions_correct,
				total: prev.total + a.questions_attempted,
			});
		}

		return Array.from(byWeek.values())
			.sort((a, b) => a.start.getTime() - b.start.getTime())
			.slice(-8)
			.map((w) => ({
				week: formatWeekLabel(w.start),
				accuracy: w.total === 0 ? 0 : Math.round((w.correct / w.total) * 100),
			}));
	}, [analytics]);

	const gridColor = isDark
		? "var(--color-border-dark)"
		: "var(--color-border-light)";
	const textColor = isDark
		? "var(--color-text-muted-dark)"
		: "var(--color-text-muted-light)";
	const lineColor = isDark
		? "var(--color-brand-primary-dark)"
		: "var(--color-brand-primary-light)";

	return (
		<motion.section
			className={`rounded-2xl border ${
				isDark
					? "bg-bg-secondary-dark border-border-dark"
					: "bg-bg-secondary-light border-border-light"
			} p-5 h-full`}
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, ease: "easeOut", delay: 0.2 }}
		>
			<div className="flex items-start justify-between gap-4 mb-4">
				<div>
					<div className="flex items-center gap-2 mb-2">
						<h2
							className={`text-base sm:text-lg font-semibold tracking-tight ${
								isDark ? "text-text-primary-dark" : "text-text-primary-light"
							}`}
						>
							📈 Progress
						</h2>
						<span
							className={`text-xs px-2 py-1 rounded-lg border ${
								isDark
									? "border-border-dark bg-bg-tertiary-dark/40 text-text-muted-dark"
									: "border-border-light bg-bg-tertiary-light/50 text-text-muted-light"
							}`}
						>
							Last 8 weeks
						</span>
					</div>
					<p
						className={`text-sm ${
							isDark ? "text-text-muted-dark" : "text-text-muted-light"
						}`}
					>
						Weekly accuracy trend
					</p>
				</div>
			</div>

			<div className="mt-4 h-56 sm:h-64">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart
						data={data}
						margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
					>
						<CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
						<XAxis
							dataKey="week"
							stroke={textColor}
							tickLine={false}
							axisLine={false}
						/>
						<YAxis
							stroke={textColor}
							tickLine={false}
							axisLine={false}
							domain={[0, 100]}
							width={32}
						/>
						<Tooltip content={(p) => <ChartTooltip {...p} isDark={isDark} />} />
						<Line
							type="monotone"
							dataKey="accuracy"
							stroke={lineColor}
							strokeWidth={2}
							isAnimationActive={false}
							dot={false}
							activeDot={{ r: 3 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</motion.section>
	);
};
