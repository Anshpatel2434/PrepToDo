// =============================================================================
// AI Insights Feature - Controller
// =============================================================================
// Generates personalized AI diagnostics for a single incorrect question attempt.
// This replaces the old batch approach (phaseC in analytics pipeline) with
// an on-demand, per-question generation triggered by user action.

import type { Request, Response, NextFunction } from 'express';
import { eq, sql } from 'drizzle-orm';

import { db } from '../../db/index.js';
import { practiceSessions, questionAttempts, questions, users } from '../../db/schema.js';
import { Errors, successResponse } from '../../common/utils/errors.js';
import { createChildLogger } from '../../common/utils/logger.js';
import { CostTracker } from '../../common/utils/CostTracker.js';
import { generateSingleInsight } from '../../workers/analytics/generateSingleInsight.js';
import { extractCorrectAnswerString } from '../../common/utils/parseCorrectAnswer.js';

const logger = createChildLogger('ai-insights');

export async function generateInsight(req: Request, res: Response, next: NextFunction): Promise<void> {
    const costTracker = new CostTracker();
    try {
        const userId = req.user?.userId;
        const { session_id, question_id, attempt_id } = req.body;

        if (!userId) throw Errors.unauthorized();

        // 1. Check user quota
        const [user] = await db
            .select({ ai_insights_remaining: users.ai_insights_remaining })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user || (user.ai_insights_remaining ?? 0) < 1) {
            throw Errors.badRequest('You have no AI insights remaining. Please contact support to get more.');
        }

        // 2. Verify user owns the session
        const session = await db.query.practiceSessions.findFirst({
            where: eq(practiceSessions.id, session_id),
        });

        if (!session || session.user_id !== userId) {
            throw Errors.notFound('Session');
        }

        // 3. Check if insight already exists for this attempt
        const existingAnalytics = typeof session.analytics === 'string'
            ? JSON.parse(session.analytics)
            : session.analytics || {};

        const existingDiagnostics = existingAnalytics.diagnostics || [];
        const alreadyExists = existingDiagnostics.some((d: any) => d.attempt_id === attempt_id);

        if (alreadyExists) {
            const existing = existingDiagnostics.find((d: any) => d.attempt_id === attempt_id);
            res.json(successResponse({ diagnostic: existing, already_existed: true }));
            return;
        }

        // 4. Fetch the question attempt data
        const [attempt] = await db
            .select()
            .from(questionAttempts)
            .where(eq(questionAttempts.id, attempt_id))
            .limit(1);

        if (!attempt || attempt.user_id !== userId) {
            throw Errors.notFound('Attempt');
        }

        // 5. Fetch the question details
        const [question] = await db
            .select()
            .from(questions)
            .where(eq(questions.id, question_id))
            .limit(1);

        if (!question) {
            throw Errors.notFound('Question');
        }

        // 6. Build attempt datum for LLM
        const attemptDatum = {
            attempt_id: attempt.id,
            question_type: question.question_type,
            genre: '', // Genre info might not be available per-question
            metric_keys: question.tags || [],
            correct: attempt.is_correct,
            time_seconds: attempt.time_spent_seconds || 0,
            user_answer: attempt.user_answer,
            question_text: question.question_text,
            options: question.options,
            correct_answer: extractCorrectAnswerString(question.correct_answer),
            jumbled_sentences: question.jumbled_sentences,
        };

        // 7. Generate insight via LLM
        logger.info({ attemptId: attempt_id, questionId: question_id }, 'Generating single AI insight');
        const diagnostic = await generateSingleInsight(userId, attemptDatum, costTracker);

        // 8. Append diagnostic to session analytics
        const updatedDiagnostics = [...existingDiagnostics, diagnostic];
        const updatedAnalytics = {
            ...existingAnalytics,
            diagnostics: updatedDiagnostics,
        };

        await db.update(practiceSessions)
            .set({ analytics: JSON.stringify(updatedAnalytics) })
            .where(eq(practiceSessions.id, session_id));

        // 9. Decrement user's AI insights quota
        await db.update(users)
            .set({ ai_insights_remaining: sql`GREATEST(${users.ai_insights_remaining} - 1, 0)` })
            .where(eq(users.id, userId));

        logger.info({ attemptId: attempt_id }, 'AI insight generated and stored');

        // 10. Persist cost logs
        await costTracker.persistToDb('analytics', userId, undefined, session.id);

        res.json(successResponse({
            diagnostic,
            already_existed: false,
            ai_insights_remaining: (user.ai_insights_remaining ?? 1) - 1,
        }));

    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, 'AI insight generation failed');
        next(error);
    }
}
