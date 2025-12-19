import React, { useMemo } from "react";
import type { Question } from "../../../types";

interface StrengthWeaknessProps {
	performance: Array<{
		questionType: Question["question_type"];
		label: string;
		attempts: number;
		correct: number;
		accuracy: number;
	}>;
	isDark: boolean;
}

export const StrengthWeakness: React.FC<StrengthWeaknessProps> = ({
	performance,
	isDark,
}) => {
	const { strengths, weaknesses } = useMemo(() => {
		const eligible = performance.filter((p) => p.attempts >= 4);
		const sorted = [...eligible].sort((a, b) => b.accuracy - a.accuracy);

		return {
			strengths: sorted.slice(0, 3),
			weaknesses: [...sorted].reverse().slice(0, 3),
		};
	}, [performance]);

	const meterClass = isDark ? "dashboard-meter-dark" : "dashboard-meter-light";

	return (
		<section
			className={`dashboard-panel ${
				isDark ? "dashboard-panel-dark" : "dashboard-panel-light"
			} p-4 sm:p-5`}
		>
			<div>
				<h2
					className={`dashboard-section-title ${
						isDark ? "text-text-primary-dark" : "text-text-primary-light"
					}`}
				>
					Strengths & weaknesses
				</h2>
				<p
					className={`mt-1 text-sm ${
						isDark ? "text-text-muted-dark" : "text-text-muted-light"
					}`}
				>
					Based on recent question attempts. Neutral scores help you prioritize.
				</p>
			</div>

			<div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<div
						className={`text-sm font-semibold ${
							isDark ? "text-text-primary-dark" : "text-text-primary-light"
						}`}
					>
						Stronger areas
					</div>
					<ul className="mt-3 space-y-3">
						{strengths.map((s) => (
							<li key={s.questionType} className="space-y-2">
								<div className="flex items-center justify-between gap-3">
									<div
										className={`text-sm ${
											isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
										}`}
									>
										{s.label}
									</div>
									<div
										className={`text-xs ${
											isDark ? "text-text-muted-dark" : "text-text-muted-light"
										}`}
									>
										{s.accuracy}% • {s.attempts} attempts
									</div>
								</div>
								<progress
									className={`dashboard-meter ${meterClass}`}
									value={s.accuracy}
									max={100}
								/>
							</li>
						))}
					</ul>
				</div>

				<div>
					<div
						className={`text-sm font-semibold ${
							isDark ? "text-text-primary-dark" : "text-text-primary-light"
						}`}
					>
						Needs attention
					</div>
					<ul className="mt-3 space-y-3">
						{weaknesses.map((w) => (
							<li key={w.questionType} className="space-y-2">
								<div className="flex items-center justify-between gap-3">
									<div
										className={`text-sm ${
											isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
										}`}
									>
										{w.label}
									</div>
									<div
										className={`text-xs ${
											isDark ? "text-text-muted-dark" : "text-text-muted-light"
										}`}
									>
										{w.accuracy}% • {w.attempts} attempts
									</div>
								</div>
								<progress
									className={`dashboard-meter ${meterClass}`}
									value={w.accuracy}
									max={100}
								/>
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
};
