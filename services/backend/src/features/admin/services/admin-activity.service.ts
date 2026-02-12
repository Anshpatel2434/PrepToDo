import { db } from '../../../db/index.js';
import { adminUserActivityLog } from '../../../db/schema.js';
import { createChildLogger } from '../../../common/utils/logger.js';

const logger = createChildLogger('admin-activity-service');

export class AdminActivityService {
    /**
     * Log a user login event
     */
    static async logLogin(userId: string, metadata?: Record<string, any>): Promise<void> {
        try {
            await db.insert(adminUserActivityLog).values({
                user_id: userId,
                event_type: 'login',
                metadata: metadata || {},
                created_at: new Date()
            });
        } catch (error) {
            logger.error({ error, userId }, 'Failed to log login activity');
            // Non-blocking error
        }
    }

    /**
     * Log a practice session start
     */
    static async logSessionStart(userId: string, sessionId: string, sessionType: string): Promise<void> {
        try {
            await db.insert(adminUserActivityLog).values({
                user_id: userId,
                event_type: 'session_start',
                metadata: { session_id: sessionId, session_type: sessionType },
                created_at: new Date()
            });
        } catch (error) {
            logger.error({ error, userId, sessionId }, 'Failed to log session start activity');
        }
    }

    /**
     * Log an exam generation event
     */
    static async logExamGeneration(userId: string, examId: string, metadata: Record<string, any>): Promise<void> {
        try {
            await db.insert(adminUserActivityLog).values({
                user_id: userId,
                event_type: 'exam_generation',
                metadata: { exam_id: examId, ...metadata },
                created_at: new Date()
            });
        } catch (error) {
            logger.error({ error, userId, examId }, 'Failed to log exam generation activity');
        }
    }
}
