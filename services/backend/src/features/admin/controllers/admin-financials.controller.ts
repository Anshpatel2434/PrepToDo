// =============================================================================
// Admin Feature - Financials Controller
// =============================================================================
import type { Request, Response, NextFunction } from 'express';
import { db } from '../../../db/index.js';
import { adminAiCostLog, users } from '../../../db/schema.js';
import { desc, sql, gte, sum } from 'drizzle-orm';
import { successResponse } from '../../../common/utils/errors.js';
import { createChildLogger } from '../../../common/utils/logger.js';

const logger = createChildLogger('admin-financials');

// =============================================================================
// Get Financial Summary (Revenue, Costs, Margins)
// =============================================================================
export async function getFinancialSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        thisMonthStart.setHours(0, 0, 0, 0);

        const [totalAiCost, thisMonthAiCost, costsByWorker] = await Promise.all([
            // Total AI cost (lifetime)
            db.select({ total: sql<number>`COALESCE(sum(cost_cents), 0)` })
                .from(adminAiCostLog)
                .then(r => Number(r[0].total)),

            // This month AI cost
            db.select({ total: sql<number>`COALESCE(sum(cost_cents), 0)` })
                .from(adminAiCostLog)
                .where(gte(adminAiCostLog.created_at, thisMonthStart))
                .then(r => Number(r[0].total)),

            // Breakdown by worker type
            db.select({
                workerType: adminAiCostLog.worker_type,
                totalCost: sql<number>`COALESCE(sum(cost_cents), 0)`,
            })
                .from(adminAiCostLog)
                .groupBy(adminAiCostLog.worker_type),
        ]);

        // Build breakdown object
        const breakdown: Record<string, number> = {};
        costsByWorker.forEach(w => {
            breakdown[w.workerType] = Number(w.totalCost);
        });

        res.json(successResponse({
            revenue: {
                total: 0,           // No payments table yet
                thisMonth: 0,       // No payments table yet
                growth: 0,
            },
            costs: {
                totalAi: totalAiCost,
                thisMonthAi: thisMonthAiCost,
                breakdown: {
                    dailyContent: breakdown['daily_content'] || 0,
                    mocks: breakdown['customized_mocks'] || 0,
                    analytics: breakdown['analytics'] || 0,
                    teaching: breakdown['teaching_concept'] || 0,
                },
            },
            margins: {
                gross: totalAiCost > 0 ? 0 : 100, // No revenue yet, so margin is 0 if costs exist
            },
        }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Get AI Cost Breakdown (by model, worker, function)
// =============================================================================
export async function getAiCosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const [totalCost, totalTokens, costsByModel, costsByWorker, costsByFunction] = await Promise.all([
            // Total cost
            db.select({ total: sql<number>`COALESCE(sum(cost_cents), 0)` })
                .from(adminAiCostLog)
                .then(r => Number(r[0].total)),

            // Total tokens
            db.select({
                totalInput: sql<number>`COALESCE(sum(input_tokens), 0)`,
                totalOutput: sql<number>`COALESCE(sum(output_tokens), 0)`,
            })
                .from(adminAiCostLog)
                .then(r => Number(r[0].totalInput) + Number(r[0].totalOutput)),

            // By model
            db.select({
                modelName: adminAiCostLog.model_name,
                totalCost: sql<number>`COALESCE(sum(cost_cents), 0)`,
                callCount: sql<number>`count(*)`,
            })
                .from(adminAiCostLog)
                .groupBy(adminAiCostLog.model_name),

            // By worker
            db.select({
                workerType: adminAiCostLog.worker_type,
                totalCost: sql<number>`COALESCE(sum(cost_cents), 0)`,
                callCount: sql<number>`count(*)`,
            })
                .from(adminAiCostLog)
                .groupBy(adminAiCostLog.worker_type),

            // Top 10 expensive functions
            db.select({
                functionName: adminAiCostLog.function_name,
                totalCost: sql<number>`COALESCE(sum(cost_cents), 0)`,
                callCount: sql<number>`count(*)`,
            })
                .from(adminAiCostLog)
                .groupBy(adminAiCostLog.function_name)
                .orderBy(desc(sql`sum(cost_cents)`))
                .limit(10),
        ]);

        // Convert to frontend-expected format
        const byModel: Record<string, number> = {};
        costsByModel.forEach(m => { byModel[m.modelName] = Number(m.totalCost); });

        const byWorker: Record<string, number> = {};
        costsByWorker.forEach(w => { byWorker[w.workerType] = Number(w.totalCost); });

        res.json(successResponse({
            totalCost,
            totalTokens,
            byModel,
            byWorker,
            byFunction: costsByFunction.map(f => ({
                name: f.functionName,
                cost: Number(f.totalCost),
                calls: Number(f.callCount),
            })),
        }));
    } catch (error) {
        next(error);
    }
}

// =============================================================================
// Get AI Cost Time-series Breakdown (kept from original)
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
