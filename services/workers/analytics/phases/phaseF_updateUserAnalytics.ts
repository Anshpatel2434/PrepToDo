// VARC Analytics - Phase F: Update User Analytics

import z from "zod";
import { PassageArraySchema, QuestionArraySchema, QuestionSchema, UserAnalyticsArraySchema, UserAnalyticsSchema, type AttemptDatum, type PassageSchema, type UserAnalytics } from "../types";

export interface PhaseFResult {
    user_id: string;
    minutes_practiced: number;
    questions_attempted: number;
    questions_correct: number;
    accuracy_percentage: number;
    last_active_date: string;
    points_earned_today: number;
    genre_performance: Record<string, number>;
    difficulty_performance: Record<string, number>;
    question_type_performance: Record<string, number>;
    reading_speed_wpm: number;
}

export async function phaseF_updateUserAnalytics(
    supabase: any,
    user_id: string,
    session_id: string | null,
    dataset: AttemptDatum[],
    sessionData: {
        time_spent_seconds: number;
        points_earned: number;
        completed_at: string;
    }
): Promise<PhaseFResult> {
    console.log('📊 [Phase F] Updating user_analytics');

    const today = sessionData.completed_at
        ? new Date(sessionData.completed_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];


    // Determine if this is a real session or just a streak update
    const isStreakUpdateOnly = session_id === null || dataset.length === 0;

    // 1. Calculate basic session stats
    const questions_attempted = dataset.length;
    const questions_correct = dataset.filter(d => d.correct).length;
    const accuracy_percentage = questions_attempted > 0
        ? Math.round((questions_correct / questions_attempted) * 10000) / 100
        : 0;
    const minutes_practiced = Math.round(sessionData.time_spent_seconds / 60);
    const points_earned_session = sessionData.points_earned || 0;

    // 2. Calculate reading speed WPM
    const reading_speed_wpm = await calculateReadingSpeedWpm(supabase, dataset);

    // 3. Update user_metric_proficiency with reading_speed_wpm if calculated
    if (reading_speed_wpm > 0 && session_id) {
        await updateReadingSpeedProficiency(
            supabase,
            user_id,
            session_id,
            reading_speed_wpm,
            accuracy_percentage,
            sessionData.completed_at
        );
    }

    // 4. Calculate genre performance
    const genrePerformance = calculateGenrePerformance(dataset);

    // 5. Calculate difficulty performance
    const difficultyPerformance = await calculateDifficultyPerformance(supabase, dataset);

    // 6. Calculate question type performance
    const questionTypePerformance = calculateQuestionTypePerformance(dataset);

    // 7. Fetch existing analytics for this user (single row)
    const { data: existingAnalytics } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', user_id)
        .maybeSingle();

    // 8. Check if user practiced today for streak calculation
    const dayStart = `${today}T00:00:00.000Z`;
    const dayEndDate = new Date(dayStart);
    dayEndDate.setUTCDate(dayEndDate.getUTCDate() + 1);
    const dayEnd = dayEndDate.toISOString();

    const { data: daySessions, error: daySessionsError } = await supabase
        .from('practice_sessions')
        .select('id')
        .eq('user_id', user_id)
        .eq('status', 'completed')
        .gte('completed_at', dayStart)
        .lt('completed_at', dayEnd)
        .limit(1);

    if (daySessionsError) {
        console.error('⚠️ Failed to check sessions for streak calculation:', daySessionsError.message);
    }

    const hasSessionToday = (!isStreakUpdateOnly) || ((daySessions?.length || 0) > 0);

    // 9. Calculate streaks
    const streakData = await calculateStreaks(supabase, user_id, today, hasSessionToday, existingAnalytics);

    // 10. Determine if we need to reset daily stats (new day)
    const lastActiveDate = existingAnalytics?.last_active_date;
    const isNewDay = !lastActiveDate || lastActiveDate !== today;

    // 11. Calculate points earned today
    let points_earned_today: number;
    if (isNewDay) {
        // New day - reset daily points
        points_earned_today = points_earned_session;
    } else {
        // Same day - accumulate points
        points_earned_today = (existingAnalytics?.points_earned_today || 0) + points_earned_session;
    }

    // 12. Calculate total points
    const total_points = (existingAnalytics?.total_points || 0) + points_earned_session;

    // 13. Prepare final upsert data
    const upsertData = {
        user_id,
        last_active_date: today,
        minutes_practiced: (existingAnalytics?.minutes_practiced || 0) + minutes_practiced,
        questions_attempted: (existingAnalytics?.questions_attempted || 0) + questions_attempted,
        questions_correct: (existingAnalytics?.questions_correct || 0) + questions_correct,
        accuracy_percentage: calculateWeightedAccuracy(
            existingAnalytics?.questions_attempted || 0,
            existingAnalytics?.accuracy_percentage || 0,
            questions_attempted,
            accuracy_percentage
        ),
        current_streak: streakData.currentStreak,
        longest_streak: streakData.longestStreak,
        points_earned_today,
        total_points,
        genre_performance: mergePerformance(
            (existingAnalytics?.genre_performance as Record<string, number>) || {},
            genrePerformance
        ),
        difficulty_performance: mergePerformance(
            (existingAnalytics?.difficulty_performance as Record<string, number>) || {},
            difficultyPerformance
        ),
        question_type_performance: mergePerformance(
            (existingAnalytics?.question_type_performance as Record<string, number>) || {},
            questionTypePerformance
        ),
        new_words_learned: existingAnalytics?.new_words_learned || 0,
        words_reviewed: existingAnalytics?.words_reviewed || 0,
        updated_at: new Date().toISOString(),
    };

    // 14. Upsert into user_analytics table (single row per user)
    const { error: upsertError } = await supabase
        .from('user_analytics')
        .upsert(upsertData)
        .eq('user_id', user_id);

    if (upsertError) {
        console.error('❌ [Phase F] Failed to upsert user_analytics:', upsertError);
        throw new Error(`Failed to update user_analytics: ${upsertError.message}`);
    }

    console.log('✅ [Phase F] User analytics updated successfully');
    console.log(`   - Last Active: ${today}`);
    console.log(`   - Questions: ${questions_attempted}/${questions_correct} (${accuracy_percentage}%)`);
    console.log(`   - Minutes: ${minutes_practiced}`);
    console.log(`   - WPM: ${reading_speed_wpm}`);
    console.log(`   - Points Today: ${points_earned_today}`);
    console.log(`   - Total Points: ${total_points}`);
    console.log(`   - Streak: ${streakData.currentStreak} days`);

    // Build the analytics data for return
    const analyticsData: PhaseFResult = {
        user_id,
        minutes_practiced,
        questions_attempted,
        questions_correct,
        accuracy_percentage,
        last_active_date: today,
        points_earned_today,
        genre_performance: genrePerformance,
        difficulty_performance: difficultyPerformance,
        question_type_performance: questionTypePerformance,
        reading_speed_wpm,
    };

    return analyticsData;
}

/**
 * Update user_metric_proficiency with reading_speed_wpm
 * This is called from Phase F after calculating the actual WPM
 */
async function updateReadingSpeedProficiency(
    supabase: any,
    user_id: string,
    session_id: string,
    wpm: number,
    accuracy: number,
    completed_at: string
): Promise<void> {
    console.log(`📊 [Phase F] Updating reading_speed_wpm in user_metric_proficiency: ${wpm} WPM, ${accuracy}% accuracy`);

    console.log("completed at : ", completed_at)

    // Normalize WPM to 0-100 proficiency score
    // Typical reading speeds: 50-400 WPM
    // We cap at 50 (0%) and 400 (100%)
    const normalizedScore = Math.min(100, Math.max(0, Math.round(((wpm - 50) / 350) * 100)));

    // Check if there's an existing record
    const { data: existing } = await supabase
        .from('user_metric_proficiency')
        .select('*')
        .eq('user_id', user_id)
        .eq('dimension_type', 'core_metric')
        .eq('dimension_key', 'reading_speed_wpm')
        .maybeSingle();

    let newScore: number;
    if (existing) {
        // Use EMA to smooth the score
        const oldScore = existing.proficiency_score;
        const alpha = 0.3; // Learning rate for reading speed
        newScore = Math.round(oldScore * (1 - alpha) + normalizedScore * alpha);
    } else {
        newScore = normalizedScore;
    }

    // Update speed_vs_accuracy_data with aggregated daily averages
    // Use the session's completed_at date, not today's date
    const sessionDate = new Date(completed_at).toISOString().split('T')[0];

    let speedVsAccuracyData: Array<{ date: string; wpm: number; accuracy: number; sessions_count: number }> = [];

    if (existing?.speed_vs_accuracy_data) {
        // Parse existing data and handle backward compatibility
        const rawData = Array.isArray(existing.speed_vs_accuracy_data)
            ? existing.speed_vs_accuracy_data
            : [];

        // Handle old format (with session_id) vs new format (with sessions_count)
        if (rawData.length > 0 && 'session_id' in rawData[0]) {
            // Old format - convert to new aggregated format
            console.log('   - Converting old session-based format to new aggregated format');

            const dateAggregates = new Map<string, { totalWpm: number; totalAccuracy: number; count: number }>();

            for (const record of rawData as Array<{ date: string; wpm: number; accuracy: number; session_id: string }>) {
                const existing = dateAggregates.get(record.date);
                if (existing) {
                    existing.totalWpm += record.wpm;
                    existing.totalAccuracy += record.accuracy;
                    existing.count += 1;
                } else {
                    dateAggregates.set(record.date, {
                        totalWpm: record.wpm,
                        totalAccuracy: record.accuracy,
                        count: 1
                    });
                }
            }

            // Convert to new format
            speedVsAccuracyData = Array.from(dateAggregates.entries())
                .map(([date, aggregate]) => ({
                    date,
                    wpm: Math.round(aggregate.totalWpm / aggregate.count),
                    accuracy: Math.round(aggregate.totalAccuracy / aggregate.count * 100) / 100,
                    sessions_count: aggregate.count
                }));
        } else {
            // Already in new format
            speedVsAccuracyData = rawData;
        }
    }

    // Group existing data by date and calculate aggregates
    const dateAggregates = new Map<string, { totalWpm: number; totalAccuracy: number; count: number }>();

    // Process existing aggregated data
    for (const record of speedVsAccuracyData) {
        const existing = dateAggregates.get(record.date);
        if (existing) {
            existing.totalWpm += record.wpm * record.sessions_count;
            existing.totalAccuracy += record.accuracy * record.sessions_count;
            existing.count += record.sessions_count;
        } else {
            dateAggregates.set(record.date, {
                totalWpm: record.wpm * record.sessions_count,
                totalAccuracy: record.accuracy * record.sessions_count,
                count: record.sessions_count
            });
        }
    }

    // Add or update the current session
    const currentSession = dateAggregates.get(sessionDate);
    if (currentSession) {
        // Update existing date with new session data
        currentSession.totalWpm += wpm;
        currentSession.totalAccuracy += accuracy;
        currentSession.count += 1;
        console.log(`   - Updated aggregated data for date ${sessionDate}`);
    } else {
        // Add new date
        dateAggregates.set(sessionDate, {
            totalWpm: wpm,
            totalAccuracy: accuracy,
            count: 1
        });
        console.log(`   - Added new aggregated data for date ${sessionDate}`);
    }

    // Convert back to array format with averaged values
    speedVsAccuracyData = Array.from(dateAggregates.entries())
        .map(([date, aggregate]) => ({
            date,
            wpm: Math.round(aggregate.totalWpm / aggregate.count),
            accuracy: Math.round(aggregate.totalAccuracy / aggregate.count * 100) / 100, // Round to 2 decimal places
            sessions_count: aggregate.count
        }))
        .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date (oldest to newest)

    // Keep only the last 60 days of data
    if (speedVsAccuracyData.length > 60) {
        speedVsAccuracyData = speedVsAccuracyData.slice(-60);
        console.log(`   - Trimmed to last 60 days (removed ${speedVsAccuracyData.length - 60} oldest)`);
    }

    const { error: upsertError } = await supabase
        .from('user_metric_proficiency')
        .upsert({
            user_id,
            dimension_type: 'core_metric',
            dimension_key: 'reading_speed_wpm',
            proficiency_score: newScore,
            confidence_score: 0.8,
            total_attempts: (existing?.total_attempts || 0) + 1,
            correct_attempts: newScore, // Store score as "correct" for this metric
            last_session_id: session_id,
            trend: existing ? (newScore > existing.proficiency_score ? 'improving' : newScore < existing.proficiency_score ? 'declining' : 'stagnant') : null,
            speed_vs_accuracy_data: speedVsAccuracyData,
            updated_at: new Date().toISOString(),
            created_at: existing?.created_at || new Date().toISOString(),
        }, {
            onConflict: 'user_id,dimension_type,dimension_key',
        });

    if (upsertError) {
        console.error('❌ [Phase F] Failed to update reading_speed_wpm proficiency:', upsertError);
        // Don't throw - this is not critical
    } else {
        console.log(`✅ [Phase F] Reading speed proficiency updated: ${newScore}, days tracked: ${speedVsAccuracyData.length}`);
    }
}

/**
 * Calculate reading speed in words per minute
 * Counts words across:
 * - unique passages (by passage_id)
 * - question text
 * - options (if present)
 * - jumbled sentences (if present)
 */
function countWordsInText(text: string): number {
    const cleaned = text
        .replace(/<[^>]*>/g, ' ') // strip any HTML-ish tags
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleaned) return 0;
    return cleaned.split(' ').filter(Boolean).length;
}

function collectStringsFromUnknown(value: unknown, depth = 0, maxDepth = 6): string[] {
    if (value === null || value === undefined) return [];
    if (typeof value === 'string') return [value];
    if (typeof value === 'number' || typeof value === 'boolean') return [];

    if (Array.isArray(value)) {
        if (depth >= maxDepth) return [];
        return value.flatMap(v => collectStringsFromUnknown(v, depth + 1, maxDepth));
    }

    if (typeof value === 'object') {
        if (depth >= maxDepth) return [];
        return Object.values(value as Record<string, unknown>).flatMap(v =>
            collectStringsFromUnknown(v, depth + 1, maxDepth)
        );
    }

    return [];
}

function countWordsInUnknown(value: unknown): number {
    const parts = collectStringsFromUnknown(value);
    return parts.reduce((sum, part) => sum + countWordsInText(part), 0);
}

async function calculateReadingSpeedWpm(
    supabase: any,
    dataset: AttemptDatum[]
): Promise<number> {
    if (dataset.length === 0) return 0;

    const totalTimeSeconds = dataset.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);
    if (totalTimeSeconds <= 0) return 0;

    // --- Passage words (count each passage once, even if multiple questions reference it) ---
    const passageIds = Array.from(
        new Set(dataset.map(d => d.passage_id).filter((id): id is string => Boolean(id)))
    );

    const passageWordCount = new Map<string, number>();

    if (passageIds.length > 0) {
        const { data: passages, error } = await supabase
            .from('passages')
            .select('*')
            .in('id', passageIds);

        if (error || !passages || passages.length === 0) {
            console.warn('⚠️ [Phase F] Could not fetch passage word counts for WPM calculation');
        } else {
            const passagesParsed = PassageArraySchema.safeParse(passages);
            if (!passagesParsed.success) {
                console.error('⚠️ [Phase F] Validation failed for passages:', passagesParsed.error.issues[0]);
            } else {
                for (const p of passagesParsed.data) {
                    passageWordCount.set(p.id, p.word_count || 0);
                }
            }
        }
    }

    const totalPassageWords = passageIds.reduce((sum, id) => sum + (passageWordCount.get(id) || 0), 0);

    // --- Jumbled sentences (only fetch if needed) ---
    const paraJumbleQuestionIds = Array.from(
        new Set(dataset.filter(a => a.question_type === 'para_jumble').map(a => a.question_id))
    );

    const jumbledByQuestionId = new Map<string, unknown>();

    if (paraJumbleQuestionIds.length > 0) {
        const QuestionJumbledSchema = z.object({
            id: z.string(),
            jumbled_sentences: z.any().nullish(),
        });

        const { data: questions, error } = await supabase
            .from('questions')
            .select('id, jumbled_sentences')
            .in('id', paraJumbleQuestionIds);

        if (error || !questions || questions.length === 0) {
            console.warn('⚠️ [Phase F] Could not fetch jumbled_sentences for WPM calculation');
        } else {
            const parsed = z.array(QuestionJumbledSchema).safeParse(questions);
            if (!parsed.success) {
                console.error('⚠️ [Phase F] Validation failed for jumbled_sentences:', parsed.error.issues[0]);
            } else {
                for (const q of parsed.data) {
                    jumbledByQuestionId.set(q.id, q.jumbled_sentences);
                }
            }
        }
    }

    // --- Question + option + jumbled words ---
    let totalQuestionWords = 0;
    let totalOptionWords = 0;
    let totalJumbledWords = 0;

    for (const attempt of dataset) {
        if (attempt.question_text) {
            totalQuestionWords += countWordsInText(attempt.question_text);
        }

        if (attempt.options !== undefined && attempt.options !== null) {
            totalOptionWords += countWordsInUnknown(attempt.options);
        }

        const jumbled = attempt.jumbled_sentences ?? jumbledByQuestionId.get(attempt.question_id);
        if (jumbled !== undefined && jumbled !== null) {
            totalJumbledWords += countWordsInUnknown(jumbled);
        }
    }

    const totalWords = totalPassageWords + totalQuestionWords + totalOptionWords + totalJumbledWords;

    if (totalWords === 0) return 0;

    const totalMinutes = totalTimeSeconds / 60;
    const wpm = Math.round(totalWords / totalMinutes);

    return Math.min(400, Math.max(50, wpm));
}

/**
 * Calculate performance by genre
 */
function calculateGenrePerformance(dataset: AttemptDatum[]): Record<string, number> {
    const genreStats = new Map<string, { correct: number; total: number }>();

    for (const attempt of dataset) {
        if (!attempt.genre) continue;

        if (!genreStats.has(attempt.genre)) {
            genreStats.set(attempt.genre, { correct: 0, total: 0 });
        }

        const stats = genreStats.get(attempt.genre)!;
        stats.total += 1;
        stats.correct += attempt.correct ? 1 : 0;
    }

    const performance: Record<string, number> = {};
    for (const [genre, stats] of Array.from(genreStats)) {
        performance[genre] = Math.round((stats.correct / stats.total) * 100);
    }

    return performance;
}

/**
 * Calculate performance by difficulty
 */
async function calculateDifficultyPerformance(
    supabase: any,
    dataset: AttemptDatum[]
): Promise<Record<string, number>> {
    const questionIds = Array.from(new Set(dataset.map(d => d.question_id)));

    if (questionIds.length === 0) {
        return {};
    }

    const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

    if (error || !questions || questions.length === 0) {
        console.warn('⚠️ [Phase F] Could not fetch question difficulties');
        return {};
    }

    const questionsParsed = QuestionArraySchema.safeParse(questions);
    if (!questionsParsed.success) {
        console.error('⚠️ [Phase F] Validation failed for questions:', questionsParsed.error.issues[0]);
        return {};
    }

    const questionsVerified = questionsParsed.data;

    const questionDifficulty = new Map(questionsVerified.map(q => [q.id, q.difficulty]));

    const difficultyStats = new Map<string, { correct: number; total: number }>();

    for (const attempt of dataset) {
        const difficulty = questionDifficulty.get(attempt.question_id) || 'medium';

        if (!difficultyStats.has(difficulty)) {
            difficultyStats.set(difficulty, { correct: 0, total: 0 });
        }

        const stats = difficultyStats.get(difficulty)!;
        stats.total += 1;
        stats.correct += attempt.correct ? 1 : 0;
    }

    const performance: Record<string, number> = {};
    for (const [difficulty, stats] of Array.from(difficultyStats)) {
        performance[difficulty] = Math.round((stats.correct / stats.total) * 100);
    }

    return performance;
}

/**
 * Calculate performance by question type
 */
function calculateQuestionTypePerformance(dataset: AttemptDatum[]): Record<string, number> {
    const typeStats = new Map<string, { correct: number; total: number }>();

    for (const attempt of dataset) {
        if (!typeStats.has(attempt.question_type)) {
            typeStats.set(attempt.question_type, { correct: 0, total: 0 });
        }

        const stats = typeStats.get(attempt.question_type)!;
        stats.total += 1;
        stats.correct += attempt.correct ? 1 : 0;
    }

    const performance: Record<string, number> = {};
    for (const [type, stats] of Array.from(typeStats)) {
        performance[type] = Math.round((stats.correct / stats.total) * 100);
    }

    return performance;
}

/**
 * Calculate current and longest streaks
 * Updated to work with single-row user_analytics table
 */
async function calculateStreaks(
    supabase: any,
    user_id: string,
    today: string,
    hasSessionToday: boolean,
    existingAnalytics: any
): Promise<{ currentStreak: number; longestStreak: number }> {
    try {
        // If no existing analytics, this is the first session
        if (!existingAnalytics) {
            return { currentStreak: hasSessionToday ? 1 : 0, longestStreak: hasSessionToday ? 1 : 0 };
        }

        const lastActiveDate = existingAnalytics.last_active_date;
        const previousStreak = existingAnalytics.current_streak || 0;
        const previousLongestStreak = existingAnalytics.longest_streak || 0;

        let currentStreak = 0;

        if (hasSessionToday) {
            if (!lastActiveDate) {
                // First time user is active
                currentStreak = 1;
            } else {
                const lastDate = new Date(lastActiveDate + 'T00:00:00Z');
                const todayDate = new Date(today + 'T00:00:00Z');
                const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

                if (daysDiff === 0) {
                    // Same day - maintain current streak
                    currentStreak = previousStreak;
                } else if (daysDiff === 1) {
                    // Consecutive day - increment streak
                    currentStreak = previousStreak + 1;
                } else {
                    // Streak broken - start new streak
                    currentStreak = 1;
                }
            }
        } else {
            // No session today - streak is 0
            currentStreak = 0;
        }

        // Longest streak is max of current and previous longest
        const longestStreak = Math.max(previousLongestStreak, currentStreak);

        console.log(`   - Streak calculation: current=${currentStreak}, longest=${longestStreak}, hasSessionToday=${hasSessionToday}`);

        return { currentStreak, longestStreak };

    } catch (error) {
        console.error('❌ Error in calculateStreaks:', error);
        // Return safe defaults
        return { currentStreak: hasSessionToday ? 1 : 0, longestStreak: hasSessionToday ? 1 : 0 };
    }
}

/**
 * Merge performance records, averaging overlapping values
 */
function mergePerformance(
    existing: Record<string, number>,
    newData: Record<string, number>
): Record<string, number> {
    const merged = { ...existing };

    for (const [key, value] of Object.entries(newData)) {
        if (merged[key] !== undefined) {
            // Average the values if key exists
            merged[key] = Math.round((merged[key] + value) / 2);
        } else {
            merged[key] = value;
        }
    }

    return merged;
}

/**
 * Calculate weighted accuracy when merging
 */
function calculateWeightedAccuracy(
    existingAttempts: number,
    existingAccuracy: number,
    newAttempts: number,
    newAccuracy: number
): number {
    const totalAttempts = existingAttempts + newAttempts;

    if (totalAttempts === 0) return 0;

    const existingWeighted = (existingAttempts / totalAttempts) * existingAccuracy;
    const newWeighted = (newAttempts / totalAttempts) * newAccuracy;

    return Math.round(existingWeighted + newWeighted);
}
