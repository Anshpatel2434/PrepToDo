import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { MdArrowForward, MdChevronLeft, MdChevronRight } from "react-icons/md";
import { useTheme } from "../../../../context/ThemeContext";
import { FloatingNavigation } from "../../../../ui_components/FloatingNavigation";
import { FloatingThemeToggle } from "../../../../ui_components/ThemeToggle";
import {
	selectViewMode,
	selectCurrentQuestionIndex,
	selectAttempts,
	selectIsFirstQuestion,
	selectIsLastQuestion,
	goToNextQuestion,
	goToPreviousQuestion,
	setViewMode,
	selectElapsedTime,
	selectStartTime,
	incrementElapsedTime,
	clearResponse,
	toggleMarkForReview,
	submitAnswer,
	initializeSession,
	initializeSessionWithAttempts,
	setStartTime,
	selectSelectedOption,
} from "../../redux_usecase/dailyPracticeSlice";
import { SplitPaneLayout } from "../Component/SplitPaneLayout";
import { QuestionPalette } from "../../components/QuestionPalette";
import { QuestionPanel } from "../../components/QuestionPanel";
import type { Question, Passage, Option } from "../../../../types";
import {
	useSaveSessionDetailsMutation,
	useSaveQuestionAttemptsMutation,
} from "../../redux_usecase/dailyPracticeApi";

const DailyRCPage: React.FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const { isDark } = useTheme();

	// Get session data from location state
	const { sessionId, testData, existingAttempts } = location.state || {};

	// Local state
	const [isLoading, setIsLoading] = useState(true);
	const [showPalette, setShowPalette] = useState(true);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [passages, setPassages] = useState<Passage[]>([]);

	// Redux state
	const viewMode = useSelector(selectViewMode);
	const currentQuestionIndex = useSelector(selectCurrentQuestionIndex);
	const attempts = useSelector(selectAttempts);
	const isFirstQuestion = useSelector(selectIsFirstQuestion);
	const isLastQuestion = useSelector(selectIsLastQuestion);
	const elapsedTime = useSelector(selectElapsedTime);
	const startTime = useSelector(selectStartTime);
	const selectedOption = useSelector(selectSelectedOption);

	// API mutations
	const [saveSessionDetails] = useSaveSessionDetailsMutation();
	const [saveQuestionAttempts] = useSaveQuestionAttemptsMutation();

	const currentQuestion = questions[currentQuestionIndex];
	const passageData = passages.find(
		(p) => p.id === currentQuestion?.passage_id
	);
	const currentPassage = passageData
		? {
				id: passageData.id,
				title: passageData.title || "",
				content: passageData.content,
				genre: passageData.genre,
		  }
		: null;

	// Initialize session
	useEffect(() => {
		const initSession = async () => {
			setIsLoading(true);

			if (!testData || !sessionId) {
				console.error("No test data or session ID");
				navigate("/daily");
				return;
			}

			// Filter RC questions
			const rcQuestions = testData.questions.filter(
				(q: Question) =>
					q.question_type === "rc_question" || q.passage_id !== null
			);

			const rcPassages = testData.passages.filter((p: Passage) =>
				rcQuestions.some((q: Question) => q.passage_id === p.id)
			);

			setQuestions(rcQuestions);
			setPassages(rcPassages);

			// Initialize Redux with question IDs and existing attempts if available
			const questionIds = rcQuestions.map((q: Question) => q.id);

			if (existingAttempts && Object.keys(existingAttempts).length > 0) {
				// Transform existing attempts to the format expected by Redux
				const transformedAttempts: Record<string, any> = {};
				existingAttempts.forEach((attempt: any) => {
					transformedAttempts[attempt.question_id] = {
						user_id: attempt.user_id,
						session_id: attempt.session_id,
						question_id: attempt.question_id,
						passage_id: attempt.passage_id,
						user_answer: attempt.user_answer,
						is_correct: attempt.is_correct,
						time_spent_seconds: attempt.time_spent_seconds,
						confidence_level: attempt.confidence_level,
						marked_for_review: attempt.marked_for_review,
						rationale_viewed: attempt.rationale_viewed,
						rationale_helpful: attempt.rationale_helpful,
						ai_feedback: attempt.ai_feedback,
					};
				});

				dispatch(
					initializeSessionWithAttempts({
						questionIds,
						currentIndex: 0,
						elapsedTime: 0,
						attempts: transformedAttempts,
					})
				);
			} else {
				dispatch(
					initializeSession({
						questionIds,
						currentIndex: 0,
						elapsedTime: 0,
					})
				);
			}

			// Set start time
			dispatch(setStartTime(Date.now()));

			setIsLoading(false);
		};

		initSession();
	}, [dispatch, testData, sessionId, navigate]);

	// Handle save progress
	const handleSaveProgress = async () => {
		if (!sessionId) return;

		try {
			// Calculate stats
			const answeredCount = Object.values(attempts).filter((a) => {
				const userAnswer = a.user_answer as any;
				return userAnswer?.user_answer != null;
			}).length;
			const correctCount = Object.values(attempts).filter(
				(a) => a.is_correct
			).length;
			const scorePercentage =
				answeredCount > 0
					? Math.round((correctCount / answeredCount) * 100)
					: 0;

			// Save session details
			await saveSessionDetails({
				session_id: sessionId,
				time_spent_seconds: elapsedTime,
				status: viewMode === "solution" ? "completed" : "in_progress",
				total_questions: questions.length,
				correct_answers: correctCount,
				score_percentage: scorePercentage,
				current_question_index: currentQuestionIndex,
				...(viewMode === "solution" && {
					completed_at: new Date().toISOString(),
				}),
			});

			// Save question attempts
			if (Object.keys(attempts).length > 0) {
				await saveQuestionAttempts({
					attempts: Object.values(attempts),
				});
			}
		} catch (error) {
			console.error("Error saving progress:", error);
		}
	};

	// Timer effect
	useEffect(() => {
		if (viewMode === "exam" && !isLoading) {
			const timer = setInterval(() => {
				dispatch(incrementElapsedTime());
			}, 1000);

			return () => clearInterval(timer);
		}
	}, [dispatch, viewMode, isLoading]);

	// Save state before closing tab
	useEffect(() => {
		const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
			// Save current state
			if (viewMode === "exam" && Object.keys(attempts).length > 0) {
				e.preventDefault();
				e.returnValue = "";

				// Save session and attempts
				await handleSaveProgress();
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [
		attempts,
		currentQuestionIndex,
		elapsedTime,
		viewMode,
		sessionId,
		handleSaveProgress,
	]);

	// Handle submit session
	const handleSubmitSession = async () => {
		await handleSaveProgress();
		dispatch(setViewMode("solution"));
	};

	// Handle save and next
	const handleSaveAndNext = useCallback(async () => {
		if (!currentQuestion || !sessionId) return;

		// Determine correct answer from question data
		const correctAnswer = currentQuestion.correct_answer;

		// Update attempt in Redux
		dispatch(
			submitAnswer({
				user_id: "user-id", // Will be replaced with actual user ID
				session_id: sessionId,
				passage_id: currentQuestion.passage_id ?? null,
				correct_answer: correctAnswer,
			})
		);

		// Reset start time for next question
		dispatch(setStartTime(Date.now()));

		// Move to next question
		if (!isLastQuestion) {
			dispatch(goToNextQuestion());
		} else {
			// All questions answered, show completion confirmation
			const answeredCount =
				Object.values(attempts).filter((a) => {
					const userAnswer = a.user_answer as any;
					return userAnswer?.user_answer != null;
				}).length + 1; // +1 for current question

			if (
				window.confirm(
					`You have completed ${answeredCount} of ${questions.length} questions. Submit for review?`
				)
			) {
				await handleSubmitSession();
			}
		}
	}, [
		dispatch,
		currentQuestion,
		sessionId,
		startTime,
		isLastQuestion,
		attempts,
		questions.length,
		handleSubmitSession,
	]);

	// Handle mark for review and next
	const handleMarkAndNext = useCallback(() => {
		if (!currentQuestion || !sessionId) return;

		dispatch(
			toggleMarkForReview({
				user_id: "user-id",
				session_id: sessionId,
				passage_id: currentQuestion.passage_id ?? null,
			})
		);

		// Reset start time for next question
		dispatch(setStartTime(Date.now()));

		if (!isLastQuestion) {
			dispatch(goToNextQuestion());
		}
	}, [dispatch, currentQuestion, sessionId, isLastQuestion]);

	const handlePreviousQuestion = useCallback(() => {
		if (!isFirstQuestion) {
			dispatch(goToPreviousQuestion());
		}
	}, [dispatch, isFirstQuestion]);

	const handleNextQuestion = useCallback(() => {
		if (!isLastQuestion) {
			dispatch(goToNextQuestion());
		}
	}, [dispatch, isLastQuestion]);

	const handleClearResponse = useCallback(() => {
		dispatch(clearResponse());
	}, [dispatch]);

	// Calculate progress
	const answeredCount = Object.values(attempts).filter((a) => {
		const userAnswer = a.user_answer as any;
		return userAnswer?.user_answer != null;
	}).length;
	const progress =
		questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

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
							Loading Daily RC Practice...
						</p>
					</div>
				</div>
			</div>
		);
	}

	const isExamMode = viewMode === "exam";

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
							Daily Practice: RC
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
				</div>
			</motion.header>

			{/* Main Content */}
			<div className="pt-16 h-screen flex overflow-hidden relative">
				{/* Split Pane Layout */}
				<div className="flex-1 h-full overflow-hidden transition-all duration-300">
					<SplitPaneLayout
						isDark={isDark}
						passage={currentPassage}
						showPassage={true}
						isExamMode={isExamMode}
					>
						{/* Question Panel */}
						{currentQuestion && (
							<QuestionPanel question={currentQuestion} isDark={isDark} />
						)}
					</SplitPaneLayout>
				</div>

				{/* Palette Toggle Button */}
				<motion.button
					onClick={() => setShowPalette(!showPalette)}
					className={`
                        absolute right-${
													showPalette ? "64" : "0"
												} top-1/2 -translate-y-1/2 z-40
                        w-8 h-16 rounded-l-lg border border-r-0
                        transition-all duration-300
                        ${
													isDark
														? "bg-bg-secondary-dark border-border-dark hover:bg-bg-tertiary-dark"
														: "bg-bg-secondary-light border-border-light hover:bg-bg-tertiary-light"
												}
                    `}
					style={{ right: showPalette ? "256px" : "0" }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
				>
					{showPalette ? (
						<MdChevronRight
							className={`w-5 h-5 mx-auto ${
								isDark
									? "text-text-secondary-dark"
									: "text-text-secondary-light"
							}`}
						/>
					) : (
						<MdChevronLeft
							className={`w-5 h-5 mx-auto ${
								isDark
									? "text-text-secondary-dark"
									: "text-text-secondary-light"
							}`}
						/>
					)}
				</motion.button>

				{/* Question Palette (Right Sidebar) */}
				<AnimatePresence>
					{showPalette && <QuestionPalette isDark={isDark} />}
				</AnimatePresence>
			</div>

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
				{isExamMode ? (
					// Exam Mode Footer
					<div className="px-6 py-4 flex items-center justify-between">
						{/* Left Section: Mark for Review and Next + Clear Response */}
						<div className="flex items-center gap-3">
							<motion.button
								onClick={handleMarkAndNext}
								className={`
                                    flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium border-2
                                    transition-all duration-200
                                    ${
																			isDark
																				? "border-brand-primary-dark text-brand-primary-dark hover:bg-brand-primary-dark/10"
																				: "border-brand-primary-light text-brand-primary-light hover:bg-brand-primary-light/10"
																		}
                                `}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								Mark for Review & Next
							</motion.button>
							<motion.button
								onClick={handleClearResponse}
								className={`
                                    px-4 py-2.5 rounded-lg font-medium border
                                    transition-all duration-200
                                    ${
																			isDark
																				? "border-border-dark text-text-secondary-dark hover:bg-bg-tertiary-dark"
																				: "border-border-light text-text-secondary-light hover:bg-bg-tertiary-light"
																		}
                                `}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								Clear Response
							</motion.button>
						</div>

						{/* Right Section: Save and Next + Submit */}
						<div className="flex items-center gap-3">
							<motion.button
								onClick={handleSaveAndNext}
								disabled={!selectedOption}
								className={`
                                    flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium
                                    transition-all duration-200
                                    ${
																			!selectedOption
																				? "opacity-50 cursor-not-allowed"
																				: isDark
																				? "bg-bg-tertiary-dark text-text-primary-dark hover:bg-bg-secondary-dark"
																				: "bg-bg-tertiary-light text-text-primary-light hover:bg-bg-secondary-light"
																		}
                                `}
								whileHover={selectedOption ? { scale: 1.02 } : {}}
								whileTap={selectedOption ? { scale: 0.98 } : {}}
							>
								Save & Next
								<MdArrowForward className="w-5 h-5" />
							</motion.button>
							<motion.button
								onClick={handleSubmitSession}
								className={`
                                    px-6 py-2.5 rounded-lg font-medium text-white
                                    transition-all duration-200
                                    ${
																			isDark
																				? "bg-brand-primary-dark hover:bg-brand-primary-hover-dark"
																				: "bg-brand-primary-light hover:bg-brand-primary-hover-light"
																		}
                                `}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								Submit
							</motion.button>
						</div>
					</div>
				) : (
					// Solution Mode Footer
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
							Previous
						</motion.button>

						{/* Center: Question Info */}
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

						{/* Right: Next Button */}
						<motion.button
							onClick={handleNextQuestion}
							disabled={isLastQuestion}
							className={`
                                flex items-center gap-2 px-6 py-3 rounded-xl font-medium
                                transition-all duration-200
                                ${
																	isLastQuestion
																		? "opacity-50 cursor-not-allowed"
																		: isDark
																		? "bg-brand-primary-dark text-white hover:bg-brand-primary-hover-dark"
																		: "bg-brand-primary-light text-white hover:bg-brand-primary-hover-light"
																}
                            `}
							whileHover={!isLastQuestion ? { scale: 1.02 } : {}}
							whileTap={!isLastQuestion ? { scale: 0.98 } : {}}
						>
							Next
							<MdArrowForward className="w-5 h-5" />
						</motion.button>
					</div>
				)}
			</motion.footer>
		</div>
	);
};

export default DailyRCPage;
