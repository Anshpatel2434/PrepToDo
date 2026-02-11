import type { FC } from 'react';
import { Calendar, Clock, Trophy } from 'lucide-react';

interface Session {
    id: string;
    correct_answers: number;
    total_questions: number;
    created_at: string;
    time_spent_seconds: number;
}

interface SessionTimelineProps {
    sessions: Session[];
}

export const SessionTimeline: FC<SessionTimelineProps> = ({ sessions }) => {
    if (sessions.length === 0) {
        return <div className="text-center py-8 text-[#64748b]">No sessions recorded yet.</div>;
    }

    return (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:bg-gradient-to-b before:from-[#2a2d3a] before:via-[#2a2d3a] before:to-transparent lg:before:ml-[25px]">
            {sessions.map((session) => (
                <div key={session.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[#2a2d3a] bg-[#1a1d27] text-indigo-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Trophy className="h-5 w-5" />
                    </div>
                    {/* Content Layer */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-[#2a2d3a] bg-[#1a1d27] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-bold text-white">Score: {session.correct_answers}/{session.total_questions}</div>
                            <time className="text-xs font-medium text-indigo-400">{new Date(session.created_at).toLocaleDateString()}</time>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-[#94a3b8]">
                            <div className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                {Math.round(session.time_spent_seconds / 60)} min
                            </div>
                            <div className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
