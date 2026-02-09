// VARC Analytics - Phase F: Update User Analytics
// Refactored for Drizzle

import { AttemptDatum, PassageArraySchema } from "../types";
import { db } from "../../../db";
import { userAnalytics, practiceSessions, userMetricProficiency, passages, questions } from "../../../db/schema";
import { eq, and, gte, lt, inArray } from "drizzle-orm";
import z from "zod";
import { v4 as uuidv4 } from "uuid";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger('analytics-phase-f');

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

/**
 * Calculate streak bonus multiplier for points calculation
 */
function getStreakBonusMultiplier(currentStreak: number): number {
    if (currentStreak >= 30) return 1.50;
    if (currentStreak >= 10) return 1.25;
    if (currentStreak >= 2) return 1.10;
    return 1.0;
}

export async function phaseF_updateUserAnalytics(
    user_id: string,
    session_id: string | null,
    dataset: AttemptDatum[],
    sessionData: {
        time_spent_seconds: number;
        points_earned: number;
        completed_at: string;
    }
): Promise<PhaseFResult> {
    logger.info('Updating user_analytics');

    const today = sessionData.completed_at
        ? new Date(sessionData.completed_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];


    // Determine if this is a real session or just a streak update
    const isStreakUpdateOnly = session_id === null || dataset.length === 0;

    // 1. Calculate basic session stats
    const questions_attempted = dataset.filter(a => !!a.user_answer).length;
    const questions_correct = dataset.filter(d => d.correct).length;
    const accuracy_percentage = questions_attempted > 0
        ? Math.round((questions_correct / questions_attempted) * 10000) / 100
        : 0;
    const minutes_practiced = Math.round(sessionData.time_spent_seconds / 60);
    const points_earned_session = sessionData.points_earned || 0;

    // 2. Calculate reading speed WPM
    const reading_speed_wpm = await calculateReadingSpeedWpm(dataset);

    // 3. Update user_metric_proficiency with reading_speed_wpm if calculated
    if (reading_speed_wpm > 0 && session_id) {
        await updateReadingSpeedProficiency(
            user_id,
            session_id,
            reading_speed_wpm,
            accuracy_percentage,
            sessionData.completed_at
        );
    }

    // 4. Performance Metrics (Genre, Difficulty, Question Type)
    // Now fetched directly from user_metric_proficiency (computed in Phase D)

    // 7. Fetch existing analytics for this user
    const existingAnalytics = await db.query.userAnalytics.findFirst({
        where: eq(userAnalytics.user_id, user_id)
    });

    // 8. Check if user has >= 10 minutes of practice today for streak calculation
    const dayStart = new Date(`${today}T00:00:00.000Z`);
    const dayEndDate = new Date(dayStart);
    dayEndDate.setUTCDate(dayEndDate.getUTCDate() + 1);

    // Drizzle timestamps are distinct, we need dates
    const daySessions = await db.query.practiceSessions.findMany({
        where: and(
            eq(practiceSessions.user_id, user_id),
            eq(practiceSessions.status, 'completed'),
            gte(practiceSessions.completed_at, dayStart),
            lt(practiceSessions.completed_at, dayEndDate)
        ),
        columns: {
            time_spent_seconds: true
        }
    });

    // Calculate total time spent today (including current session if it's a real session)
    let totalSecondsToday = 0;

    if (daySessions && daySessions.length > 0) {
        totalSecondsToday = daySessions.reduce((sum, s) => sum + (s.time_spent_seconds || 0), 0);
    }

    // If we're processing a real session (not just a streak update), add its time
    if (!isStreakUpdateOnly) {
        totalSecondsToday += sessionData.time_spent_seconds;
    }

    // 9. Calculate streaks
    // Streak continues only if user has >= 5 minutes (300 seconds) of practice today
    const MINIMUM_SECONDS_FOR_STREAK = 300; // 5 minutes
    const hasSessionToday = totalSecondsToday >= MINIMUM_SECONDS_FOR_STREAK;

    logger.info({
        totalSecondsToday,
        minimumRequired: MINIMUM_SECONDS_FOR_STREAK,
        hasSessionToday
    }, "Streak calculation inputs");

    const streakData = await calculateStreaks(user_id, today, hasSessionToday, existingAnalytics);

    // 10. Determine if we need to reset daily stats (new day)
    const lastActiveDate = existingAnalytics?.last_active_date;
    const isNewDay = !lastActiveDate || lastActiveDate !== today;

    // 11. Calculate points earned today (with streak bonus)
    // Base points = number of correct answers
    const basePointsEarned = questions_correct;
    const streakMultiplier = getStreakBonusMultiplier(streakData.currentStreak);
    const pointsWithBonus = Math.floor(basePointsEarned * streakMultiplier);

    let points_earned_today: number;
    if (isNewDay) {
        // New day - reset daily points
        points_earned_today = pointsWithBonus;
    } else {
        // Same day - accumulate points
        points_earned_today = (existingAnalytics?.points_earned_today || 0) + pointsWithBonus;
    }

    // 12. Calculate total points (with streak bonus applied)
    const total_points = (existingAnalytics?.total_points || 0) + pointsWithBonus;

    // 13. Prepare final upsert data
    const genre_performance = await fetchProficiencyMap(user_id, 'genre');
    const difficulty_performance = await fetchProficiencyMap(user_id, 'difficulty');
    const question_type_performance = await fetchProficiencyMap(user_id, 'question_type');

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
        ), // Keep as number with 2 decimal places
        current_streak: streakData.currentStreak,
        longest_streak: streakData.longestStreak,
        points_earned_today: points_earned_today,
        total_points: total_points,
        genre_performance: JSON.stringify(genre_performance),
        difficulty_performance: JSON.stringify(difficulty_performance),
        question_type_performance: JSON.stringify(question_type_performance),
        new_words_learned: existingAnalytics?.new_words_learned || 0,
        words_reviewed: existingAnalytics?.words_reviewed || 0,
        updated_at: new Date(),
    };

    // 14. Upsert into user_analytics table
    try {
        await db.insert(userAnalytics)
            .values({ ...upsertData, id: existingAnalytics?.id || uuidv4() })
            .onConflictDoUpdate({
                target: [userAnalytics.user_id],
                set: upsertData
            });
    } catch (upsertError: any) {
        logger.error({ error: upsertError instanceof Error ? upsertError.message : String(upsertError), userId: user_id }, 'Failed to upsert user_analytics');
        throw new Error(`Failed to update user_analytics: ${upsertError.message}`);
    }

    logger.info({
        lastActive: today,
        questions: `${questions_attempted}/${questions_correct}`,
        accuracy: `${accuracy_percentage}%`,
        minutes: minutes_practiced,
        wpm: reading_speed_wpm,
        pointsToday: points_earned_today,
        totalPoints: total_points,
        streak: streakData.currentStreak
    }, "User analytics updated successfully");

    // Build the analytics data for return
    const analyticsData: PhaseFResult = {
        user_id,
        minutes_practiced,
        questions_attempted,
        questions_correct,
        accuracy_percentage,
        last_active_date: today,
        points_earned_today,
        genre_performance,
        difficulty_performance,
        question_type_performance,
        reading_speed_wpm,
    };

    return analyticsData;
}

/**
 * Update user_metric_proficiency with reading_speed_wpm
 * This is called from Phase F after calculating the actual WPM
 */
async function updateReadingSpeedProficiency(
    user_id: string,
    session_id: string,
    wpm: number,
    accuracy: number,
    completed_at: string
): Promise<void> {
    logger.info({ wpm, accuracy, completedAt: completed_at }, "Updating reading speed proficiency");

    // Normalize WPM to 0-100 proficiency score
    // Typical reading speeds: 50-400 WPM
    // We cap at 50 (0%) and 400 (100%)
    const normalizedScore = Math.min(100, Math.max(0, Math.round(((wpm - 50) / 350) * 100)));

    // Check if there's an existing record
    const existing = await db.query.userMetricProficiency.findFirst({
        where: and(
            eq(userMetricProficiency.user_id, user_id),
            eq(userMetricProficiency.dimension_type, 'core_metric'),
            eq(userMetricProficiency.dimension_key, 'reading_speed_wpm')
        )
    });

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

    // Helper to parse speedVsAccuracyData
    const parseSpeedData = (val: any) => {
        if (!val) return [];
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return []; }
        }
        return Array.isArray(val) ? val : [];
    };

    let speedVsAccuracyData: Array<{ date: string; wpm: number; accuracy: number; sessions_count: number }> = [];

    if (existing?.speed_vs_accuracy_data) {
        let rawData = parseSpeedData(existing.speed_vs_accuracy_data);

        // Handle old format (with session_id) vs new format (with sessions_count)
        if (rawData.length > 0 && 'session_id' in rawData[0]) {
            // Convert legacy
            const dateAggregates = new Map<string, { totalWpm: number; totalAccuracy: number; count: number }>();
            for (const record of rawData) {
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
            speedVsAccuracyData = Array.from(dateAggregates.entries())
                .map(([date, aggregate]) => ({
                    date,
                    wpm: Math.round(aggregate.totalWpm / aggregate.count),
                    accuracy: Math.round(aggregate.totalAccuracy / aggregate.count * 100) / 100,
                    sessions_count: aggregate.count
                }));
        } else {
            speedVsAccuracyData = rawData;
        }
    }

    // Group existing data by date and calculate aggregates
    const dateAggregates = new Map<string, { totalWpm: number; totalAccuracy: number; count: number }>();

    // Process existing aggregated data
    for (const record of speedVsAccuracyData) {
        const aggr = dateAggregates.get(record.date);
        if (aggr) {
            aggr.totalWpm += record.wpm * record.sessions_count;
            aggr.totalAccuracy += record.accuracy * record.sessions_count;
            aggr.count += record.sessions_count;
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
        currentSession.totalWpm += wpm;
        currentSession.totalAccuracy += accuracy;
        currentSession.count += 1;
    } else {
        dateAggregates.set(sessionDate, {
            totalWpm: wpm,
            totalAccuracy: accuracy,
            count: 1
        });
    }

    // Convert back to array
    speedVsAccuracyData = Array.from(dateAggregates.entries())
        .map(([date, aggregate]) => ({
            date,
            wpm: Math.round(aggregate.totalWpm / aggregate.count),
            accuracy: Math.round(aggregate.totalAccuracy / aggregate.count * 100) / 100,
            sessions_count: aggregate.count
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Keep only the last 60 days of data
    if (speedVsAccuracyData.length > 60) {
        speedVsAccuracyData = speedVsAccuracyData.slice(-60);
    }

    // Upsert
    const upsert = {
        user_id,
        dimension_type: 'core_metric' as const,
        dimension_key: 'reading_speed_wpm',
        proficiency_score: newScore,
        confidence_score: "0.80", // Keep as string with 2 decimal places
        total_attempts: (existing?.total_attempts || 0) + 1,
        correct_attempts: newScore, // Store score as "correct" for this metric
        last_session_id: session_id,
        trend: existing ? (newScore > existing.proficiency_score ? 'improving' as const : newScore < existing.proficiency_score ? 'declining' as const : 'stagnant' as const) : null,
        speed_vs_accuracy_data: JSON.stringify(speedVsAccuracyData),
        updated_at: new Date(),
        created_at: existing?.created_at || new Date(),
    };

    try {
        await db.insert(userMetricProficiency)
            .values(upsert)
            .onConflictDoUpdate({
                target: [userMetricProficiency.user_id, userMetricProficiency.dimension_type, userMetricProficiency.dimension_key],
                set: upsert
            });
        logger.info({ newScore, daysTracked: speedVsAccuracyData.length }, "Reading speed proficiency updated");
    } catch (upsertError) {
        logger.error({ error: upsertError instanceof Error ? upsertError.message : String(upsertError) }, 'Failed to update reading_speed_wpm proficiency');
        // Don't throw - this is not critical
    }
}

/**
 * Calculate reading speed in words per minute
 */
function countWordsInText(text: string): number {
    const cleaned = text
        .replace(/<[^>]*>/g, ' ')
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
    dataset: AttemptDatum[]
): Promise<number> {
    if (dataset.length === 0) return 0;

    const totalTimeSeconds = dataset.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);
    if (totalTimeSeconds <= 0) return 0;

    // --- Passage words ---
    const passageIds = Array.from(
        new Set(dataset.map(d => d.passage_id).filter((id): id is string => Boolean(id)))
    );

    const passageWordCount = new Map<string, number>();

    if (passageIds.length > 0) {
        const fetchedPassages = await db.query.passages.findMany({
            where: inArray(passages.id, passageIds)
        });

        for (const p of fetchedPassages) {
            passageWordCount.set(p.id, p.word_count || 0);
        }
    }

    const totalPassageWords = passageIds.reduce((sum, id) => sum + (passageWordCount.get(id) || 0), 0);

    // --- Jumbled sentences ---
    const paraJumbleQuestionIds = Array.from(
        new Set(dataset.filter(a => a.question_type === 'para_jumble').map(a => a.question_id))
    );

    const jumbledByQuestionId = new Map<string, unknown>();

    if (paraJumbleQuestionIds.length > 0) {
        const fetchedQuestions = await db.query.questions.findMany({
            where: inArray(questions.id, paraJumbleQuestionIds),
            columns: {
                id: true,
                jumbled_sentences: true
            }
        });

        for (const q of fetchedQuestions) {
            // jumbledSentences is text/json
            const js = typeof q.jumbled_sentences === 'string' ? JSON.parse(q.jumbled_sentences) : q.jumbled_sentences;
            jumbledByQuestionId.set(q.id, js);
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
 * Fetch proficiency scores for a specific dimension type
 */
async function fetchProficiencyMap(
    user_id: string,
    dimension_type: 'genre' | 'difficulty' | 'question_type'
): Promise<Record<string, number>> {
    const data = await db.query.userMetricProficiency.findMany({
        where: and(
            eq(userMetricProficiency.user_id, user_id),
            eq(userMetricProficiency.dimension_type, dimension_type)
        ),
        columns: {
            dimension_key: true,
            proficiency_score: true
        }
    });

    const map: Record<string, number> = {};
    for (const row of data) {
        map[row.dimension_key] = row.proficiency_score;
    }
    return map;
}

/**
 * Calculate streaks
 */
async function calculateStreaks(
    user_id: string,
    today: string,
    hasSessionToday: boolean,
    existingAnalytics: any
): Promise<{ currentStreak: number; longestStreak: number }> {
    try {
        if (!existingAnalytics) {
            return { currentStreak: hasSessionToday ? 1 : 0, longestStreak: hasSessionToday ? 1 : 0 };
        }

        const lastActiveDate = existingAnalytics.last_active_date;
        const previousStreak = existingAnalytics.current_streak || 0;
        const previousLongestStreak = existingAnalytics.longest_streak || 0;

        logger.info({ lastActiveDate, previousStreak, previousLongestStreak }, "Previous analytics loaded");

        let currentStreak = 0;

        if (hasSessionToday) {
            // User has >= 5 minutes today
            if (!lastActiveDate) {
                // First time user is active
                currentStreak = 1;
                logger.info({ currentStreak }, "First active day: starting streak");
            } else {
                const lastDate = new Date(lastActiveDate + 'T00:00:00Z');
                const todayDate = new Date(today + 'T00:00:00Z');
                const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

                logger.info({ lastActiveDate, today, daysDiff }, "Date comparison for streak");

                if (daysDiff === 0) {
                    // Same day - maintain current streak (no change)
                    currentStreak = previousStreak;

                    // Fix: If streak was previously 0 (e.g., from a prior short session today),
                    // but now the user has satisfied the criteria, ensure streak is at least 1.
                    if (currentStreak === 0) {
                        currentStreak = 1;
                        logger.info({ currentStreak, condition: daysDiff === 0 && previousStreak === 0 ? "recovery" : "maintenance" }, "Handling same day streak");
                    }
                } else if (daysDiff === 1) {
                    // Consecutive day - increment streak
                    currentStreak = previousStreak + 1;
                    logger.info({ currentStreak }, "Consecutive day: incrementing streak");
                } else {
                    // Gap detected - streak broken, start new streak
                    currentStreak = 1;
                    logger.info({ currentStreak, gap: daysDiff }, "Streak broken: starting new streak");
                }
            }
        } else {
            // User does NOT have >= 10 minutes today - streak is broken
            currentStreak = 0;
            logger.info("No qualifying session today: streak broken");
        }

        // Longest streak is max of current and previous longest
        const longestStreak = Math.max(previousLongestStreak, currentStreak);

        logger.info({ currentStreak, longestStreak, hasSessionToday }, "Streak calculation result");

        return { currentStreak, longestStreak };

    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in calculateStreaks');
        return { currentStreak: hasSessionToday ? 1 : 0, longestStreak: hasSessionToday ? 1 : 0 };
    }
}

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
    return Math.round((existingWeighted + newWeighted) * 100) / 100;
}