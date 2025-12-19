import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { Question } from "../../../types";

interface NextStepsProps {
	performance: Array<{
		questionType: Question["question_type"];
		label: string;
		attempts: number;
		correct: number;
		accuracy: number;
	}>;
	isDark: boolean;
}

export const NextSteps: React.FC<NextStepsProps> = ({
	performance,
	isDark,
}) => {
	const actions = useMemo(() => {
		const eligible = performance.filter((p) => p.attempts >= 4);
		const sorted = [...eligible].sort((a, b) => a.accuracy - b.accuracy);
		const weakest = sorted[0];
		const second = sorted[1];

		const list: Array<{ title: string; detail: string }> = [];

		if (weakest) {
			list.push({
				title: `Practice: ${weakest.label}`,
				detail: `Target accuracy: +10% over the next 7 days. Focus on error review, not volume.`,
			});
		}

		if (second) {
			list.push({
				title: `Strengthen: ${second.label}`,
				detail: `Do 6–10 focused questions and write a one-line reason for every mistake.`,
			});
		}

		list.push({
			title: "Daily RC routine (15 min)",
			detail:
				"One passage, untimed. Summarize the author’s claim + tone in two sentences.",
		});

		return list.slice(0, 3);
	}, [performance]);

	return (
		<motion.section
			className={`rounded-2xl border ${
				isDark
					? "bg-bg-secondary-dark border-border-dark"
					: "bg-bg-secondary-light border-border-light"
			} p-5`}
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, ease: "easeOut", delay: 0.4 }}
		>
			<div className="mb-4">
				<div className="flex items-center gap-2 mb-2">
					<h2
						className={`text-base sm:text-lg font-semibold tracking-tight ${
							isDark ? "text-text-primary-dark" : "text-text-primary-light"
						}`}
					>
						🚀 What to do next
					</h2>
				</div>
				<p
					className={`text-sm ${
						isDark ? "text-text-muted-dark" : "text-text-muted-light"
					}`}
				>
					Two focused actions beat a long plan • Keep it deliberate
				</p>
			</div>

			<ul className="mt-4 space-y-3">
				{actions.map((a) => (
					<li
						key={a.title}
						className={`rounded-xl border px-4 py-3 ${
							isDark
								? "border-border-dark bg-bg-tertiary-dark/40"
								: "border-border-light bg-bg-tertiary-light/50"
						}`}
					>
						<div
							className={`text-sm font-semibold ${
								isDark ? "text-text-primary-dark" : "text-text-primary-light"
							}`}
						>
							{a.title}
						</div>
						<div
							className={`mt-1 text-sm ${
								isDark
									? "text-text-secondary-dark"
									: "text-text-secondary-light"
							}`}
						>
							{a.detail}
						</div>
					</li>
				))}
			</ul>
		</motion.section>
	);
};
