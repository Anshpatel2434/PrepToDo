// Daily Practice Module Exports

// Redux
export { 
    default as dailyPracticeReducer,
} from './redux_usecase/dailyPracticeSlice';

// Mock Data
export { 
    dailyRCData, 
    dailyVAData, 
    dailyPracticeData,
    getQuestionById,
    getPassageForQuestion,
    rcQuestions,
    paraSummaryQuestion,
    paraJumbleQuestion,
    paraCompletionQuestion,
    oddOneOutQuestion,
} from './mock_data/dailyMockData';

// Shared Components
export { default as QuestionPalette } from './components/QuestionPalette';
export { default as ConfidenceSelector } from './components/ConfidenceSelector';
export { default as SolutionToggle } from './components/SolutionToggle';
export { default as QuestionPanel } from './components/QuestionPanel';

// RC Components
export { default as SplitPaneLayout } from './daily_rc/Component/SplitPaneLayout';
export { default as DailyRCPage } from './daily_rc/Page/DailyRCPage';

// VA Components
export { default as VALayout } from './daily_va/Component/VALayout';
export { default as DailyVAPage } from './daily_va/Page/DailyVAPage';
