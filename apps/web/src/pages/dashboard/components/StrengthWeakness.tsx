import React, { useMemo } from "react";
import { motion } from "framer-motion";
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

	const meterClass = isDark
		? "bg-brand-primary-dark"
		: "bg-brand-primary-light";

	return (
		<motion.section
			className={`rounded-2xl border ${
				isDark
					? "bg-bg-secondary-dark border-border-dark"
					: "bg-bg-secondary-light border-border-light"
			} p-5`}
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, ease: "easeOut", delay: 0.3 }}
		>
			<div className="mb-4">
				<div className="flex items-center gap-2 mb-2">
					<h2
						className={`text-base sm:text-lg font-semibold tracking-tight ${
							isDark ? "text-text-primary-dark" : "text-text-primary-light"
						}`}
					>
						🎯 Strengths & Weaknesses
					</h2>
				</div>
				<p
					className={`text-sm ${
						isDark ? "text-text-muted-dark" : "text-text-muted-light"
					}`}
				>
					Based on recent question attempts • 4+ attempts required
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
											isDark
												? "text-text-secondary-dark"
												: "text-text-secondary-light"
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
											isDark
												? "text-text-secondary-dark"
												: "text-text-secondary-light"
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
		</motion.section>
	);
};
