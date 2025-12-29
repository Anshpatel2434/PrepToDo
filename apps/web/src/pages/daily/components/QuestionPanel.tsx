import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import type { DailyQuestion, Option } from '../../../types';
import {
    selectSelectedOption,
    selectViewMode,
    selectSolutionViewType,
    setSelectedOption,
    submitAnswer,
    toggleMarkForReview,
} from '../redux_usecase/dailyPracticeSlice';
import { ConfidenceSelector } from './ConfidenceSelector';
import { SolutionToggle } from './SolutionToggle';

interface QuestionPanelProps {
    question: DailyQuestion;
    isDark: boolean;
}

export const QuestionPanel: React.FC<QuestionPanelProps> = ({ 
    question, 
    isDark, 
}) => {
    const dispatch = useDispatch();
    const viewMode = useSelector(selectViewMode);
    const solutionViewType = useSelector(selectSolutionViewType);
    const selectedOption = useSelector(selectSelectedOption);
    const isExamMode = viewMode === 'exam';

    // For para jumble and odd one out
    const [jumbleSequence, setJumbleSequence] = useState('');

    const handleOptionSelect = useCallback((optionId: string) => {
        if (!isExamMode) return;
        dispatch(setSelectedOption(optionId));
    }, [dispatch, isExamMode]);

    const handleSubmit = useCallback(() => {
        dispatch(submitAnswer({
            user_id: 'user-id', // TODO: Get from auth context
            session_id: 'session-id', // TODO: Get from session
            passage_id: question.passageId ?? null,
            correct_answer: question.correctAnswer,
        }));
    }, [dispatch, question]);

    const handleMarkForReview = useCallback(() => {
        dispatch(toggleMarkForReview({
            user_id: 'user-id', // TODO: Get from auth context
            session_id: 'session-id', // TODO: Get from session
            passage_id: question.passageId ?? null,
        }));
    }, [dispatch, question]);

    const getOptionClass = (option: Option) => {
        const isSelected = selectedOption === option.id;
        const isCorrect = question.correctAnswer === option.id;
        const showResult = !isExamMode;

        if (isExamMode) {
            return `
                w-full p-4 rounded-xl border-2 text-left transition-all duration-200
                ${isSelected 
                    ? isDark 
                        ? 'bg-brand-primary-dark/20 border-brand-primary-dark text-text-primary-dark' 
                        : 'bg-brand-primary-light/10 border-brand-primary-light text-text-primary-light'
                    : isDark 
                        ? 'bg-bg-tertiary-dark border-border-dark hover:border-brand-primary-dark text-text-secondary-dark' 
                        : 'bg-bg-tertiary-light border-border-light hover:border-brand-primary-light text-text-secondary-light'
                }
                ${isSelected ? 'ring-2 ring-brand-accent-light' : ''}
            `;
        }

        // Solution mode
        if (showResult) {
            if (isCorrect) {
                return `
                    w-full p-4 rounded-xl border-2 text-left
                    ${isDark ? 'bg-success/20 border-success text-success' : 'bg-success/10 border-success text-success'}
                `;
            }
            if (isSelected && !isCorrect) {
                return `
                    w-full p-4 rounded-xl border-2 text-left
                    ${isDark ? 'bg-error/20 border-error text-error' : 'bg-error/10 border-error text-error'}
                `;
            }
            return `
                w-full p-4 rounded-xl border-2 text-left
                ${isDark ? 'bg-bg-tertiary-dark border-border-dark text-text-muted-dark' : 'bg-bg-tertiary-light border-border-light text-text-muted-light'}
            `;
        }

        return '';
    };

    const renderStandardOptions = (options: Option[]) => (
        <div className="space-y-3">
            {options.map((option, index) => (
                <motion.button
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    className={getOptionClass(option)}
                    disabled={!isExamMode}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={isExamMode ? { scale: 1.01 } : {}}
                    whileTap={isExamMode ? { scale: 0.99 } : {}}
                >
                    <div className="flex items-start gap-3">
                        <span className={`
                            w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-sm shrink-0
                            ${isExamMode 
                                ? selectedOption === option.id
                                    ? isDark ? 'bg-brand-primary-dark text-white' : 'bg-brand-primary-light text-white'
                                    : isDark ? 'bg-bg-secondary-dark text-text-muted-dark' : 'bg-bg-secondary-light text-text-muted-light'
                                : ''
                            }
                            ${!isExamMode && question.correctAnswer === option.id 
                                ? isDark ? 'bg-success text-white' : 'bg-success text-white'
                                : ''
                            }
                            ${!isExamMode && selectedOption === option.id && question.correctAnswer !== option.id
                                ? isDark ? 'bg-error text-white' : 'bg-error text-white'
                                : ''
                            }
                        `}>
                            {option.id}
                        </span>
                        <span className="flex-1">{option.text}</span>
                    </div>
                </motion.button>
            ))}
        </div>
    );

    const renderParaJumble = () => (
        <div className="space-y-4">
            <div className={`
                p-4 rounded-xl border
                ${isDark ? 'bg-bg-tertiary-dark border-border-dark' : 'bg-bg-tertiary-light border-border-light'}
            `}>
                <p className={`
                    text-sm font-medium mb-3
                    ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}
                `}>
                    Jumbled Sentences (1-4):
                </p>
                <div className="space-y-2">
                    {question.sentences?.map((sentence, index) => (
                        <div
                            key={index}
                            className={`
                                p-3 rounded-lg border
                                ${isDark ? 'bg-bg-secondary-dark border-border-dark' : 'bg-bg-secondary-light border-border-light'}
                            `}
                        >
                            <span className={`
                                inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium mr-2
                                ${isDark ? 'bg-bg-tertiary-dark text-text-muted-dark' : 'bg-bg-tertiary-light text-text-muted-light'}
                            `}>
                                {index + 1}
                            </span>
                            {sentence}
                        </div>
                    ))}
                </div>
            </div>

            {isExamMode ? (
                <div className="space-y-3">
                    <label className={`
                        block text-sm font-medium
                        ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}
                    `}>
                        Enter your sequence (e.g., 2143):
                    </label>
                    <input
                        type="text"
                        value={jumbleSequence}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^1-4]/g, '');
                            if (value.length <= 4) {
                                setJumbleSequence(value);
                                dispatch(setSelectedOption(value));
                            }
                        }}
                        placeholder="Enter 4 digit sequence"
                        maxLength={4}
                        className={`
                            w-full p-4 rounded-xl border-2 text-center text-xl tracking-widest font-mono
                            focus:outline-none focus:ring-2 focus:ring-brand-primary-light
                            ${isDark 
                                ? 'bg-bg-tertiary-dark border-border-dark text-text-primary-dark placeholder-text-muted-dark' 
                                : 'bg-bg-tertiary-light border-border-light text-text-primary-light placeholder-text-muted-light'
                            }
                        `}
                    />
                    <p className={`
                        text-xs
                        ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}
                    `}>
                        Enter the order (1-4) in which sentences should appear
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className={`
                        text-sm font-medium
                        ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}
                    `}>
                        Your Answer: <span className="font-mono">{jumbleSequence || selectedOption || '-'}</span>
                    </p>
                    <p className={`
                        text-sm font-medium
                        ${isDark ? 'text-success' : 'text-success'}
                    `}>
                        Correct Answer: <span className="font-mono">{question.correctAnswer}</span>
                    </p>
                </div>
            )}
        </div>
    );

    const renderOddOneOut = () => (
        <div className="space-y-4">
            <p className={`
                text-sm font-medium mb-3
                ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}
            `}>
                Select the sentence that does NOT belong:
            </p>
            <div className="space-y-3">
                {question.sentences?.map((sentence, index) => {
                    const optionId = ['A', 'B', 'C', 'D'][index] as string;
                    const isSelected = selectedOption === optionId;
                    const isCorrect = question.correctAnswer === optionId;
                    const showResult = !isExamMode;

                    let optionClass = `
                        w-full p-4 rounded-xl border-2 text-left transition-all duration-200
                    `;

                    if (isExamMode) {
                        optionClass += isSelected 
                            ? isDark 
                                ? 'bg-brand-primary-dark/20 border-brand-primary-dark' 
                                : 'bg-brand-primary-light/10 border-brand-primary-light'
                            : isDark 
                                ? 'bg-bg-tertiary-dark border-border-dark hover:border-brand-primary-dark' 
                                : 'bg-bg-tertiary-light border-border-light hover:border-brand-primary-light';
                    } else if (showResult) {
                        if (isCorrect) {
                            optionClass += isDark ? 'bg-success/20 border-success' : 'bg-success/10 border-success';
                        } else if (isSelected && !isCorrect) {
                            optionClass += isDark ? 'bg-error/20 border-error' : 'bg-error/10 border-error';
                        } else {
                            optionClass += isDark ? 'bg-bg-tertiary-dark border-border-dark' : 'bg-bg-tertiary-light border-border-light';
                        }
                    }

                    return (
                        <motion.button
                            key={optionId}
                            onClick={() => handleOptionSelect(optionId)}
                            className={optionClass}
                            disabled={!isExamMode}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={isExamMode ? { scale: 1.01 } : {}}
                            whileTap={isExamMode ? { scale: 0.99 } : {}}
                        >
                            <div className="flex items-start gap-3">
                                <span className={`
                                    w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-sm shrink-0
                                    ${isExamMode 
                                        ? isSelected 
                                            ? isDark ? 'bg-brand-primary-dark text-white' : 'bg-brand-primary-light text-white'
                                            : isDark ? 'bg-bg-secondary-dark text-text-muted-dark' : 'bg-bg-secondary-light text-text-muted-light'
                                        : ''
                                    }
                                    ${!isExamMode && isCorrect 
                                        ? isDark ? 'bg-success text-white' : 'bg-success text-white'
                                        : ''
                                    }
                                    ${!isExamMode && isSelected && !isCorrect
                                        ? isDark ? 'bg-error text-white' : 'bg-error text-white'
                                        : ''
                                    }
                                `}>
                                    {optionId}
                                </span>
                                <span className="flex-1">{sentence}</span>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );

    const renderSolutionContent = () => {
        const rationale = solutionViewType === 'personalized' 
            ? question.personalizedRationale 
            : question.rationale;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                    mt-6 p-6 rounded-xl border
                    ${isDark ? 'bg-bg-secondary-dark border-border-dark' : 'bg-bg-secondary-light border-border-light'}
                `}
            >
                <div className="flex items-center justify-between mb-4">
                    <h4 className={`
                        font-semibold
                        ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}
                    `}>
                        {solutionViewType === 'personalized' ? 'AI Insight' : 'Common Solution'}
                    </h4>
                    <SolutionToggle 
                        hasPersonalizedRationale={!!question.personalizedRationale}
                        isDark={isDark}
                    />
                </div>
                <p className={`
                    leading-relaxed
                    ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}
                `}>
                    {rationale}
                </p>

                {/* Analysis Panel */}
                <div className={`
                    mt-6 pt-4 border-t space-y-3
                    ${isDark ? 'border-border-dark' : 'border-border-light'}
                `}>
                    <h5 className={`
                        text-sm font-semibold uppercase tracking-wide
                        ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}
                    `}>
                        Analysis
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`
                            p-3 rounded-lg
                            ${isDark ? 'bg-bg-tertiary-dark' : 'bg-bg-tertiary-light'}
                        `}>
                            <p className={`
                                text-xs
                                ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}
                            `}>
                                Difficulty
                            </p>
                            <p className={`
                                font-semibold capitalize
                                ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}
                            `}>
                                {question.difficulty || 'Medium'}
                            </p>
                        </div>
                        {question.tags && question.tags.length > 0 && (
                            <div className={`
                                p-3 rounded-lg
                                ${isDark ? 'bg-bg-tertiary-dark' : 'bg-bg-tertiary-light'}
                            `}>
                                <p className={`
                                    text-xs
                                    ${isDark ? 'text-text-muted-dark' : 'text-text-muted-light'}
                                `}>
                                    Topics
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {question.tags.slice(0, 2).map(tag => (
                                        <span
                                            key={tag}
                                            className={`
                                                text-xs px-2 py-0.5 rounded
                                                ${isDark ? 'bg-brand-primary-dark/30 text-brand-primary-dark' : 'bg-brand-primary-light/20 text-brand-primary-light'}
                                            `}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className={`
            h-full overflow-y-auto
            ${isDark ? 'scrollbar-dark' : 'scrollbar-light'}
        `}>
            <div className="p-6 space-y-6">
                {/* Question Type Badge */}
                <div className="flex items-center gap-2">
                    <span className={`
                        px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide
                        ${isDark 
                            ? 'bg-brand-primary-dark/30 text-brand-primary-dark' 
                            : 'bg-brand-primary-light/20 text-brand-primary-light'
                        }
                    `}>
                        {question.questionType === 'rc_question' ? 'Reading Comprehension' :
                         question.questionType === 'para_summary' ? 'Para Summary' :
                         question.questionType === 'para_jumble' ? 'Para Jumble (TITA)' :
                         question.questionType === 'odd_one_out' ? 'Odd One Out' :
                         question.questionType === 'para_completion' ? 'Para Completion' : 'Question'}
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

                {/* Question Text */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3 className={`
                        text-lg font-semibold leading-relaxed
                        ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}
                    `}>
                        {question.questionText}
                    </h3>
                </motion.div>

                {/* Options or Special Input */}
                {question.questionType === 'para_jumble' && renderParaJumble()}
                {question.questionType === 'odd_one_out' && renderOddOneOut()}
                {question.questionType !== 'para_jumble' && question.questionType !== 'odd_one_out' && 
                    renderStandardOptions(question.options)}

                {/* Confidence Selector (Exam Mode Only) */}
                {isExamMode && (
                    <div className="pt-4">
                        <ConfidenceSelector isDark={isDark} />
                    </div>
                )}

                {/* Solution View */}
                {!isExamMode && renderSolutionContent()}

                {/* Action Buttons (Exam Mode Only) */}
                {isExamMode && (
                    <div className="flex gap-3 pt-4">
                        <motion.button
                            onClick={handleMarkForReview}
                            className={`
                                px-6 py-3 rounded-xl font-medium border-2 transition-all duration-200
                                ${isDark 
                                    ? 'border-brand-primary-dark text-brand-primary-dark hover:bg-brand-primary-dark/10' 
                                    : 'border-brand-primary-light text-brand-primary-light hover:bg-brand-primary-light/10'
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
                                ${isDark 
                                    ? 'bg-brand-primary-dark hover:bg-brand-primary-hover-dark' 
                                    : 'bg-brand-primary-light hover:bg-brand-primary-hover-light'
                                }
                            `}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Submit Answer
                        </motion.button>
                    </div>
                )}

                {/* Spacer for fixed footer */}
                <div className="h-24" />
            </div>
        </div>
    );
};

export default QuestionPanel;
