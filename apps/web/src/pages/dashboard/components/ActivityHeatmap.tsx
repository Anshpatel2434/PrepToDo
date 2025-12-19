import React, { useMemo } from "react";
import type { UserAnalytics } from "../../../types";

interface ActivityHeatmapProps {
	analytics: UserAnalytics[];
	weeks: number;
	isDark: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseYmdUtc = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);

const toYmd = (d: Date) => d.toISOString().slice(0, 10);

const addDays = (d: Date, days: number) => new Date(d.getTime() + days * MS_PER_DAY);

const getHeatScore = (a: UserAnalytics) => a.questions_attempted + a.minutes_practiced / 5;

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
		<section
			className={`dashboard-panel ${
				isDark ? "dashboard-panel-dark" : "dashboard-panel-light"
			} p-4 sm:p-5`}
		>
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2
						className={`dashboard-section-title ${
							isDark ? "text-text-primary-dark" : "text-text-primary-light"
						}`}
					>
						Daily activity
					</h2>
					<p
						className={`mt-1 text-sm ${
							isDark ? "text-text-muted-dark" : "text-text-muted-light"
						}`}
					>
						Heat score = questions attempted + (minutes practiced / 5)
					</p>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<span
						className={`text-xs ${
							isDark ? "text-text-muted-dark" : "text-text-muted-light"
						}`}
					>
						Less
					</span>
					<div className="flex items-center gap-1">
						{legend.map((lvl) => (
							<div
								key={lvl}
								className={`dashboard-heat-cell ${
									isDark
										? `dashboard-heat-${lvl}-dark`
										: `dashboard-heat-${lvl}-light`
								} w-3 h-3 rounded-sm`}
							/>
						))}
					</div>
					<span
						className={`text-xs ${
							isDark ? "text-text-muted-dark" : "text-text-muted-light"
						}`}
					>
						More
					</span>
				</div>
			</div>

			<div className="mt-4 overflow-hidden">
				<div className="flex gap-2">
					{columns.map((col, colIdx) => (
						<div key={colIdx} className="flex flex-col gap-2">
							{col.map((d) => (
								<div
									key={d.date}
									title={`${d.date} • ${d.questions} q • ${d.minutes} min`}
									className={`dashboard-heat-cell ${
										isDark
											? `dashboard-heat-${d.heatLevel}-dark`
											: `dashboard-heat-${d.heatLevel}-light`
									} w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm`}
								/>
							))}
						</div>
					))}
				</div>
			</div>
		</section>
	);
};
