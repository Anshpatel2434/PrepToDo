import React from "react";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import {
	selectQuestions,
	selectAttempts,
	selectCurrentQuestionIndex,
	setCurrentQuestionIndex,
	selectViewMode,
} from "../redux_usecase/dailyPracticeSlice";

interface QuestionPaletteProps {
	isDark: boolean;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({ isDark }) => {
	const dispatch = useDispatch();
	const questions = useSelector(selectQuestions);
	const attempts = useSelector(selectAttempts);
	const currentIndex = useSelector(selectCurrentQuestionIndex);
	const viewMode = useSelector(selectViewMode);

	const getStatusColor = (questionId: string): string => {
		const attempt = attempts[questionId];
		if (!attempt) {
			return isDark
				? "bg-bg-tertiary-dark border-border-dark"
				: "bg-bg-tertiary-light border-border-light";
		}

		switch (attempt.status) {
			case "answered":
				return isDark
					? "bg-success/80 border-success text-white"
					: "bg-success border-success text-white";
			case "skipped":
				return isDark
					? "bg-error/80 border-error text-white"
					: "bg-error border-error text-white";
			case "marked_for_review":
				return isDark
					? "bg-info/80 border-info text-white"
					: "bg-info border-info text-white";
			default:
				return isDark
					? "bg-bg-tertiary-dark border-border-dark"
					: "bg-bg-tertiary-light border-border-light";
		}
	};

	const handleQuestionClick = (index: number) => {
		dispatch(setCurrentQuestionIndex(index));
	};

	// Count statuses
	const statusCounts = {
		answered: Object.values(attempts).filter((a) => a.status === "answered")
			.length,
		skipped: Object.values(attempts).filter((a) => a.status === "skipped")
			.length,
		marked: Object.values(attempts).filter(
			(a) => a.status === "marked_for_review"
		).length,
		notVisited: questions.length - Object.keys(attempts).length,
	};

	return (
		<motion.div
			className={`
                fixed right-0 top-0 h-full w-64 z-20
                backdrop-blur-xl border-l shadow-xl
                ${
									isDark
										? "bg-bg-primary-dark/95 border-border-dark"
										: "bg-bg-primary-light/95 border-border-light"
								}
                flex flex-col
            `}
			initial={{ x: "100%" }}
			animate={{ x: 0 }}
			transition={{ duration: 0.3 }}
		>
			{/* Header */}
			<div
				className={`
                p-4 border-b
                ${isDark ? "border-border-dark" : "border-border-light"}
            `}
			>
				<h3
					className={`
                    font-semibold text-sm uppercase tracking-wide
                    ${
											isDark
												? "text-text-primary-dark"
												: "text-text-primary-light"
										}
                `}
				>
					Question Palette
				</h3>
				{viewMode === "exam" && (
					<div
						className={`
                        mt-2 text-xs
                        ${
													isDark
														? "text-text-secondary-dark"
														: "text-text-secondary-light"
												}
                    `}
					>
						{questions.length} Questions
					</div>
				)}
			</div>

			{/* Status Legend */}
			<div
				className={`
                p-4 border-b space-y-2
                ${isDark ? "border-border-dark" : "border-border-light"}
            `}
			>
				<div className="flex items-center justify-between text-xs">
					<span
						className={
							isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
						}
					>
						Answered
					</span>
					<span
						className={`font-medium ${
							isDark ? "text-success" : "text-success"
						}`}
					>
						{statusCounts.answered}
					</span>
				</div>
				<div className="flex items-center justify-between text-xs">
					<span
						className={
							isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
						}
					>
						Skipped
					</span>
					<span
						className={`font-medium ${isDark ? "text-error" : "text-error"}`}
					>
						{statusCounts.skipped}
					</span>
				</div>
				<div className="flex items-center justify-between text-xs">
					<span
						className={
							isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
						}
					>
						Marked
					</span>
					<span className={`font-medium ${isDark ? "text-info" : "text-info"}`}>
						{statusCounts.marked}
					</span>
				</div>
				<div className="flex items-center justify-between text-xs">
					<span
						className={
							isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
						}
					>
						Not Visited
					</span>
					<span
						className={`font-medium ${
							isDark ? "text-text-muted-dark" : "text-text-muted-light"
						}`}
					>
						{statusCounts.notVisited}
					</span>
				</div>
			</div>

			{/* Question Grid */}
			<div className="flex-1 overflow-y-auto p-4">
				<div className="grid grid-cols-5 gap-2">
					{questions.map((question, index) => (
						<motion.button
							key={question.id}
							onClick={() => handleQuestionClick(index)}
							className={`
                                aspect-square flex items-center justify-center
                                rounded-lg font-medium text-sm
                                border-2 transition-all duration-200
                                ${getStatusColor(question.id)}
                                ${
																	currentIndex === index
																		? "ring-2 ring-brand-accent-light ring-offset-2 dark:ring-offset-dark"
																		: ""
																}
                                ${
																	currentIndex === index && isDark
																		? "ring-brand-accent-dark"
																		: ""
																}
                            `}
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.95 }}
						>
							{index + 1}
						</motion.button>
					))}
				</div>
			</div>

			{/* Question Type Indicators */}
			<div
				className={`
                p-4 border-t space-y-2
                ${isDark ? "border-border-dark" : "border-border-light"}
            `}
			>
				<div className="text-xs font-medium uppercase tracking-wide mb-2">
					Question Types
				</div>
				<div className="flex flex-wrap gap-1">
					{questions.map((q) => (
						<span
							key={q.id}
							className={`
                                text-xs px-2 py-1 rounded
                                ${
																	isDark
																		? "bg-bg-tertiary-dark text-text-muted-dark"
																		: "bg-bg-tertiary-light text-text-muted-light"
																}
                            `}
						>
							{q.questionType === "rc_question"
								? "RC"
								: q.questionType === "para_summary"
								? "PS"
								: q.questionType === "para_jumble"
								? "PJ"
								: q.questionType === "odd_one_out"
								? "OO"
								: q.questionType === "para_completion"
								? "PC"
								: "?"}
						</span>
					))}
				</div>
			</div>
		</motion.div>
	);
};

export default QuestionPalette;
