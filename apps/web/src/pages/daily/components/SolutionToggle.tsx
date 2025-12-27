import React from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { selectSolutionViewType, setSolutionViewType } from '../../redux_usecase/dailyPracticeSlice';

interface SolutionToggleProps {
    hasPersonalizedRationale: boolean;
    isDark: boolean;
}

export const SolutionToggle: React.FC<SolutionToggleProps> = ({ hasPersonalizedRationale, isDark }) => {
    const dispatch = useDispatch();
    const solutionViewType = useSelector(selectSolutionViewType);

    return (
        <div className={`
            flex items-center gap-1 p-1 rounded-xl
            ${isDark ? 'bg-bg-tertiary-dark' : 'bg-bg-tertiary-light'}
        `}>
            <motion.button
                onClick={() => dispatch(setSolutionViewType('common'))}
                className={`
                    px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${solutionViewType === 'common' 
                        ? isDark 
                            ? 'bg-brand-primary-dark text-white shadow-lg' 
                            : 'bg-brand-primary-light text-white shadow-lg'
                        : isDark 
                            ? 'text-text-muted-dark hover:text-text-primary-dark' 
                            : 'text-text-muted-light hover:text-text-primary-light'
                    }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                Common Solution
            </motion.button>
            
            {hasPersonalizedRationale && (
                <motion.button
                    onClick={() => dispatch(setSolutionViewType('personalized'))}
                    className={`
                        px-4 py-2 rounded-lg text-sm font-medium
                        transition-all duration-200
                        ${solutionViewType === 'personalized' 
                            ? isDark 
                                ? 'bg-brand-primary-dark text-white shadow-lg' 
                                : 'bg-brand-primary-light text-white shadow-lg'
                            : isDark 
                                ? 'text-text-muted-dark hover:text-text-primary-dark' 
                                : 'text-text-muted-light hover:text-text-primary-light'
                        }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    AI Insights
                </motion.button>
            )}
        </div>
    );
};

export default SolutionToggle;
