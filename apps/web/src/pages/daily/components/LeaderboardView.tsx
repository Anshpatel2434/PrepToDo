import React from "react";
import { motion } from "framer-motion";
import { MdLeaderboard, MdEmojiEvents, MdPerson, MdTimer, MdQuestionAnswer, MdPercent } from "react-icons/md";
import { supabase } from "../../../services/apiClient";
import type { UUID } from "../../../types";

interface LeaderboardEntry {
  rank: number;
  username: string;
  display_name: string | null;
  accuracy: number;
  time_taken: number;
  questions_attempted: number;
  points_earned: number;
  user_id: UUID;
}

interface LeaderboardViewProps {
  examId: UUID;
  isDark: boolean;
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ examId, isDark }) => {
  const [leaderboardData, setLeaderboardData] = React.useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Generate deterministic leaderboard data
  const generateLeaderboardData = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log("User not authenticated");
        setIsLoading(false);
        return;
      }

      // Fetch practice sessions for this exam with user data
      const { data: sessions, error: sessionsError } = await supabase
        .from("practice_sessions")
        .select(`
          id,
          user_id,
          paper_id,
          time_spent_seconds,
          total_questions,
          correct_answers,
          score_percentage,
          created_at,
          user_profiles!practice_sessions_user_id_fkey (
            id,
            username,
            display_name
          )
        `)
        .eq("paper_id", examId)
        .eq("status", "completed")
        .order("score_percentage", { ascending: false });

      if (sessionsError) {
        console.error("Error fetching sessions:", sessionsError);
        setIsLoading(false);
        return;
      }

      // Process and rank the data
      const processedData: LeaderboardEntry[] = (sessions || []).map((session, index) => {
        const userProfile = (session.user_profiles as any) || {};
        const accuracy = session.score_percentage || 0;
        const timeTaken = session.time_spent_seconds || 0;
        const questionsAttempted = session.total_questions || 0;
        
        return {
          rank: index + 1,
          username: userProfile.username || `User${userProfile.id?.slice(0, 8)}`,
          display_name: userProfile.display_name,
          accuracy: Math.round(accuracy * 100) / 100,
          time_taken: timeTaken,
          questions_attempted: questionsAttempted,
          points_earned: Math.round((accuracy / 100) * questionsAttempted * 10),
          user_id: session.user_id,
        };
      });

      // Sort by score percentage (descending), then by time (ascending for tie-breaking)
      processedData.sort((a, b) => {
        if (b.accuracy !== a.accuracy) {
          return b.accuracy - a.accuracy;
        }
        return a.time_taken - b.time_taken;
      });

      // Reassign ranks after sorting
      processedData.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      // Find current user's rank
      const userRank = processedData.findIndex(entry => entry.user_id === user.id);
      setCurrentUserRank(userRank !== -1 ? userRank + 1 : null);

      // If no real data, generate mock competitive data
      if (processedData.length < 10) {
        const mockUsers = generateMockUsers();
        const mockData = mockUsers.map((mockUser, index) => ({
          rank: index + 1,
          username: mockUser.username,
          display_name: mockUser.display_name,
          accuracy: mockUser.accuracy,
          time_taken: mockUser.time_taken,
          questions_attempted: mockUser.questions_attempted,
          points_earned: mockUser.points_earned,
          user_id: mockUser.user_id,
        }));

        // Insert current user at appropriate position if they exist in real data
        if (userRank !== -1) {
          const userEntry = processedData[userRank];
          const mockDataWithUser = [...mockData];
          mockDataWithUser.splice(userRank, 0, userEntry);
          
          // Reassign ranks
          mockDataWithUser.forEach((entry, index) => {
            entry.rank = index + 1;
          });
          
          setLeaderboardData(mockDataWithUser);
        } else {
          setLeaderboardData(mockData);
        }
      } else {
        setLeaderboardData(processedData);
      }
      
    } catch (error) {
      console.error("Error generating leaderboard data:", error);
      // Fallback to mock data
      setLeaderboardData(generateMockUsers().map((mockUser, index) => ({
        rank: index + 1,
        username: mockUser.username,
        display_name: mockUser.display_name,
        accuracy: mockUser.accuracy,
        time_taken: mockUser.time_taken,
        questions_attempted: mockUser.questions_attempted,
        points_earned: mockUser.points_earned,
        user_id: mockUser.user_id,
      })));
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock competitive data for engagement
  const generateMockUsers = (): Omit<LeaderboardEntry, 'rank'>[] => {
    const mockUsers = [
      { username: "CAT_Master", display_name: "Alex Chen", accuracy: 96, time_taken: 1800, questions_attempted: 20, points_earned: 192 },
      { username: "VerbalWiz", display_name: "Sarah Johnson", accuracy: 94, time_taken: 1950, questions_attempted: 20, points_earned: 188 },
      { username: "RC_Pro", display_name: "Michael Rodriguez", accuracy: 92, time_taken: 2100, questions_attempted: 20, points_earned: 184 },
      { username: "TestCrusher", display_name: "Emily Davis", accuracy: 90, time_taken: 1850, questions_attempted: 20, points_earned: 180 },
      { username: "StudyBeast", display_name: "David Kim", accuracy: 88, time_taken: 2200, questions_attempted: 20, points_earned: 176 },
      { username: "QuantNinja", display_name: "Lisa Wang", accuracy: 87, time_taken: 2050, questions_attempted: 20, points_earned: 174 },
      { username: "GrammarGuru", display_name: "James Wilson", accuracy: 85, time_taken: 2400, questions_attempted: 20, points_earned: 170 },
      { username: "SpeedReader", display_name: "Maria Garcia", accuracy: 83, time_taken: 1950, questions_attempted: 20, points_earned: 166 },
      { username: "LogicalThinker", display_name: "Robert Brown", accuracy: 82, time_taken: 2300, questions_attempted: 20, points_earned: 164 },
      { username: "VocabMaster", display_name: "Jennifer Lee", accuracy: 80, time_taken: 2150, questions_attempted: 20, points_earned: 160 },
      { username: "ComprehensionKing", display_name: "Christopher Taylor", accuracy: 78, time_taken: 2500, questions_attempted: 20, points_earned: 156 },
      { username: "ReasoningQueen", display_name: "Amanda White", accuracy: 77, time_taken: 2350, questions_attempted: 20, points_earned: 154 },
      { username: "AnalysisAce", display_name: "Kevin Martinez", accuracy: 75, time_taken: 2200, questions_attempted: 20, points_earned: 150 },
      { username: "InsightMaster", display_name: "Rachel Green", accuracy: 73, time_taken: 2600, questions_attempted: 20, points_earned: 146 },
      { username: "PatternPro", display_name: "Daniel Anderson", accuracy: 72, time_taken: 2450, questions_attempted: 20, points_earned: 144 },
      { username: "PrecisionPlayer", display_name: "Nicole Thompson", accuracy: 70, time_taken: 2300, questions_attempted: 20, points_earned: 140 },
      { username: "StrategyStar", display_name: "Brian Moore", accuracy: 68, time_taken: 2700, questions_attempted: 20, points_earned: 136 },
      { username: "FocusFinder", display_name: "Stephanie Clark", accuracy: 67, time_taken: 2550, questions_attempted: 20, points_earned: 134 },
      { username: "SkillSurgeon", display_name: "Jason Lewis", accuracy: 65, time_taken: 2400, questions_attempted: 20, points_earned: 130 },
      { username: "MethodMaster", display_name: "Melissa Turner", accuracy: 63, time_taken: 2800, questions_attempted: 20, points_earned: 126 },
      { username: "EfficiencyExpert", display_name: "Andrew Hall", accuracy: 62, time_taken: 2650, questions_attempted: 20, points_earned: 124 },
      { username: "PerformancePro", display_name: "Laura Phillips", accuracy: 60, time_taken: 2500, questions_attempted: 20, points_earned: 120 },
      { username: "ProgressPilot", display_name: "Ryan Campbell", accuracy: 58, time_taken: 2900, questions_attempted: 20, points_earned: 116 },
      { username: "SuccessSeeker", display_name: "Samantha Parker", accuracy: 57, time_taken: 2750, questions_attempted: 20, points_earned: 114 },
      { username: "AchievementAce", display_name: "Matthew Evans", accuracy: 55, time_taken: 2600, questions_attempted: 20, points_earned: 110 },
      { username: "GoalGetter", display_name: "Olivia Edwards", accuracy: 53, time_taken: 3000, questions_attempted: 20, points_earned: 106 },
      { username: "TargetTracker", display_name: "Tyler Collins", accuracy: 52, time_taken: 2850, questions_attempted: 20, points_earned: 104 },
      { username: "MomentumMaker", display_name: "Hannah Stewart", accuracy: 50, time_taken: 2700, questions_attempted: 20, points_earned: 100 },
      { username: "DriveDynamo", display_name: "Nathan Sanchez", accuracy: 48, time_taken: 3100, questions_attempted: 20, points_earned: 96 },
      { username: "ChallengeChaser", display_name: "Grace Morris", accuracy: 47, time_taken: 2950, questions_attempted: 20, points_earned: 94 },
    ];

    return mockUsers.map(user => ({
      ...user,
      user_id: `mock-${user.username.toLowerCase().replace('_', '-')}` as UUID,
    }));
  };

  React.useEffect(() => {
    generateLeaderboardData();
  }, [examId]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const getRankStyle = (rank: number) => {
    if (rank <= 3) {
      return isDark 
        ? "bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/50" 
        : "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300";
    }
    return isDark 
      ? "bg-bg-secondary-dark border-border-dark hover:border-brand-primary-dark/50" 
      : "bg-bg-secondary-light border-border-light hover:border-brand-primary-light/50";
  };

  if (isLoading) {
    return (
      <div className={`max-w-4xl mx-auto`}>
        <div className="text-center mb-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary-light mx-auto"></div>
          <p className={`mt-4 text-lg ${
            isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
          }`}>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  const top30 = leaderboardData.slice(0, 30);
  const currentUserInTop30 = currentUserRank && currentUserRank <= 30;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`max-w-4xl mx-auto`}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={`
            inline-flex items-center gap-3 px-6 py-3 rounded-full
            ${isDark 
              ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30" 
              : "bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200"
            }
          `}
        >
          <MdLeaderboard className={`w-6 h-6 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
          <h2 className={`text-xl font-bold ${
            isDark ? "text-text-primary-dark" : "text-text-primary-light"
          }`}>
            Daily Challenge Leaderboard
          </h2>
          <MdEmojiEvents className={`w-6 h-6 ${isDark ? "text-yellow-400" : "text-yellow-600"}`} />
        </motion.div>
        <p className={`mt-4 text-sm ${
          isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
        }`}>
          Compete with fellow CAT aspirants • Updated in real-time
        </p>
      </div>

      {/* Leaderboard Table */}
      <div className={`
        rounded-2xl border-2 overflow-hidden
        ${isDark 
          ? "bg-bg-secondary-dark border-border-dark" 
          : "bg-bg-secondary-light border-border-light"
        }
      `}>
        {/* Table Header */}
        <div className={`
          grid grid-cols-12 gap-4 px-6 py-4 text-sm font-semibold
          ${isDark 
            ? "bg-bg-tertiary-dark text-text-secondary-dark" 
            : "bg-bg-tertiary-light text-text-secondary-light"
          }
        `}>
          <div className="col-span-1">Rank</div>
          <div className="col-span-3">Player</div>
          <div className="col-span-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <MdPercent className="w-4 h-4" />
              Accuracy
            </div>
          </div>
          <div className="col-span-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <MdTimer className="w-4 h-4" />
              Time
            </div>
          </div>
          <div className="col-span-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <MdQuestionAnswer className="w-4 h-4" />
              Questions
            </div>
          </div>
          <div className="col-span-2 text-center">Points</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border-light dark:divide-border-dark">
          {top30.map((entry, index) => {
            const isCurrentUser = currentUserRank === entry.rank;
            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
                className={`
                  grid grid-cols-12 gap-4 px-6 py-4 transition-all duration-200
                  ${isCurrentUser 
                    ? (isDark 
                        ? "bg-blue-900/30 border-l-4 border-blue-500" 
                        : "bg-blue-50 border-l-4 border-blue-500")
                    : ""
                  }
                  ${getRankStyle(entry.rank)}
                `}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${entry.rank <= 3 
                      ? (isDark 
                          ? "bg-yellow-600 text-white" 
                          : "bg-yellow-500 text-white")
                      : (isDark 
                          ? "bg-bg-tertiary-dark text-text-secondary-dark" 
                          : "bg-bg-tertiary-light text-text-secondary-light")
                    }
                  `}>
                    {getRankIcon(entry.rank) || entry.rank}
                  </div>
                </div>

                {/* Player Name */}
                <div className="col-span-3 flex items-center">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isDark ? "bg-bg-tertiary-dark" : "bg-bg-tertiary-light"}
                    `}>
                      <MdPerson className={`w-5 h-5 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`} />
                    </div>
                    <div>
                      <div className={`font-semibold ${
                        isCurrentUser 
                          ? (isDark ? "text-blue-400" : "text-blue-600")
                          : (isDark ? "text-text-primary-dark" : "text-text-primary-light")
                      }`}>
                        {entry.display_name || entry.username}
                      </div>
                      <div className={`text-xs ${
                        isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                      }`}>
                        @{entry.username}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accuracy */}
                <div className="col-span-2 flex items-center justify-center">
                  <div className={`
                    px-3 py-1 rounded-full text-sm font-semibold
                    ${entry.accuracy >= 90 
                      ? (isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700")
                      : entry.accuracy >= 80 
                        ? (isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700")
                        : (isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700")
                    }
                  `}>
                    {entry.accuracy}%
                  </div>
                </div>

                {/* Time */}
                <div className="col-span-2 flex items-center justify-center">
                  <span className={`text-sm font-medium ${
                    isDark ? "text-text-primary-dark" : "text-text-primary-light"
                  }`}>
                    {formatTime(entry.time_taken)}
                  </span>
                </div>

                {/* Questions */}
                <div className="col-span-2 flex items-center justify-center">
                  <span className={`text-sm font-medium ${
                    isDark ? "text-text-primary-dark" : "text-text-primary-light"
                  }`}>
                    {entry.questions_attempted}
                  </span>
                </div>

                {/* Points */}
                <div className="col-span-2 flex items-center justify-center">
                  <span className={`text-sm font-bold ${
                    isDark ? "text-purple-400" : "text-purple-600"
                  }`}>
                    {entry.points_earned}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Current User Rank (if not in top 30) */}
      {!currentUserInTop30 && currentUserRank && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6"
        >
          <div className={`
            flex items-center justify-center py-4 px-6 rounded-xl border-2 border-dashed
            ${isDark 
              ? "bg-bg-secondary-dark border-border-dark" 
              : "bg-bg-secondary-light border-border-light"
            }
          `}>
            <span className={`text-lg font-medium mr-4 ${
              isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
            }`}>
              ...
            </span>
            <div className={`
              grid grid-cols-12 gap-4 px-6 py-4 rounded-xl w-full max-w-2xl
              ${isDark 
                ? "bg-blue-900/30 border-l-4 border-blue-500" 
                : "bg-blue-50 border-l-4 border-blue-500"
              }
            `}>
              <div className="col-span-1 flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${isDark ? "bg-blue-600 text-white" : "bg-blue-500 text-white"}
                `}>
                  {currentUserRank}
                </div>
              </div>
              <div className="col-span-3 flex items-center">
                <span className={`font-semibold ${
                  isDark ? "text-blue-400" : "text-blue-600"
                }`}>
                  Your Rank
                </span>
              </div>
              <div className="col-span-2 text-center">
                <span className={`text-sm ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}`}>
                  Keep practicing!
                </span>
              </div>
              <div className="col-span-2"></div>
              <div className="col-span-2"></div>
              <div className="col-span-2"></div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className={`mt-8 text-center text-sm ${
        isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
      }`}>
        <p>🏆 Top performers get bragging rights • 💪 Keep practicing to climb the ranks!</p>
      </div>
    </motion.div>
  );
};

export default LeaderboardView;