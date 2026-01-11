// VARC Analytics - Phase F: Update User Analytics

import z from "zod";
import { PassageArraySchema, QuestionArraySchema, QuestionSchema, UserAnalyticsArraySchema, UserAnalyticsSchema, type AttemptDatum, type PassageSchema, type UserAnalytics } from "../types";

export interface PhaseFResult {
    user_id: string;
    date: string;
    minutes_practiced: number;
    questions_attempted: number;
    questions_correct: number;
    accuracy_percentage: number;
    is_active_day: boolean;
    points_earned_today: number;
    genre_performance: Record<string, number>;
    difficulty_performance: Record<string, number>;
    question_type_performance: Record<string, number>;
    reading_speed_wpm: number;
}

export async function phaseF_updateUserAnalytics(
    supabase: any,
    user_id: string,
    session_id: string,
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

    // 1. Calculate basic session stats
    const questions_attempted = dataset.length;
    const questions_correct = dataset.filter(d => d.correct).length;
    const accuracy_percentage = questions_attempted > 0
        ? Math.round((questions_correct / questions_attempted) * 10000) / 100
        : 0;
    const minutes_practiced = Math.round(sessionData.time_spent_seconds / 60);
    const points_earned_today = sessionData.points_earned || 0;

    // 2. Calculate reading speed WPM
    const reading_speed_wpm = await calculateReadingSpeedWpm(supabase, dataset);

    // 3. Update user_metric_proficiency with reading_speed_wpm if calculated
    if (reading_speed_wpm > 0) {
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

    // 7. Build the analytics data
    const analyticsData: PhaseFResult = {
        user_id,
        date: today,
        minutes_practiced,
        questions_attempted,
        questions_correct,
        accuracy_percentage,
        is_active_day: true,
        points_earned_today,
        genre_performance: genrePerformance,
        difficulty_performance: difficultyPerformance,
        question_type_performance: questionTypePerformance,
        reading_speed_wpm,
    };

    // 8. Fetch existing analytics for today to handle multiple sessions
    const { data: existingAnalyticsList } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', user_id)
        .eq('date', today)
        .order('created_at', { ascending: false });

    const existingAnalytics = existingAnalyticsList?.[0] || null;

    // 9. Calculate streaks
    const streakData = await calculateStreaks(supabase, user_id, today, analyticsData.is_active_day);

    // 10. Fetch total points
    const { data: allAnalytics } = await supabase
        .from('user_analytics')
        .select('total_points')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1);

    const previousTotalPoints = allAnalytics?.[0]?.total_points || 0;
    const total_points = previousTotalPoints + points_earned_today;

    // 11. Prepare final upsert data
    const upsertData = {
        user_id,
        date: today,
        minutes_practiced: (existingAnalytics?.minutes_practiced || 0) + minutes_practiced,
        questions_attempted: (existingAnalytics?.questions_attempted || 0) + questions_attempted,
        questions_correct: (existingAnalytics?.questions_correct || 0) + questions_correct,
        accuracy_percentage: calculateWeightedAccuracy(
            existingAnalytics?.questions_attempted || 0,
            existingAnalytics?.accuracy_percentage || 0,
            questions_attempted,
            accuracy_percentage
        ),
        is_active_day: true,
        current_streak: streakData.currentStreak,
        longest_streak: streakData.longestStreak,
        points_earned_today: (existingAnalytics?.points_earned_today || 0) + points_earned_today,
        total_points,
        genre_performance: mergePerformance(
            existingAnalytics?.genre_performance as Record<string, number> || {},
            genrePerformance
        ),
        difficulty_performance: mergePerformance(
            existingAnalytics?.difficulty_performance as Record<string, number> || {},
            difficultyPerformance
        ),
        question_type_performance: mergePerformance(
            existingAnalytics?.question_type_performance as Record<string, number> || {},
            questionTypePerformance
        ),
         new_words_learned: existingAnalytics?.new_words_learned || 0, // To be implemented with vocab tracking
        words_reviewed: existingAnalytics?.words_reviewed || 0, // To be implemented with vocab tracking
        updated_at: new Date().toISOString(),
    };

    // 12. Upsert into user_analytics table
    const { error: upsertError } = await supabase
        .from('user_analytics')
        .upsert(upsertData, {
            onConflict: 'user_id,date',
        });

    if (upsertError) {
        console.error('❌ [Phase F] Failed to upsert user_analytics:', upsertError);
        throw new Error(`Failed to update user_analytics: ${upsertError.message}`);
    }

    console.log('✅ [Phase F] User analytics updated successfully');
    console.log(`   - Date: ${today}`);
    console.log(`   - Questions: ${questions_attempted}/${questions_correct} (${accuracy_percentage}%)`);
    console.log(`   - Minutes: ${minutes_practiced}`);
    console.log(`   - WPM: ${reading_speed_wpm}`);
    console.log(`   - Points: ${points_earned_today}`);
    console.log(`   - Streak: ${streakData.currentStreak} days`);

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

    // Update speed_vs_accuracy_data with the last 60 sessions
    // Use the session's completed_at date, not today's date
    const sessionDate = new Date(completed_at).toISOString().split('T')[0];
    const newSessionData = { 
        date: sessionDate, 
        wpm, 
        accuracy,
        session_id // Track session_id to handle multiple sessions per day
    };
    
    let speedVsAccuracyData: Array<{ date: string; wpm: number; accuracy: number; session_id: string }> = [];
    
    if (existing?.speed_vs_accuracy_data) {
        // Parse existing data
        speedVsAccuracyData = Array.isArray(existing.speed_vs_accuracy_data) 
            ? existing.speed_vs_accuracy_data 
            : [];
    }
    
    // Check if this specific session already exists (for idempotency)
    const existingSessionIndex = speedVsAccuracyData.findIndex((d: any) => d.session_id === session_id);
    if (existingSessionIndex >= 0) {
        // Update existing session data (reprocessing scenario)
        speedVsAccuracyData[existingSessionIndex] = newSessionData;
        console.log(`   - Updated existing session data for session ${session_id}`);
    } else {
        // Add new session data
        speedVsAccuracyData.push(newSessionData);
        console.log(`   - Added new session data for session ${session_id}`);
    }
    
    // Sort by date (oldest to newest), then keep only the last 60 sessions
    speedVsAccuracyData.sort((a: any, b: any) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        // If same date, sort by session_id for consistency
        return a.session_id.localeCompare(b.session_id);
    });
    
    if (speedVsAccuracyData.length > 60) {
        // Remove oldest sessions, keep last 60
        speedVsAccuracyData = speedVsAccuracyData.slice(-60);
        console.log(`   - Trimmed to last 60 sessions (removed ${speedVsAccuracyData.length - 60} oldest)`);
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
        console.log(`✅ [Phase F] Reading speed proficiency updated: ${newScore}, sessions tracked: ${speedVsAccuracyData.length}`);
    }
}

/**
 * Calculate reading speed in words per minute
 * Uses passage word count and time spent on each attempt
 */
async function calculateReadingSpeedWpm(
    supabase: any,
    dataset: AttemptDatum[]
): Promise<number> {
    if (dataset.length === 0) return 0;

    // Get unique passage IDs from dataset
    const passageIds = Array.from(new Set(dataset.map(d => d.passage_id).filter(Boolean)));

    if (passageIds.length === 0) return 0;

    // Fetch passages to get word counts
    const { data: passages, error } = await supabase
        .from('passages')
        .select('*')
        .in('id', passageIds);

    if (error || !passages || passages.length === 0) {
        console.warn('⚠️ [Phase F] Could not fetch passage word counts for WPM calculation');
        return 0;
    }
    let passageVerified: z.infer<typeof PassageSchema>[];
    try {
        passageVerified = PassageArraySchema.parse(passages);
        console.log("Validation passed for passages: ");
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("Validation failed  for passages : ", error.issues[0]);
        } else {
            console.error("Unexpected error  for passages : ", error);
        }
    }

    // Build passage word count map
    const passageWordCount = new Map(passageVerified.map(p => [p.id, p.word_count]));

    // Calculate total words read and total time spent
    let totalWords = 0;
    let totalTimeSeconds = 0;

    for (const attempt of dataset) {
        if (attempt.passage_id && passageWordCount.has(attempt.passage_id)) {
            // Assume equal distribution of passage words across questions
            // This is an approximation - for more accuracy, we'd need per-question word tracking
            const passageWordCountValue = passageWordCount.get(attempt.passage_id) || 0;
            totalWords += passageWordCountValue;
        }
        totalTimeSeconds += attempt.time_spent_seconds;
    }

    if (totalWords === 0 || totalTimeSeconds === 0) return 0;

    // WPM = total words / (total time in minutes)
    const totalMinutes = totalTimeSeconds / 60;
    const wpm = Math.round(totalWords / totalMinutes);

    // Sanity check: reasonable WPM range is typically 100-400
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

    let questionsVerified: z.infer<typeof QuestionSchema>[];
    try {
        questionsVerified = QuestionArraySchema.parse(questions);
        console.log("Validation passed for questions");
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("Validation failed  for questions : ", error.issues[0]);
        } else {
            console.error("Unexpected error  for questions : ", error);
        }
    }

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
 */
async function calculateStreaks(
    supabase: any,
    user_id: string,
    today: string,
    isActiveToday: boolean
): Promise<{ currentStreak: number; longestStreak: number }> {
    // Fetch active days for this user, ordered by date descending
    // We only really need the date and longest_streak for the calculation
    const { data: analytics, error } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', user_id)
        .eq('is_active_day', true)
        .order('date', { ascending: false });

    if (error || !analytics || analytics.length === 0) {
        // First active day ever
        return { currentStreak: isActiveToday ? 1 : 0, longestStreak: isActiveToday ? 1 : 0 };
    }

    let analyticsVerified: z.infer<typeof UserAnalyticsSchema>[];
    try {
        analyticsVerified = UserAnalyticsArraySchema.parse(analytics);
        console.log("Validation passed for user analytics ");
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("Validation failed  for user analytics : ", error.issues[0]);
        } else {
            console.error("Unexpected error  for user analytics : ", error);
        }
    }

    // Calculate current streak
    let currentStreak = isActiveToday ? 1 : 0;
    const todayDate = new Date(today);
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    if (isActiveToday) {
        // Use a Set for O(1) lookups and to handle potential duplicates
        const dates = new Set(analyticsVerified.map((a: any) => a.date));
        let streak = 1;
        let expectedDate = yesterdayStr;

        // Count backwards from yesterday
        while (dates.has(expectedDate)) {
            streak++;
            const expDate = new Date(expectedDate);
            expDate.setUTCDate(expDate.getUTCDate() - 1);
            expectedDate = expDate.toISOString().split('T')[0];
        }

        currentStreak = streak;
    }

    // Find longest streak from existing data or current streak
    let maxPreviousStreak = 0;
    for (const a of analyticsVerified) {
        if (a.longest_streak > maxPreviousStreak) {
            maxPreviousStreak = a.longest_streak;
        }
    }
    const longestStreak = Math.max(maxPreviousStreak, currentStreak);

    return { currentStreak, longestStreak };
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
