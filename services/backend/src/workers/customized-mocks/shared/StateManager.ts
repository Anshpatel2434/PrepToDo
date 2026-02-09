import { db } from "../../../db";
import { examGenerationState, examPapers } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { ExamGenerationState } from "../../../db/schema";
import { createChildLogger } from "../../../common/utils/logger.js";

const logger = createChildLogger('state-manager');

export class StateManager {
    /**
     * Load generation state for an exam
     */
    static async load(examId: string): Promise<ExamGenerationState> {
        logger.info(`📖 [StateManager] Loading state for exam: ${examId}`);

        const [state] = await db
            .select()
            .from(examGenerationState)
            .where(eq(examGenerationState.exam_id, examId));

        if (!state) {
            throw new Error(`Failed to load state: State not found for exam ${examId}`);
        }

        logger.info(`✅ [StateManager] State loaded: ${state.status} (step ${state.current_step}/${state.total_steps}`);
        return state;
    }

    /**
     * Update generation state
     */
    static async update(
        examId: string,
        updates: Partial<ExamGenerationState>
    ): Promise<void> {
        logger.info(`💾 [StateManager] Updating state for exam: ${examId}`);

        await db
            .update(examGenerationState)
            .set(updates)
            .where(eq(examGenerationState.exam_id, examId));

        logger.info(`✅ [StateManager] State updated successfully`);
    }

    /**
     * Mark as failed with error message
     */
    static async markFailed(examId: string, errorMessage: string): Promise<void> {
        logger.error(`❌ [StateManager] Marking exam as failed: ${examId}`);
        logger.error(`   Error: ${errorMessage}`);

        await db
            .update(examGenerationState)
            .set({
                status: 'failed',
                error_message: errorMessage
            })
            .where(eq(examGenerationState.exam_id, examId));

        await db
            .update(examPapers)
            .set({ generation_status: 'failed' })
            .where(eq(examPapers.id, examId));
    }

    /**
     * Mark as completed and cleanup
     */
    static async markCompleted(examId: string): Promise<void> {
        logger.info(`🎉 [StateManager] Marking exam as completed: ${examId}`);

        await db
            .update(examPapers)
            .set({ generation_status: 'completed' })
            .where(eq(examPapers.id, examId));

        // Delete state record after completion (cleanup)
        await db
            .delete(examGenerationState)
            .where(eq(examGenerationState.exam_id, examId));

        logger.info(`✅ [StateManager] Exam marked as completed and state cleaned up`);
    }
}
