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

        console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% today : ", today)
    
    // Determine if this is a real session or just a streak update
    const isStreakUpdateOnly = session_id === null || dataset.length === 0;

    console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% isStreakUpdateOnly : ", isStreakUpdateOnly)

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
    console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Reading speed wm : ", reading_speed_wpm)
    console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% session_id : ", session_id)
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

    // 8. Fetch existing analytics for today to handle multiple sessions
    const { data: existingAnalyticsList } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', user_id)
        .eq('date', today)
        .order('created_at', { ascending: false });

    const existingAnalytics = existingAnalyticsList?.[0] || null;

    // 9. Determine if user has any completed sessions for this date (streak criteria)
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

    // 7. Build the analytics data
    const analyticsData: PhaseFResult = {
        user_id,
        date: today,
        minutes_practiced,
        questions_attempted,
        questions_correct,
        accuracy_percentage,
        is_active_day: hasSessionToday,
        points_earned_today,
        genre_performance: genrePerformance,
        difficulty_performance: difficultyPerformance,
        question_type_performance: questionTypePerformance,
        reading_speed_wpm,
    };

    // 10. Calculate streaks
    const streakData = await calculateStreaks(supabase, user_id, today, hasSessionToday);

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
        is_active_day: hasSessionToday,
        current_streak: streakData.currentStreak,
        longest_streak: streakData.longestStreak,
        points_earned_today: (existingAnalytics?.points_earned_today || 0) + points_earned_today,
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
 * Fixed to properly check if user actually has sessions for today
 */
async function calculateStreaks(
    supabase: any,
    user_id: string,
    today: string,
    hasSessionToday: boolean
): Promise<{ currentStreak: number; longestStreak: number }> {
    try {
        // Fetch all active days for this user (including today if it exists)
        const { data: analytics, error } = await supabase
            .from('user_analytics')
            .select('date, longest_streak')
            .eq('user_id', user_id)
            .eq('is_active_day', true)
            .order('date', { ascending: false });

        if (error) {
            console.error('⚠️ Error fetching analytics for streak calculation:', error);
            // Return safe defaults
            return { currentStreak: hasSessionToday ? 1 : 0, longestStreak: hasSessionToday ? 1 : 0 };
        }

        // If no analytics exist yet and user has a session today, this is their first day
        if (!analytics || analytics.length === 0) {
            return { currentStreak: hasSessionToday ? 1 : 0, longestStreak: hasSessionToday ? 1 : 0 };
        }

        // Build set of active dates (excluding today initially to avoid counting it twice)
        const activeDates = new Set<string>(
            analytics.map((a: any) => a.date).filter((d: string) => d !== today)
        );

        // Calculate current streak
        // Per product criteria: streak counts ONLY if the user has any session on this date.
        // If user has no session today, current streak must be 0.
        let currentStreak = 0;
        const todayDate = new Date(today + 'T00:00:00Z');

        if (hasSessionToday) {
            currentStreak = 1;

            // Count consecutive active days backwards starting from yesterday
            const checkDate = new Date(todayDate);
            checkDate.setUTCDate(checkDate.getUTCDate() - 1);

            while (true) {
                const checkDateStr = checkDate.toISOString().split('T')[0];
                if (!activeDates.has(checkDateStr)) break;
                currentStreak++;
                checkDate.setUTCDate(checkDate.getUTCDate() - 1);
            }
        }

        // Find longest streak from historical data
        let maxPreviousStreak = 0;
        for (const a of analytics) {
            if (a.longest_streak && a.longest_streak > maxPreviousStreak) {
                maxPreviousStreak = a.longest_streak;
            }
        }

        // Longest streak is max of current and previous
        const longestStreak = Math.max(maxPreviousStreak, currentStreak);

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
