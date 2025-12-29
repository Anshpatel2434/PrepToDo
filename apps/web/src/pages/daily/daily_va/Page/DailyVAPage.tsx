import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { MdArrowBack, MdArrowForward } from "react-icons/md";
import { useTheme } from "../../../../context/ThemeContext";
import { FloatingNavigation } from "../../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../../ui_components/ThemeToggle";
import {
	selectViewMode,
	selectCurrentQuestionIndex,
	selectQuestions,
	selectAttempts,
	selectIsFirstQuestion,
	selectIsLastQuestion,
	goToNextQuestion,
	goToPreviousQuestion,
	setViewMode,
	selectCurrentQuestion,
	submitAnswer,
	toggleMarkForReview,
	selectElapsedTime,
	incrementElapsedTime,
	selectSelectedOption,
	setSelectedOption as setVAOption,
} from "../../redux_usecase/dailyPracticeSlice";
import { dailyVAData } from "../../mock_data/dailyMockData";
import { VALayout } from "../Component/VALayout";

const DailyVAPage: React.FC = () => {
	const dispatch = useDispatch();
	const { isDark } = useTheme();

	// Local state
	const [isLoading, setIsLoading] = useState(true);
	const [showPalette, setShowPalette] = useState(true);

	// Redux state
	const viewMode = useSelector(selectViewMode);
	const currentQuestionIndex = useSelector(selectCurrentQuestionIndex);
	const questions = useSelector(selectQuestions);
	const attempts = useSelector(selectAttempts);
	const isFirstQuestion = useSelector(selectIsFirstQuestion);
	const isLastQuestion = useSelector(selectIsLastQuestion);
	const currentQuestion = useSelector(selectCurrentQuestion);
	const elapsedTime = useSelector(selectElapsedTime);
	const selectedOption = useSelector(selectSelectedOption);

	// Initialize session
	useEffect(() => {
		const initializeSession = async () => {
			setIsLoading(true);

			// Simulate data loading
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Initialize Redux with VA data
			dispatch({
				type: "dailyPractice/initializeSession",
				payload: {
					type: "va",
					questions: dailyVAData.questions,
				},
			});

			setIsLoading(false);
		};

		initializeSession();
	}, [dispatch]);

	// Timer effect
	useEffect(() => {
		const timer = setInterval(() => {
			dispatch(incrementElapsedTime());
		}, 1000);

		return () => clearInterval(timer);
	}, [dispatch]);

	// Handle navigation
	const handleNextQuestion = useCallback(() => {
		if (!isLastQuestion) {
			dispatch(goToNextQuestion());
		} else {
			// Show submit confirmation
			const answeredCount = Object.values(attempts).filter(
				(a) => a.status === "answered"
			).length;
			if (answeredCount < questions.length) {
				if (
					window.confirm(
						`You have ${answeredCount} of ${questions.length} questions answered. Submit anyway?`
					)
				) {
					dispatch(setViewMode("solution"));
				}
			} else {
				dispatch(setViewMode("solution"));
			}
		}
	}, [dispatch, isLastQuestion, attempts, questions.length]);

	const handlePreviousQuestion = useCallback(() => {
		if (!isFirstQuestion) {
			dispatch(goToPreviousQuestion());
		}
	}, [dispatch, isFirstQuestion]);

	const handleQuestionClick = useCallback(
		(index: number) => {
			dispatch({
				type: "dailyPractice/setCurrentQuestionIndex",
				payload: index,
			});
		},
		[dispatch]
	);

	const handleSubmit = useCallback(() => {
		dispatch(submitAnswer());
		setTimeout(() => {
			handleNextQuestion();
		}, 300);
	}, [dispatch, handleNextQuestion]);

	const handleMarkForReview = useCallback(() => {
		dispatch(toggleMarkForReview());
	}, [dispatch]);

	const handleToggleViewMode = useCallback(() => {
		dispatch(setViewMode(viewMode === "exam" ? "solution" : "exam"));
	}, [dispatch, viewMode]);

	const formatTime = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs
			.toString()
			.padStart(2, "0")}`;
	};

	// Calculate progress
	const answeredCount = Object.values(attempts).filter(
		(a) => a.status === "answered"
	).length;
	const progress = (answeredCount / questions.length) * 100;

	// VA-specific handlers
	const handleOptionSelect = useCallback(
		(optionId: string) => {
			dispatch(setVAOption(optionId));
		},
		[dispatch]
	);

	if (isLoading) {
		return (
			<div
				className={`min-h-screen ${
					isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
				}`}
			>
				<FloatingThemeToggle />
				<FloatingNavigation />
				<div className="flex items-center justify-center h-screen">
					<div className="flex flex-col items-center gap-4">
						<div
							className={`
                            w-16 h-16 rounded-full border-4 animate-spin
                            ${
															isDark
																? "border-brand-primary-dark border-t-transparent"
																: "border-brand-primary-light border-t-transparent"
														}
                        `}
						/>
						<p
							className={
								isDark
									? "text-text-secondary-dark"
									: "text-text-secondary-light"
							}
						>
							Loading Daily VA Practice...
						</p>
					</div>
				</div>
			</div>
		);
	}

	const isExamMode = viewMode === "exam";

	// Render VA-specific content
	const renderVAContent = () => {
		if (!currentQuestion) return null;

		// For para jumble, we need special handling
		if (currentQuestion.questionType === "para_jumble") {
			return (
				<div className="space-y-6">
					{/* Sentences */}
					<div className="space-y-3">
						<p
							className={`
                            text-sm font-medium
                            ${
															isDark
																? "text-text-secondary-dark"
																: "text-text-secondary-light"
														}
                        `}
						>
							Arrange these sentences in the correct order:
						</p>
						{currentQuestion.sentences?.map((sentence, index) => (
							<motion.div
								key={index}
								className={`
                                    p-4 rounded-xl border
                                    ${
																			isDark
																				? "bg-bg-tertiary-dark border-border-dark"
																				: "bg-bg-tertiary-light border-border-light"
																		}
                                `}
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.1 }}
							>
								<span
									className={`
                                    inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium mr-3
                                    ${
																			isDark
																				? "bg-bg-secondary-dark text-text-muted-dark"
																				: "bg-bg-secondary-light text-text-muted-light"
																		}
                                `}
								>
									{index + 1}
								</span>
								{sentence}
							</motion.div>
						))}
					</div>

					{/* Answer Input */}
					<div className="space-y-3">
						<label
							className={`
                            block text-sm font-medium
                            ${
															isDark
																? "text-text-secondary-dark"
																: "text-text-secondary-light"
														}
                        `}
						>
							Enter your sequence (e.g., 2143):
						</label>
						<input
							type="text"
							value={selectedOption || ""}
							onChange={(e) => {
								const value = e.target.value.replace(/[^1-4]/g, "");
								if (value.length <= 4) {
									handleOptionSelect(value);
								}
							}}
							placeholder="Enter 4 digit sequence"
							maxLength={4}
							disabled={!isExamMode}
							className={`
                                w-full p-4 rounded-xl border-2 text-center text-2xl tracking-widest font-mono
                                focus:outline-none focus:ring-2 focus:ring-brand-primary-light
                                ${
																	isDark
																		? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark placeholder-text-muted-dark"
																		: "bg-bg-tertiary-light border-border-light text-text-primary-light placeholder-text-muted-light"
																}
                                ${
																	!isExamMode &&
																	currentQuestion.correctAnswer ===
																		selectedOption
																		? "border-success"
																		: ""
																}
                                ${
																	!isExamMode &&
																	currentQuestion.correctAnswer !==
																		selectedOption
																		? "border-error"
																		: ""
																}
                            `}
						/>
						<p
							className={`
                            text-xs
                            ${
															isDark
																? "text-text-muted-dark"
																: "text-text-muted-light"
														}
                        `}
						>
							Enter the order (1-4) in which sentences should appear
						</p>
					</div>
				</div>
			);
		}

		// Standard VA options (para summary, para completion, odd one out)
		return (
			<div className="space-y-3">
				{currentQuestion.options.map((option, index) => {
					const isSelected = selectedOption === option.id;
					const isCorrect = currentQuestion.correctAnswer === option.id;
					const showResult = !isExamMode;

					let optionClass = `
                        w-full p-4 rounded-xl border-2 text-left transition-all duration-200
                    `;

					if (isExamMode) {
						optionClass += isSelected
							? isDark
								? "bg-brand-primary-dark/20 border-brand-primary-dark text-text-primary-dark"
								: "bg-brand-primary-light/10 border-brand-primary-light text-text-primary-light"
							: isDark
							? "bg-bg-tertiary-dark border-border-dark hover:border-brand-primary-dark text-text-secondary-dark"
							: "bg-bg-tertiary-light border-border-light hover:border-brand-primary-light text-text-secondary-light";
					} else if (showResult) {
						if (isCorrect) {
							optionClass += isDark
								? "bg-success/20 border-success text-success"
								: "bg-success/10 border-success text-success";
						} else if (isSelected && !isCorrect) {
							optionClass += isDark
								? "bg-error/20 border-error text-error"
								: "bg-error/10 border-error text-error";
						} else {
							optionClass += isDark
								? "bg-bg-tertiary-dark border-border-dark text-text-muted-dark"
								: "bg-bg-tertiary-light border-border-light text-text-muted-light";
						}
					}

					return (
						<motion.button
							key={option.id}
							onClick={() => isExamMode && handleOptionSelect(option.id)}
							className={optionClass}
							disabled={!isExamMode}
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: index * 0.1 }}
							whileHover={isExamMode ? { scale: 1.01 } : {}}
							whileTap={isExamMode ? { scale: 0.99 } : {}}
						>
							<div className="flex items-start gap-3">
								<span
									className={`
                                    w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-sm shrink-0
                                    ${
																			isExamMode
																				? selectedOption === option.id
																					? isDark
																						? "bg-brand-primary-dark text-white"
																						: "bg-brand-primary-light text-white"
																					: isDark
																					? "bg-bg-secondary-dark text-text-muted-dark"
																					: "bg-bg-secondary-light text-text-muted-light"
																				: ""
																		}
                                    ${
																			!isExamMode &&
																			currentQuestion.correctAnswer ===
																				option.id
																				? isDark
																					? "bg-success text-white"
																					: "bg-success text-white"
																				: ""
																		}
                                    ${
																			!isExamMode &&
																			selectedOption === option.id &&
																			currentQuestion.correctAnswer !==
																				option.id
																				? isDark
																					? "bg-error text-white"
																					: "bg-error text-white"
																				: ""
																		}
                                `}
								>
									{option.id}
								</span>
								<span className="flex-1">{option.text}</span>
							</div>
						</motion.button>
					);
				})}
			</div>
		);
	};

	return (
		<div
			className={`min-h-screen ${
				isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
			}`}
		>
			<FloatingThemeToggle />
			<FloatingNavigation />

			{/* Top Header */}
			<motion.header
				className={`
                    fixed top-0 left-0 right-0 z-30 h-16
                    backdrop-blur-xl border-b
                    ${
											isDark
												? "bg-bg-primary-dark/90 border-border-dark"
												: "bg-bg-primary-light/90 border-border-light"
										}
                `}
				initial={{ y: -60 }}
				animate={{ y: 0 }}
				transition={{ duration: 0.3 }}
			>
				<div className="h-full px-6 flex items-center justify-between">
					{/* Left: Title and Progress */}
					<div className="flex items-center gap-6">
						<h1
							className={`
                            font-serif font-bold text-xl
                            ${
															isDark
																? "text-text-primary-dark"
																: "text-text-primary-light"
														}
                        `}
						>
							Daily Practice: VA
						</h1>

						{/* Progress Bar */}
						<div className="hidden md:flex items-center gap-3">
							<div
								className={`
                                w-32 h-2 rounded-full overflow-hidden
                                ${
																	isDark
																		? "bg-bg-tertiary-dark"
																		: "bg-bg-tertiary-light"
																}
                            `}
							>
								<motion.div
									className={`h-full ${
										isDark ? "bg-brand-primary-dark" : "bg-brand-primary-light"
									}`}
									initial={{ width: 0 }}
									animate={{ width: `${progress}%` }}
									transition={{ duration: 0.3 }}
								/>
							</div>
							<span
								className={`
                                text-sm font-medium
                                ${
																	isDark
																		? "text-text-secondary-dark"
																		: "text-text-secondary-light"
																}
                            `}
							>
								{answeredCount}/{questions.length}
							</span>
						</div>
					</div>

					{/* Center: Timer (hidden in solution mode) */}
					{isExamMode && (
						<div
							className={`
                            px-4 py-2 rounded-lg font-mono text-lg
                            ${
															isDark
																? "bg-bg-tertiary-dark text-text-primary-dark"
																: "bg-bg-tertiary-light text-text-primary-light"
														}
                        `}
						>
							{formatTime(elapsedTime)}
						</div>
					)}

					{/* Right: Actions */}
					<div className="flex items-center gap-3">
						{/* Toggle Palette */}
						<motion.button
							onClick={() => setShowPalette(!showPalette)}
							className={`
                                p-2 rounded-lg border transition-colors
                                ${
																	isDark
																		? "border-border-dark hover:bg-bg-tertiary-dark"
																		: "border-border-light hover:bg-bg-tertiary-light"
																}
                            `}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							<span
								className={`
                                text-sm font-medium
                                ${
																	isDark
																		? "text-text-secondary-dark"
																		: "text-text-secondary-light"
																}
                            `}
							>
								{showPalette ? "Hide" : "Show"} Palette
							</span>
						</motion.button>

						{/* View Mode Toggle */}
						<motion.button
							onClick={handleToggleViewMode}
							className={`
                                px-4 py-2 rounded-lg font-medium transition-colors
                                ${
																	isDark
																		? "bg-brand-primary-dark text-white hover:bg-brand-primary-hover-dark"
																		: "bg-brand-primary-light text-white hover:bg-brand-primary-hover-light"
																}
                            `}
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
						>
							{isExamMode ? "View Solutions" : "Back to Exam"}
						</motion.button>
					</div>
				</div>
			</motion.header>

			{/* Main Content */}
			<main className="pt-16 pb-24 min-h-screen">
				<VALayout
					isDark={isDark}
					question={currentQuestion!}
					isExamMode={isExamMode}
				>
					{/* Render VA-specific content */}
					{renderVAContent()}

					{/* Confidence Selector (Exam Mode Only) */}
					{isExamMode && (
						<div className="mt-8 pt-6 border-t border-dashed">
							<div className="flex items-center gap-6">
								<div className="flex-1">
									<p
										className={`
                                        text-sm font-medium mb-3
                                        ${
																					isDark
																						? "text-text-secondary-dark"
																						: "text-text-secondary-light"
																				}
                                    `}
									>
										How confident are you about this answer?
									</p>
									<div className="flex gap-3">
										{[1, 2, 3].map((level) => (
											<motion.button
												key={level}
												onClick={() => handleOptionSelect("" + level)}
												className={`
                                                    flex-1 py-3 rounded-xl font-medium border-2 transition-all duration-200
                                                    ${
																											selectedOption ===
																											String(level)
																												? level === 1
																													? isDark
																														? "bg-error/20 border-error text-error"
																														: "bg-error/10 border-error text-error"
																													: level === 2
																													? isDark
																														? "bg-warning/20 border-warning text-warning"
																														: "bg-warning/10 border-warning text-warning"
																													: isDark
																													? "bg-success/20 border-success text-success"
																													: "bg-success/10 border-success text-success"
																												: isDark
																												? "bg-bg-tertiary-dark border-border-dark text-text-muted-dark"
																												: "bg-bg-tertiary-light border-border-light text-text-muted-light"
																										}
                                                `}
												whileHover={{ scale: 1.02 }}
												whileTap={{ scale: 0.98 }}
											>
												{level === 1 ? "Low" : level === 2 ? "Medium" : "High"}
											</motion.button>
										))}
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Action Buttons */}
					{isExamMode && (
						<div className="mt-8 flex gap-3">
							<motion.button
								onClick={handleMarkForReview}
								className={`
                                    px-6 py-3 rounded-xl font-medium border-2 transition-all duration-200
                                    ${
																			isDark
																				? "border-brand-primary-dark text-brand-primary-dark hover:bg-brand-primary-dark/10"
																				: "border-brand-primary-light text-brand-primary-light hover:bg-brand-primary-light/10"
																		}
                                `}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								Mark for Review
							</motion.button>
							<motion.button
								onClick={handleSubmit}
								className={`
                                    flex-1 px-6 py-3 rounded-xl font-medium text-white transition-all duration-200
                                    ${
																			isDark
																				? "bg-brand-primary-dark hover:bg-brand-primary-hover-dark"
																				: "bg-brand-primary-light hover:bg-brand-primary-hover-light"
																		}
                                `}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								Submit Answer
							</motion.button>
						</div>
					)}
				</VALayout>

				{/* Question Palette (Bottom for VA) */}
				<AnimatePresence>
					{showPalette && (
						<motion.div
							className={`
                                fixed bottom-24 left-0 right-0 z-20
                                backdrop-blur-xl border-t
                                ${
																	isDark
																		? "bg-bg-primary-dark/95 border-border-dark"
																		: "bg-bg-primary-light/95 border-border-light"
																}
                            `}
							initial={{ y: "100%" }}
							animate={{ y: 0 }}
							exit={{ y: "100%" }}
							transition={{ duration: 0.3 }}
						>
							<div className="px-6 py-4">
								<div className="flex items-center justify-between mb-3">
									<span
										className={`
                                        text-xs font-medium uppercase tracking-wide
                                        ${
																					isDark
																						? "text-text-muted-dark"
																						: "text-text-muted-light"
																				}
                                    `}
									>
										Question Palette
									</span>
									<div className="flex gap-4 text-xs">
										<span className="flex items-center gap-1">
											<span className="w-3 h-3 rounded bg-success" />
											Answered (
											{
												Object.values(attempts).filter(
													(a) => a.status === "answered"
												).length
											}
											)
										</span>
										<span className="flex items-center gap-1">
											<span className="w-3 h-3 rounded bg-error" />
											Skipped (
											{
												Object.values(attempts).filter(
													(a) => a.status === "skipped"
												).length
											}
											)
										</span>
										<span className="flex items-center gap-1">
											<span className="w-3 h-3 rounded bg-info" />
											Marked (
											{
												Object.values(attempts).filter(
													(a) => a.status === "marked_for_review"
												).length
											}
											)
										</span>
									</div>
								</div>
								<div className="flex gap-2 justify-center">
									{questions.map((q, index) => {
										const attempt = attempts[q.id];
										const status = attempt?.status;

										let bgClass = isDark
											? "bg-bg-tertiary-dark"
											: "bg-bg-tertiary-light";
										if (status === "answered")
											bgClass = isDark ? "bg-success/80" : "bg-success";
										else if (status === "skipped")
											bgClass = isDark ? "bg-error/80" : "bg-error";
										else if (status === "marked_for_review")
											bgClass = isDark ? "bg-info/80" : "bg-info";

										return (
											<motion.button
												key={q.id}
												onClick={() => handleQuestionClick(index)}
												className={`
                                                    w-12 h-12 rounded-xl font-medium text-lg
                                                    transition-all duration-200
                                                    ${
																											index ===
																											currentQuestionIndex
																												? isDark
																													? "bg-brand-primary-dark text-white ring-2 ring-brand-accent-dark"
																													: "bg-brand-primary-light text-white ring-2 ring-brand-accent-light"
																												: bgClass +
																												  " text-white"
																										}
                                                `}
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.95 }}
											>
												{index + 1}
											</motion.button>
										);
									})}
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</main>

			{/* Bottom Navigation Footer */}
			<motion.footer
				className={`
                    fixed bottom-0 left-0 right-0 z-30
                    backdrop-blur-xl border-t
                    ${
											isDark
												? "bg-bg-primary-dark/90 border-border-dark"
												: "bg-bg-primary-light/90 border-border-light"
										}
                `}
				initial={{ y: 60 }}
				animate={{ y: 0 }}
				transition={{ duration: 0.3 }}
			>
				<div className="px-6 py-4 flex items-center justify-between">
					{/* Left: Previous Button */}
					<motion.button
						onClick={handlePreviousQuestion}
						disabled={isFirstQuestion}
						className={`
                            flex items-center gap-2 px-6 py-3 rounded-xl font-medium
                            transition-all duration-200
                            ${
															isFirstQuestion
																? "opacity-50 cursor-not-allowed"
																: isDark
																? "bg-bg-tertiary-dark text-text-primary-dark hover:bg-bg-secondary-dark"
																: "bg-bg-tertiary-light text-text-primary-light hover:bg-bg-secondary-light"
														}
                        `}
						whileHover={!isFirstQuestion ? { scale: 1.02 } : {}}
						whileTap={!isFirstQuestion ? { scale: 0.98 } : {}}
					>
						<MdArrowBack className="w-5 h-5" />
						Previous
					</motion.button>

					{/* Center */}
					<div className="text-sm font-medium">
						<span
							className={
								isDark
									? "text-text-secondary-dark"
									: "text-text-secondary-light"
							}
						>
							Question {currentQuestionIndex + 1} of {questions.length}
						</span>
					</div>

					{/* Right: Next/Submit Button */}
					<motion.button
						onClick={isLastQuestion ? handleToggleViewMode : handleNextQuestion}
						className={`
                            flex items-center gap-2 px-6 py-3 rounded-xl font-medium
                            transition-all duration-200
                            ${
															isDark
																? "bg-brand-primary-dark text-white hover:bg-brand-primary-hover-dark"
																: "bg-brand-primary-light text-white hover:bg-brand-primary-hover-light"
														}
                        `}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
					>
						{isLastQuestion ? (
							<>
								{isExamMode ? "View Solutions" : "Next"}
								<MdArrowForward className="w-5 h-5" />
							</>
						) : (
							<>
								Next
								<MdArrowForward className="w-5 h-5" />
							</>
						)}
					</motion.button>
				</div>
			</motion.footer>
		</div>
	);
};

export default DailyVAPage;
