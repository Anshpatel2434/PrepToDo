import React from "react";
import { motion } from "framer-motion";

interface SocialData {
    peersPracticed: number;
    studyGroupsAvailable: boolean;
    progressComparisonSoon: boolean;
}

interface SocialPreviewProps {
    data: SocialData;
}

export const SocialPreview: React.FC<SocialPreviewProps> = ({ data }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-bg-secondary-light dark:bg-bg-secondary-dark border border-border-light dark:border-border-dark rounded-xl p-6"
        >
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2 flex items-center">
                    <span className="mr-2">👥</span>
                    Study Community
                </h2>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Connect with fellow learners and stay motivated together
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Peers Practiced Today */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-bg-primary-light dark:bg-bg-primary-dark rounded-lg p-4 text-center border border-border-lighter dark:border-border-darker"
                >
                    <div className="text-2xl mb-2">📚</div>
                    <div className="text-2xl font-bold text-brand-primary-light dark:text-brand-primary-dark mb-1">
                        {data.peersPracticed}
                    </div>
                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        peers practiced today
                    </div>
                    <div className="mt-2 text-xs text-text-muted-light dark:text-text-muted-dark">
                        You're not studying alone!
                    </div>
                </motion.div>

                {/* Study Groups Coming Soon */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-bg-primary-light dark:bg-bg-primary-dark rounded-lg p-4 text-center border border-border-lighter dark:border-border-darker"
                >
                    <div className="text-2xl mb-2">👥</div>
                    <div className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                        Study Groups
                    </div>
                    <div className="text-sm text-brand-accent-light dark:text-brand-accent-dark font-medium mb-1">
                        Coming Soon
                    </div>
                    <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
                        Join virtual study sessions with peers at your level
                    </div>
                </motion.div>

                {/* Progress Comparison */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="bg-bg-primary-light dark:bg-bg-primary-dark rounded-lg p-4 text-center border border-border-lighter dark:border-border-darker"
                >
                    <div className="text-2xl mb-2">📊</div>
                    <div className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                        Compare Progress
                    </div>
                    <div className="text-sm text-brand-accent-light dark:text-brand-accent-dark font-medium mb-1">
                        Coming Soon
                    </div>
                    <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
                        See how you're doing compared to similar learners
                    </div>
                </motion.div>
            </div>

            {/* Motivational Message */}
            <div className="mt-6 p-4 bg-gradient-to-r from-brand-primary-light/10 to-brand-secondary-light/10 dark:from-brand-primary-dark/10 dark:to-brand-secondary-dark/10 rounded-lg border border-brand-primary-light/20 dark:border-brand-primary-dark/20">
                <div className="text-center">
                    <div className="text-lg mb-2">🌟</div>
                    <h4 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                        Stay Connected, Stay Motivated
                    </h4>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        Learning is better together. Soon you'll be able to share progress, 
                        join study groups, and learn from peers who understand your journey.
                    </p>
                </div>
            </div>

            {/* Preview Notice */}
            <div className="mt-4 text-center">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-info/10 border border-info/30">
                    <span className="text-xs text-info font-medium">
                        ℹ️ These features are preview content - full implementation coming soon
                    </span>
                </div>
            </div>
        </motion.div>
    );
};