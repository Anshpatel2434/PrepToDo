import React from 'react';
import { motion } from 'framer-motion';
import type { DailyQuestion } from '../../../types';

interface VALayoutProps {
    isDark: boolean;
    question: DailyQuestion;
    isExamMode: boolean;
    children: React.ReactNode;
}

export const VALayout: React.FC<VALayoutProps> = ({
    isDark,
    question,
    isExamMode,
    children,
}) => {
    const getQuestionTypeLabel = (type: string) => {
        switch (type) {
            case 'para_summary':
                return 'Para Summary';
            case 'para_jumble':
                return 'Para Jumble (TITA)';
            case 'para_completion':
                return 'Para Completion';
            case 'odd_one_out':
                return 'Odd One Out';
            default:
                return 'Question';
        }
    };

    const getQuestionTypeDescription = (type: string) => {
        switch (type) {
            case 'para_summary':
                return 'Choose the best summary of the paragraph';
            case 'para_jumble':
                return 'Arrange the sentences in the correct order';
            case 'para_completion':
                return 'Complete the paragraph with the right choice';
            case 'odd_one_out':
                return 'Identify the sentence that does not belong';
            default:
                return '';
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Question Type Header */}
            <motion.div
                className={`
                    mb-6 p-4 rounded-xl border
                    ${isDark 
                        ? 'bg-bg-secondary-dark border-border-dark' 
                        : 'bg-bg-secondary-light border-border-light'
                    }
                `}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-3">
                    <span className={`
                        px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide
                        ${isDark 
                            ? 'bg-brand-primary-dark/30 text-brand-primary-dark' 
                            : 'bg-brand-primary-light/20 text-brand-primary-light'
                        }
                    `}>
                        {getQuestionTypeLabel(question.questionType)}
                    </span>
                    {question.difficulty && (
                        <span className={`
                            px-3 py-1 rounded-full text-xs font-medium capitalize
                            ${question.difficulty === 'easy' 
                                ? isDark ? 'bg-success/30 text-success' : 'bg-success/20 text-success'
                                : question.difficulty === 'medium'
                                    ? isDark ? 'bg-warning/30 text-warning' : 'bg-warning/20 text-warning'
                                    : isDark ? 'bg-error/30 text-error' : 'bg-error/20 text-error'
                            }
                        `}>
                            {question.difficulty}
                        </span>
                    )}
                </div>
                <p className={`
                    mt-2 text-sm
                    ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}
                `}>
                    {getQuestionTypeDescription(question.questionType)}
                </p>
            </motion.div>

            {/* Question Card */}
            <motion.div
                className={`
                    rounded-2xl border p-8 shadow-sm
                    ${isDark 
                        ? 'bg-bg-secondary-dark border-border-dark' 
                        : 'bg-bg-secondary-light border-border-light'
                    }
                `}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                {/* Question Text */}
                <div className="mb-8">
                    <h2 className={`
                        text-xl font-semibold leading-relaxed
                        ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}
                    `}>
                        {question.questionText}
                    </h2>
                </div>

                {/* Question Content */}
                <div className={isExamMode ? 'select-none' : ''}>
                    {children}
                </div>
            </motion.div>

            {/* Copy Protection Notice (Exam Mode) */}
            {isExamMode && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className={`
                        mt-4 text-center text-xs
                        ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}
                    `}
                >
                    Text selection is disabled during the exam
                </motion.div>
            )}
        </div>
    );
};

export default VALayout;
