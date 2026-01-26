import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../../../config/supabase';
import { ExamGenerationState, GenerationStatus } from '../types/state';

export class StateManager {
    /**
     * Load generation state for daily content
     */
    static async load(examId: string): Promise<ExamGenerationState> {
        console.log(`📖 [StateManager] Loading state for daily content: ${examId}`);

        const { data, error } = await supabase
            .from('exam_generation_state')
            .select('*')
            .eq('exam_id', examId)
            .single();

        if (error) {
            throw new Error(`Failed to load state: ${error.message}`);
        }

        console.log(`✅ [StateManager] State loaded: ${data.status} (step ${data.current_step}/${data.total_steps})`);
        return data;
    }

    /**
     * Update generation state
     */
    static async update(
        examId: string,
        updates: Partial<ExamGenerationState>
    ): Promise<void> {
        console.log(`💾 [StateManager] Updating state for daily content: ${examId}`);

        const { error } = await supabase
            .from('exam_generation_state')
            .update(updates)
            .eq('exam_id', examId);

        if (error) {
            if (error instanceof FunctionsHttpError) {
                const errorContext = await error.context.json();
                throw new Error(`❌ [StateManager] Auth Error:`, errorContext);
            } else {
                throw new Error(`❌ [StateManager] Failed to update state: ${error.message}`);
            }
        }

        console.log(`✅ [StateManager] State updated successfully`);
    }

    /**
     * Mark as failed with error message
     */
    static async markFailed(examId: string, errorMessage: string): Promise<void> {
        console.error(`❌ [StateManager] Marking daily content as failed: ${examId}`);
        console.error(`   Error: ${errorMessage}`);

        await Promise.all([
            supabase
                .from('exam_generation_state')
                .update({
                    status: 'failed' as GenerationStatus,
                    error_message: errorMessage
                })
                .eq('exam_id', examId),
            supabase
                .from('exam_papers')
                .update({ generation_status: 'failed' })
                .eq('id', examId)
        ]);
    }

    /**
     * Mark as completed and cleanup
     */
    static async markCompleted(examId: string): Promise<void> {
        console.log(`🎉 [StateManager] Marking daily content as completed: ${examId}`);

        await supabase
            .from('exam_papers')
            .update({ generation_status: 'completed' })
            .eq('id', examId);

        // Delete state record after completion (cleanup)
        await supabase
            .from('exam_generation_state')
            .delete()
            .eq('exam_id', examId);

        console.log(`✅ [StateManager] Daily content marked as completed and state cleaned up`);
    }

    /**
     * Create initial daily content state
     */
    static async create(
        examId: string,
        genre: string,
        totalSteps: number = 8
    ): Promise<void> {
        console.log(`📝 [StateManager] Creating initial state for daily content: ${examId}`);

        const { error } = await supabase
            .from('exam_generation_state')
            .insert({
                exam_id: examId,
                status: 'initializing' as GenerationStatus,
                current_step: 1,
                total_steps: totalSteps,
                params: {
                    genre_target: genre,
                    generation_type: 'daily'
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (error) {
            throw new Error(`Failed to create state: ${error.message}`);
        }

        console.log(`✅ [StateManager] Initial state created`);
    }
}
