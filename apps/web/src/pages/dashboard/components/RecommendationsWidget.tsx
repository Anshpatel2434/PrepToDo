import React from "react";
import { LuSparkles } from "react-icons/lu";
import type { UserProficiencySignals } from "../../../types";

interface RecommendationsWidgetProps {
    signals?: UserProficiencySignals;
    isDark: boolean;
}

export const RecommendationsWidget: React.FC<RecommendationsWidgetProps> = ({ signals, isDark }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
                <LuSparkles className="w-5 h-5 text-purple-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-500">
                    AI Insights (Developing)
                </span>
            </div>
            
            {signals ? (
                <div className="space-y-4 flex-1">
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-500/5 border-purple-500/10'} border`}>
                        <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Recommended Focus
                        </h4>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Practice <span className="text-purple-500 font-medium">{signals.weak_topics?.[0] || 'Philosophy'}</span> passages 
                            at <span className="text-purple-500 font-medium">{signals.recommended_difficulty || 'medium'}</span> difficulty 
                            to improve your overall accuracy.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                            <div className="text-[10px] uppercase text-gray-500 mb-1">Target Percentile</div>
                            <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {signals.estimated_cat_percentile || '--'}
                            </div>
                        </div>
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                            <div className="text-[10px] uppercase text-gray-500 mb-1">Data Points</div>
                            <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {signals.data_points_count || 0}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-center p-6">
                    <p className="text-sm text-gray-500 italic">
                        Complete more sessions to unlock personalized AI recommendations.
                    </p>
                </div>
            )}
        </div>
    );
};
