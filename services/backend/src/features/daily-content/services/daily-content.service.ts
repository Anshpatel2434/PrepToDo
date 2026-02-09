// =============================================================================
// Daily Content Feature - Service
// =============================================================================
// Connects the controller to the worker

import { runDailyContent } from "../../../workers/daily-content/runDailyContent.js";
import { config } from '../../../config/index.js';
import { db } from "../../../db/index.js";
import { examPapers } from "../../../db/schema.js";
import { eq, and, gte, lte } from "drizzle-orm";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger('daily-content-service');

export class DailyContentService {
    /**
     * Generate daily content
     * @param options.force - If true, regenerate even if content exists for today
     */
    static async generateDailyContent(options: { force?: boolean } = {}): Promise<{
        success: boolean;
        exam_id?: string;
        message: string;
    }> {
        const { force = false } = options;

        try {
            // Check if content already exists for today
            if (!force) {
                const today = new Date().toISOString().split('T')[0];
                const startOfToday = new Date(`${today}T00:00:00.000Z`);
                const endOfToday = new Date(`${today}T23:59:59.999Z`);

                const existingExam = await db.query.examPapers.findFirst({
                    where: and(
                        eq(examPapers.name, 'Daily Practice'),
                        eq(examPapers.generation_status, 'completed'),
                        gte(examPapers.created_at, startOfToday),
                        lte(examPapers.created_at, endOfToday)
                    ),
                });

                if (existingExam) {
                    logger.info({ examId: existingExam.id }, 'Content already exists for today');
                    return {
                        success: true,
                        exam_id: existingExam.id,
                        message: 'Daily content already exists for today',
                    };
                }
            }

            logger.info('Starting daily content generation...');

            // Run the worker
            const result = await runDailyContent();

            if (result.success) {
                return {
                    success: true,
                    exam_id: result.exam_id,
                    message: result.message || 'Daily content generated successfully',
                };
            } else {
                return {
                    success: false,
                    message: result.error || 'Failed to generate daily content',
                };
            }
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating daily content');
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
}
