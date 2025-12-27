import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';
import { useTheme } from '../../../context/ThemeContext';
import { FloatingNavigation } from '../../../ui_components/FloatingNavigation';
import { FloatingThemeToggle } from '../../../ui_components/ThemeToggle';
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
    selectElapsedTime,
    incrementElapsedTime,
} from '../../redux_usecase/dailyPracticeSlice';
import { dailyRCData } from '../../mock_data/dailyMockData';
import { SplitPaneLayout } from './Component/SplitPaneLayout';
import { QuestionPalette } from '../../components/QuestionPalette';

const DailyRCPage: React.FC = () => {
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

    const passage = dailyRCData.passage;

    // Initialize session
    useEffect(() => {
        const initializeSession = async () => {
            setIsLoading(true);
            
            // Simulate data loading
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Initialize Redux with RC data
            dispatch({
                type: 'dailyPractice/initializeSession',
                payload: {
                    type: 'rc',
                    questions: dailyRCData.questions,
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
            const answeredCount = Object.values(attempts).filter(a => a.status === 'answered').length;
            if (answeredCount < questions.length) {
                if (window.confirm(`You have ${answeredCount} of ${questions.length} questions answered. Submit anyway?`)) {
                    dispatch(setViewMode('solution'));
                }
            } else {
                dispatch(setViewMode('solution'));
            }
        }
    }, [dispatch, isLastQuestion, attempts, questions.length]);

    const handlePreviousQuestion = useCallback(() => {
        if (!isFirstQuestion) {
            dispatch(goToPreviousQuestion());
        }
    }, [dispatch, isFirstQuestion]);

    const handleQuestionClick = useCallback((index: number) => {
        dispatch({
            type: 'dailyPractice/setCurrentQuestionIndex',
            payload: index,
        });
    }, [dispatch]);

    const handleToggleViewMode = useCallback(() => {
        dispatch(setViewMode(viewMode === 'exam' ? 'solution' : 'exam'));
    }, [dispatch, viewMode]);

    // Get passage content for current question
    const getPassageContent = useCallback(() => {
        if (!currentQuestion) return null;
        if (currentQuestion.passageId === passage.id) {
            return passage;
        }
        return passage;
    }, [currentQuestion, passage]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate progress
    const answeredCount = Object.values(attempts).filter(a => a.status === 'answered').length;
    const progress = (answeredCount / questions.length) * 100;

    if (isLoading) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-bg-primary-dark' : 'bg-bg-primary-light'}`}>
                <FloatingThemeToggle />
                <FloatingNavigation />
                <div className="flex items-center justify-center h-screen">
                    <div className="flex flex-col items-center gap-4">
                        <div className={`
                            w-16 h-16 rounded-full border-4 animate-spin
                            ${isDark ? 'border-brand-primary-dark border-t-transparent' : 'border-brand-primary-light border-t-transparent'}
                        `} />
                        <p className={isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}>
                            Loading Daily RC Practice...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const isExamMode = viewMode === 'exam';

    return (
        <div className={`min-h-screen ${isDark ? 'bg-bg-primary-dark' : 'bg-bg-primary-light'}`}>
            <FloatingThemeToggle />
            <FloatingNavigation />

            {/* Top Header */}
            <motion.header
                className={`
                    fixed top-0 left-0 right-0 z-30 h-16
                    backdrop-blur-xl border-b
                    ${isDark 
                        ? 'bg-bg-primary-dark/90 border-border-dark' 
                        : 'bg-bg-primary-light/90 border-border-light'
                    }
                `}
                initial={{ y: -60 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="h-full px-6 flex items-center justify-between">
                    {/* Left: Title and Progress */}
                    <div className="flex items-center gap-6">
                        <h1 className={`
                            font-serif font-bold text-xl
                            ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}
                        `}>
                            Daily Practice: RC
                        </h1>
                        
                        {/* Progress Bar */}
                        <div className="hidden md:flex items-center gap-3">
                            <div className={`
                                w-32 h-2 rounded-full overflow-hidden
                                ${isDark ? 'bg-bg-tertiary-dark' : 'bg-bg-tertiary-light'}
                            `}>
                                <motion.div
                                    className={`h-full ${isDark ? 'bg-brand-primary-dark' : 'bg-brand-primary-light'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                            <span className={`
                                text-sm font-medium
                                ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}
                            `}>
                                {answeredCount}/{questions.length}
                            </span>
                        </div>
                    </div>

                    {/* Center: Timer (hidden in solution mode) */}
                    {isExamMode && (
                        <div className={`
                            px-4 py-2 rounded-lg font-mono text-lg
                            ${isDark ? 'bg-bg-tertiary-dark text-text-primary-dark' : 'bg-bg-tertiary-light text-text-primary-light'}
                        `}>
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
                                ${isDark 
                                    ? 'border-border-dark hover:bg-bg-tertiary-dark' 
                                    : 'border-border-light hover:bg-bg-tertiary-light'
                                }
                            `}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className={`
                                text-sm font-medium
                                ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}
                            `}>
                                {showPalette ? 'Hide' : 'Show'} Palette
                            </span>
                        </motion.button>

                        {/* View Mode Toggle */}
                        <motion.button
                            onClick={handleToggleViewMode}
                            className={`
                                px-4 py-2 rounded-lg font-medium transition-colors
                                ${isDark 
                                    ? 'bg-brand-primary-dark text-white hover:bg-brand-primary-hover-dark' 
                                    : 'bg-brand-primary-light text-white hover:bg-brand-primary-hover-light'
                                }
                            `}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isExamMode ? 'View Solutions' : 'Back to Exam'}
                        </motion.button>
                    </div>
                </div>
            </motion.header>

            {/* Main Content */}
            <div className="pt-16 h-screen flex">
                {/* Split Pane Layout */}
                <div className="flex-1 h-full">
                    <SplitPaneLayout
                        isDark={isDark}
                        passage={getPassageContent()}
                        showPassage={true}
                        isExamMode={isExamMode}
                    >
                        {/* Question Panel */}
                        <QuestionPanel
                            question={currentQuestion!}
                            isDark={isDark}
                            passageContent={passage.content}
                        />
                    </SplitPaneLayout>
                </div>

                {/* Question Palette (Right Sidebar) */}
                <AnimatePresence>
                    {showPalette && (
                        <QuestionPalette
                            isDark={isDark}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Navigation Footer */}
            <motion.footer
                className={`
                    fixed bottom-0 left-0 right-0 z-30
                    backdrop-blur-xl border-t
                    ${isDark 
                        ? 'bg-bg-primary-dark/90 border-border-dark' 
                        : 'bg-bg-primary-light/90 border-border-light'
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
                            ${isFirstQuestion 
                                ? 'opacity-50 cursor-not-allowed'
                                : isDark 
                                    ? 'bg-bg-tertiary-dark text-text-primary-dark hover:bg-bg-secondary-dark' 
                                    : 'bg-bg-tertiary-light text-text-primary-light hover:bg-bg-secondary-light'
                            }
                        `}
                        whileHover={!isFirstQuestion ? { scale: 1.02 } : {}}
                        whileTap={!isFirstQuestion ? { scale: 0.98 } : {}}
                    >
                        <MdArrowBack className="w-5 h-5" />
                        Previous
                    </motion.button>

                    {/* Center: Question Indicator */}
                    <div className="flex items-center gap-2">
                        {questions.map((q, index) => (
                            <motion.button
                                key={q.id}
                                onClick={() => handleQuestionClick(index)}
                                className={`
                                    w-10 h-10 rounded-lg font-medium text-sm
                                    transition-all duration-200
                                    ${index === currentQuestionIndex 
                                        ? isDark 
                                            ? 'bg-brand-primary-dark text-white' 
                                            : 'bg-brand-primary-light text-white'
                                        : attempts[q.id]?.status === 'answered'
                                            ? isDark ? 'bg-success/80 text-white' : 'bg-success text-white'
                                            : attempts[q.id]?.status === 'skipped'
                                                ? isDark ? 'bg-error/80 text-white' : 'bg-error text-white'
                                                : attempts[q.id]?.status === 'marked_for_review'
                                                    ? isDark ? 'bg-info/80 text-white' : 'bg-info text-white'
                                                    : isDark 
                                                        ? 'bg-bg-tertiary-dark text-text-muted-dark' 
                                                        : 'bg-bg-tertiary-light text-text-muted-light'
                                    }
                                `}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {index + 1}
                            </motion.button>
                        ))}
                    </div>

                    {/* Right: Next/Submit Button */}
                    <motion.button
                        onClick={isLastQuestion ? handleToggleViewMode : handleNextQuestion}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-xl font-medium
                            transition-all duration-200
                            ${isDark 
                                ? 'bg-brand-primary-dark text-white hover:bg-brand-primary-hover-dark' 
                                : 'bg-brand-primary-light text-white hover:bg-brand-primary-hover-light'
                            }
                        `}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isLastQuestion ? (
                            <>
                                {isExamMode ? 'View Solutions' : 'Next'}
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

export default DailyRCPage;
