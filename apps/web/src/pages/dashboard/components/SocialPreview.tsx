import React from "react";
import { motion } from "framer-motion";
import type { LeaderboardEntry } from "../../../types";

interface SocialPreviewProps {
	leaderboard: LeaderboardEntry[];
	isDark: boolean;
}

export const SocialPreview: React.FC<SocialPreviewProps> = ({
	leaderboard,
	isDark,
}) => {
	return (
		<motion.section
			className={`rounded-2xl border ${
				isDark
					? "bg-bg-secondary-dark border-border-dark"
					: "bg-bg-secondary-light border-border-light"
			} p-5`}
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, ease: "easeOut", delay: 0.5 }}
		>
			<div className="mb-4">
				<div className="flex items-center gap-2 mb-2">
					<h2
						className={`text-base sm:text-lg font-semibold tracking-tight ${
							isDark ? "text-text-primary-dark" : "text-text-primary-light"
						}`}
					>
						👥 Social Preview
					</h2>
					<span
						className={`text-xs px-2 py-1 rounded-lg border ${
							isDark
								? "border-border-dark bg-bg-tertiary-dark/40 text-text-muted-dark"
								: "border-border-light bg-bg-tertiary-light/50 text-text-muted-light"
						}`}
					>
						Coming soon
					</span>
				</div>
				<p
					className={`text-sm ${
						isDark ? "text-text-muted-dark" : "text-text-muted-light"
					}`}
				>
					Compare progress with peers • Community features
				</p>
			</div>

			<div
				className={`mt-4 rounded-xl border ${
					isDark
						? "border-border-dark bg-bg-tertiary-dark/40"
						: "border-border-light bg-bg-tertiary-light/50"
				}`}
			>
				<div className="px-4 py-3 flex items-center justify-between">
					<div
						className={`text-sm font-semibold ${
							isDark ? "text-text-primary-dark" : "text-text-primary-light"
						}`}
					>
						Peers practiced today
					</div>
					<div
						className={`text-xs ${
							isDark ? "text-text-muted-dark" : "text-text-muted-light"
						}`}
					>
						Daily
					</div>
				</div>
				<ul className="px-4 pb-3 space-y-2">
					{leaderboard.slice(0, 3).map((e) => (
						<li
							key={e.id}
							className="flex items-center justify-between text-sm"
						>
							<div
								className={`flex items-center gap-2 ${
									isDark
										? "text-text-secondary-dark"
										: "text-text-secondary-light"
								}`}
							>
								<span
									className={`w-6 text-xs ${
										isDark ? "text-text-muted-dark" : "text-text-muted-light"
									}`}
								>
									#{e.rank}
								</span>
								<span>User {e.user_id.slice(-4)}</span>
							</div>
							<div
								className={`text-xs ${
									isDark ? "text-text-muted-dark" : "text-text-muted-light"
								}`}
							>
								Score {e.score} • {e.accuracy_percentage ?? 0}%
							</div>
						</li>
					))}
				</ul>
			</div>

			<div
				className={`mt-4 rounded-xl border px-4 py-3 ${
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
					Compare progress (coming soon)
				</div>
				<div
					className={`mt-1 text-sm ${
						isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
					}`}
				>
					You’ll be able to compare consistency and accuracy with peers in your
					cohort.
				</div>
			</div>
		</motion.section>
	);
};
