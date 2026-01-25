import { supabase } from '../../../../config/supabase';
import { StateManager } from '../../shared/stateManager';
import { ErrorHandler } from '../../shared/errorHandler';
import { generateBatchVARationales } from '../../core/questions/va';
import { fetchNodes, tagVAQuestionsWithNodes, getQuestionGraphContext } from '../../core/reasoning';
import { StepResult } from '../../types/state';
import { CostTracker } from '../../retrieval/utils/CostTracker';

export interface Step7Params {
    exam_id: string;
}

export async function handleStep7VaRationales(params: Step7Params): Promise<StepResult> {
    const { exam_id } = params;

    console.log(`🚀 [Step 7] Starting VA rationale generation for exam: ${exam_id}`);

    try {
        return await ErrorHandler.withErrorHandling(exam_id, 'Step 7: VA Rationales', async () => {
            const state = await StateManager.load(exam_id);
            const { va_question_ids, reference_data_va } = state;

            if (!va_question_ids || va_question_ids.length === 0) {
                console.log(`⚠️ [Step 7] No VA questions found, skipping`);
                await StateManager.markCompleted(exam_id);
                return { success: true, exam_id, current_step: 7, total_steps: 7 };
            }

            const { data: vaQuestions } = await supabase
                .from('questions')
                .select('*')
                .in('id', va_question_ids);

            console.log(`📚 [Step 7] Generating rationales for ${vaQuestions?.length} VA questions`);

            const costTracker = new CostTracker();
            const nodes = await fetchNodes();

            // Use correct VA tagging function
            const tagged = await tagVAQuestionsWithNodes({
                questions: vaQuestions || []
            });

            const context = await getQuestionGraphContext(tagged, nodes);

            const withRationales = await generateBatchVARationales({
                questions: vaQuestions || [],
                reasoningContexts: context,
                referenceData: reference_data_va || []
            }, costTracker);

            for (const question of withRationales) {
                await supabase
                    .from('questions')
                    .update({
                        rationale: question.rationale,
                        tags: question.tags
                    })
                    .eq('id', question.id);
            }

            console.log(`✅ [Step 7] VA rationales generated`);

            // Mark as completed
            await StateManager.markCompleted(exam_id);

            console.log(`🎉 [Step 7] Mock generation COMPLETE!`);

            return {
                success: true,
                exam_id,
                current_step: 7,
                total_steps: 7
            };
        });
    } catch (error) {
        console.error(`❌ [Step 7] Failed:`, error);
        throw error;
    }
}
