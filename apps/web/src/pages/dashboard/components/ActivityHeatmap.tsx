import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { UserAnalytics } from "../../../types";

interface ActivityHeatmapProps {
	analytics: UserAnalytics[];
	weeks: number;
	isDark: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseYmdUtc = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);

const toYmd = (d: Date) => d.toISOString().slice(0, 10);

const addDays = (d: Date, days: number) =>
	new Date(d.getTime() + days * MS_PER_DAY);

const getHeatScore = (a: UserAnalytics) =>
	a.questions_attempted + a.minutes_practiced / 5;

const getHeatLevel = (score: number) => {
	if (score <= 0) return 0;
	if (score <= 4) return 1;
	if (score <= 8) return 2;
	if (score <= 14) return 3;
	return 4;
};

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
	analytics,
	weeks,
	isDark,
}) => {
	const byDate = useMemo(() => {
		const m = new Map<string, UserAnalytics>();
		for (const a of analytics) m.set(a.date, a);
		return m;
	}, [analytics]);

	const endDate = useMemo(() => {
		const latest = analytics.reduce<Date | null>((acc, a) => {
			const d = parseYmdUtc(a.date);
			if (!acc) return d;
			return d.getTime() > acc.getTime() ? d : acc;
		}, null);

		return latest ?? new Date();
	}, [analytics]);

	const days = weeks * 7;
	const gridDays = useMemo(() => {
		const start = addDays(endDate, -(days - 1));
		return Array.from({ length: days }, (_, i) => {
			const d = addDays(start, i);
			const key = toYmd(d);
			const a = byDate.get(key);
			const score = a ? getHeatScore(a) : 0;
			return {
				date: key,
				dayOfWeek: d.getUTCDay(),
				minutes: a?.minutes_practiced ?? 0,
				questions: a?.questions_attempted ?? 0,
				heatLevel: getHeatLevel(score),
			};
		});
	}, [byDate, endDate, days]);

	const columns = useMemo(() => {
		const cols: Array<typeof gridDays> = [];
		for (let i = 0; i < weeks; i += 1) {
			cols.push(gridDays.slice(i * 7, i * 7 + 7));
		}
		return cols;
	}, [gridDays, weeks]);

	const legend = [0, 1, 2, 3, 4] as const;

	return (
		<motion.section
			className={`rounded-2xl border ${
				isDark
					? "bg-bg-secondary-dark border-border-dark"
					: "bg-bg-secondary-light border-border-light"
			} p-5`}
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
							📊 Daily Activity
						</h2>
						<span
							className={`text-xs px-2 py-1 rounded-lg border ${
								isDark
									? "border-border-dark bg-bg-tertiary-dark/40 text-text-muted-dark"
									: "border-border-light bg-bg-tertiary-light/50 text-text-muted-light"
							}`}
						>
							Last 12 weeks
						</span>
					</div>
					<p
						className={`text-sm ${
							isDark ? "text-text-muted-dark" : "text-text-muted-light"
						}`}
					>
						Questions attempted + minutes practiced
					</p>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<span
						className={`text-xs font-medium ${
							isDark ? "text-text-muted-dark" : "text-text-muted-light"
						}`}
					>
						Less
					</span>
					<div className="flex items-center gap-1">
						{legend.map((lvl) => (
							<motion.div
								key={lvl}
								className={`border ${
									isDark
										? `dashboard-heat-${lvl}-dark`
										: `dashboard-heat-${lvl}-light`
								} w-3 h-3 rounded-sm`}
								initial={{ scale: 1 }}
								animate={{ scale: 1.1 }}
								transition={{ duration: 0.25, ease: "easeOut" }}
							/>
						))}
					</div>
					<span
						className={`text-xs font-medium ${
							isDark ? "text-text-muted-dark" : "text-text-muted-light"
						}`}
					>
						More
					</span>
				</div>
			</div>

			<div className="overflow-hidden">
				<div className="flex gap-1.5">
					{columns.map((col, colIdx) => (
						<div key={colIdx} className="flex flex-col gap-1.5">
							{col.map((d) => (
								<motion.div
									key={d.date}
									title={`${d.date} • ${d.questions} q • ${d.minutes} min`}
									className={`border ${
										isDark
											? `dashboard-heat-${d.heatLevel}-dark`
											: `dashboard-heat-${d.heatLevel}-light`
									} w-3.5 h-3.5 rounded-sm transition-transform hover:scale-110`}
									initial={{ scale: 1 }}
									animate={{ scale: 1.1 }}
									transition={{ duration: 0.25, ease: "easeOut" }}
								/>
							))}
						</div>
					))}
				</div>
			</div>
		</motion.section>
	);
};
