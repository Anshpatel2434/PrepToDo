import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DailyExamContextType {
    todayExamId: string | null;
    setTodayExamId: (examId: string | null) => void;
}

const DailyExamContext = createContext<DailyExamContextType | undefined>(undefined);

export const DailyExamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [todayExamId, setTodayExamId] = useState<string | null>(null);

    return (
        <DailyExamContext.Provider value={{ todayExamId, setTodayExamId }}>
            {children}
        </DailyExamContext.Provider>
    );
};

export const useDailyExam = () => {
    const context = useContext(DailyExamContext);
    if (context === undefined) {
        throw new Error('useDailyExam must be used within a DailyExamProvider');
    }
    return context;
};