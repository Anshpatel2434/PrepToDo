// =============================================================================
// Admin Feature - Financials Controller
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { db } from '../../../db/index.js';
import { adminAiCostLog } from '../../../db/schema.js';
import { desc, sql, gte, sum } from 'drizzle-orm';
import { successResponse } from '../../../common/utils/errors.js';

// =============================================================================
// Get AI Cost Breakdown
// =============================================================================
export async function getCostBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { timeframe } = req.query; // 'day', 'week', 'month'

        let startDate = new Date();
        if (timeframe === 'week') startDate.setDate(startDate.getDate() - 7);
        else if (timeframe === 'month') startDate.setMonth(startDate.getMonth() - 1);
        else startDate.setHours(0, 0, 0, 0); // Default 'day'

        // Aggregate by worker type
        const costsByWorker = await db.select({
            workerType: adminAiCostLog.worker_type,
            totalCost: sum(adminAiCostLog.cost_cents),
            queryCount: sql<number>`count(*)`
        })
            .from(adminAiCostLog)
            .where(gte(adminAiCostLog.created_at, startDate))
            .groupBy(adminAiCostLog.worker_type);

        // Aggregate by function name (top 10 expensive functions)
        const costsByFunction = await db.select({
            functionName: adminAiCostLog.function_name,
            totalCost: sum(adminAiCostLog.cost_cents),
            queryCount: sql<number>`count(*)`
        })
            .from(adminAiCostLog)
            .where(gte(adminAiCostLog.created_at, startDate))
            .groupBy(adminAiCostLog.function_name)
            .orderBy(desc(sum(adminAiCostLog.cost_cents)))
            .limit(10);

        res.json(successResponse({
            timeframe: timeframe || 'day',
            startDate,
            byWorker: costsByWorker.map(c => ({ ...c, totalCost: Number(c.totalCost) })),
            byFunction: costsByFunction.map(c => ({ ...c, totalCost: Number(c.totalCost) }))
        }));
    } catch (error) {
        next(error);
    }
}
