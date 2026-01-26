import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectAttempts, selectQuestionOrder } from "../redux_usecase/customizedMockSlice";
import { ScoreCard } from "./ScoreCard";
import { TimeDistributionChart } from "./TimeDistributionChart";
import type { Question } from "../../../types";

interface MockAnalysisViewProps {
    isDark: boolean;
    questions: Question[];
}

export const MockAnalysisView: React.FC<MockAnalysisViewProps> = ({ isDark, questions }) => {
    const attempts = useSelector(selectAttempts);
    const questionOrder = useSelector(selectQuestionOrder);

    // Recalculate scores with question type information
    const refinedAnalysisData = useMemo(() => {
        let correctCount = 0;
        let incorrectCount = 0;
        let unattemptedCount = 0;
        let correctMarks = 0;
        let incorrectMarks = 0;
        let timeOnCorrect = 0;
        let timeOnIncorrect = 0;
        let timeOnUnattempted = 0;

        // Create a map of questions by ID for quick lookup
        const questionMap = new Map(questions.map(q => [q.id, q]));

        questionOrder.forEach(questionId => {
            const attempt = attempts[questionId];
            const question = questionMap.get(questionId);
            if (!attempt || !question) return;

            const timeSpent = attempt.time_spent_seconds || 0;

            // Check if question was attempted by looking at user_answer field
            const userAnswer = attempt.user_answer as { user_answer: unknown } | null;
            const isAttempted = userAnswer && userAnswer.user_answer != null;

            if (!isAttempted) {
                // Unattempted
                unattemptedCount++;
                timeOnUnattempted += timeSpent;
            } else if (attempt.is_correct) {
                // Correct
                correctCount++;
                correctMarks += 3;
                timeOnCorrect += timeSpent;
            } else {
                // Incorrect - check question type for negative marking
                incorrectCount++;

                // No negative marking for odd_one_out and para_jumbles
                const questionType = question.question_type;
                if (questionType === "odd_one_out" || questionType === "para_jumble") {
                    // No negative marking (0 marks)
                    incorrectMarks += 0;
                } else {
                    // -1 mark for other question types
                    incorrectMarks -= 1;
                }
                timeOnIncorrect += timeSpent;
            }
        });

        const totalQuestions = questionOrder.length;
        const totalMarks = totalQuestions * 3;
        const scoredMarks = correctMarks + incorrectMarks;
        const percentage = totalMarks > 0 ? Math.round((scoredMarks / totalMarks) * 100) : 0;

        const totalTime = timeOnCorrect + timeOnIncorrect + timeOnUnattempted;
        const timeOnCorrectPercent = totalTime > 0 ? Math.round((timeOnCorrect / totalTime) * 100) : 0;
        const timeOnIncorrectPercent = totalTime > 0 ? Math.round((timeOnIncorrect / totalTime) * 100) : 0;
        const timeOnUnattemptedPercent = totalTime > 0 ? Math.round((timeOnUnattempted / totalTime) * 100) : 0;

        return {
            correctCount,
            incorrectCount,
            unattemptedCount,
            correctMarks,
            incorrectMarks,
            totalMarks,
            scoredMarks,
            percentage,
            timeDistribution: {
                correct: timeOnCorrect,
                incorrect: timeOnIncorrect,
                unattempted: timeOnUnattempted,
                total: totalTime,
            },
            timeDistributionPercent: {
                correct: timeOnCorrectPercent,
                incorrect: timeOnIncorrectPercent,
                unattempted: timeOnUnattemptedPercent,
            },
        };
    }, [attempts, questionOrder, questions]);

    return (
        <div
            className={`h-full overflow-y-auto p-6 ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
                }`}
        >
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1
                        className={`text-3xl font-bold mb-2 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                            }`}
                    >
                        Test Analysis
                    </h1>
                    <p
                        className={`text-sm ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                            }`}
                    >
                        Review your performance and time management
                    </p>
                </div>

                {/* Analysis Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ScoreCard
                        correctCount={refinedAnalysisData.correctCount}
                        incorrectCount={refinedAnalysisData.incorrectCount}
                        unattemptedCount={refinedAnalysisData.unattemptedCount}
                        correctMarks={refinedAnalysisData.correctMarks}
                        incorrectMarks={refinedAnalysisData.incorrectMarks}
                        totalMarks={refinedAnalysisData.totalMarks}
                        scoredMarks={refinedAnalysisData.scoredMarks}
                        percentage={refinedAnalysisData.percentage}
                        isDark={isDark}
                    />

                    <TimeDistributionChart
                        timeDistribution={refinedAnalysisData.timeDistribution}
                        timeDistributionPercent={refinedAnalysisData.timeDistributionPercent}
                        isDark={isDark}
                    />
                </div>
            </div>
        </div>
    );
};
