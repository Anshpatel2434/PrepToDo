// =============================================================================
// Admin Feature - Content Controller
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { db } from '../../../db/index.js';
import { passages, questions, examPapers } from '../../../db/schema.js';
import { desc, sql, like, or, eq, and, gte } from 'drizzle-orm';
import { successResponse } from '../../../common/utils/errors.js';
import { createChildLogger } from '../../../common/utils/logger.js';

const logger = createChildLogger('admin-content');

// =============================================================================
// Get Content Stats (Aggregated Counts)
// =============================================================================
export async function getContentStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [
            passagesTotal,
            passagesToday,
            questionsTotal,
            questionsToday,
            examsTotal,
            examsToday,
        ] = await Promise.all([
            db.select({ count: sql<number>`count(*)` }).from(passages).then(r => Number(r[0].count)),
            db.select({ count: sql<number>`count(*)` }).from(passages)
                .where(gte(passages.created_at, todayStart))
                .then(r => Number(r[0].count)),
            db.select({ count: sql<number>`count(*)` }).from(questions).then(r => Number(r[0].count)),
            db.select({ count: sql<number>`count(*)` }).from(questions)
                .where(gte(questions.created_at, todayStart))
                .then(r => Number(r[0].count)),
            db.select({ count: sql<number>`count(*)` }).from(examPapers).then(r => Number(r[0].count)),
            db.select({ count: sql<number>`count(*)` }).from(examPapers)
                .where(gte(examPapers.created_at, todayStart))
                .then(r => Number(r[0].count)),
        ]);

        res.json(successResponse({
            passages: { total: passagesTotal, today: passagesToday },
            questions: { total: questionsTotal, today: questionsToday },
            exams: { total: examsTotal, today: examsToday },
        }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Get Passages List
// =============================================================================
export async function getPassages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const offset = (page - 1) * limit;

        const whereClause = search
            ? like(passages.title, `%${search}%`)
            : undefined;

        const [totalCountRes, items] = await Promise.all([
            db.select({ count: sql<number>`count(*)` })
                .from(passages)
                .where(whereClause),

            db.query.passages.findMany({
                where: whereClause,
                limit,
                offset,
                orderBy: [desc(passages.created_at)],
                with: {
                    questions: {
                        columns: { id: true } // Just to get count
                    }
                }
            })
        ]);

        const total = Number(totalCountRes[0].count);

        res.json(successResponse({
            passages: items.map(p => ({
                ...p,
                questionCount: p.questions.length
            })),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Get Questions List
// =============================================================================
export async function getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const type = req.query.type as string;
        const offset = (page - 1) * limit;

        let whereClause = undefined;
        const conditions = [];

        if (search) conditions.push(like(questions.question_text, `%${search}%`));
        if (type) conditions.push(eq(questions.question_type, type as any));

        if (conditions.length > 0) {
            whereClause = and(...conditions);
        }

        const [totalCountRes, items] = await Promise.all([
            db.select({ count: sql<number>`count(*)` })
                .from(questions)
                .where(whereClause),

            db.query.questions.findMany({
                where: whereClause,
                limit,
                offset,
                orderBy: [desc(questions.created_at)],
                with: {
                    passage: {
                        columns: { title: true }
                    }
                }
            })
        ]);

        const total = Number(totalCountRes[0].count);

        res.json(successResponse({
            questions: items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Get Exams List
// =============================================================================
export async function getExams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const offset = (page - 1) * limit;

        const whereClause = search
            ? like(examPapers.name, `%${search}%`)
            : undefined;

        const [totalCountRes, items] = await Promise.all([
            db.select({ count: sql<number>`count(*)` })
                .from(examPapers)
                .where(whereClause),

            db.query.examPapers.findMany({
                where: whereClause,
                limit,
                offset,
                orderBy: [desc(examPapers.created_at)],
            })
        ]);

        const total = Number(totalCountRes[0].count);

        res.json(successResponse({
            exams: items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        }));
    } catch (error) {
        next(error);
    }
}
