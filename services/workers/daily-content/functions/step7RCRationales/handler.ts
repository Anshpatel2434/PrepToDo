import { StateManager } from '../../shared/stateManager';
import { FunctionInvoker } from '../../shared/functionInvoker';
import { ErrorHandler } from '../../shared/errorHandler';
import { supabase } from '../../../../config/supabase';
import { CostTracker } from '../../retrieval/utils/CostTracker';
import { generateBatchRCRationales } from '../../retrieval/rcQuestionsHandling/generateBatchRCRationales';
import { tagQuestionsWithNodes } from '../../retrieval/rcQuestionsHandling/tagQuestionsWithNodes';
import { getQuestionGraphContext } from '../../graph/createReasoningGraphContext';
import { StepResult } from '../../types/state';

export interface Step7Params {
    exam_id: string;
}

export async function handleStep7RCRationales(params: Step7Params): Promise<StepResult> {
    const { exam_id } = params;
    console.log(`🚀 [Step 7] RC Rationales: ${exam_id}`);

    try {
        return await ErrorHandler.withErrorHandling(exam_id, 'Step 7: RC Rationales', async () => {
            // Load state
            console.log(`📖 [Step 7] Loading state`);
            const state = await StateManager.load(exam_id);
            const { passages_ids, rc_question_ids, reference_data_rc } = state;

            if (!passages_ids || passages_ids.length === 0 || !rc_question_ids) {
                throw new Error('Missing required data in state for RC rationale generation');
            }

            //fetch reasoning graph nodes for rationale generation
            console.log(`🧠 [Step 7] Fetching reasoning graph nodes`);
            const { fetchNodes } = await import('../../graph/fetchNodes');
            const reasoning_graph_nodes = await fetchNodes();

            // Fetch passage and RC questions
            const [{ data: passageData, error: passageError },
                { data: questionsData, error: questionsError }] = await Promise.all([
                    supabase.from('passages').select('content').eq('id', passages_ids[0]).single(),
                    supabase.from('questions').select('*').in('id', rc_question_ids)
                ]);

            if (passageError) throw new Error(`Failed to fetch passage: ${passageError.message}`);
            if (questionsError) throw new Error(`Failed to fetch questions: ${questionsError.message}`);

            const passageText = passageData.content;
            const questions = questionsData || [];

            // Tag questions with reasoning nodes
            console.log(`🏷️ [Step 7] Tagging RC questions with reasoning nodes`);
            const taggedQuestions = await tagQuestionsWithNodes({
                passageText,
                questions
            });

            // Build reasoning graph context
            console.log(`🕸️ [Step 7] Building reasoning graph context`);
            const reasoningContexts = await getQuestionGraphContext(taggedQuestions, reasoning_graph_nodes);

            // Generate batch rationales
            console.log(`🧾 [Step 7] Generating rationales for RC questions`);
            const costTracker = new CostTracker();

            const questionsWithRationales = await generateBatchRCRationales({
                passageText,
                questions: questions,
                reasoningContexts,
                referenceData: reference_data_rc || []
            }, costTracker);

            // Update questions with rationales and tags in database
            console.log(`💾 [Step 7] Saving rationales and reasoning graph tags`);
            for (const question of questionsWithRationales) {
                const { error } = await supabase
                    .from('questions')
                    .update({
                        rationale: question.rationale,
                    })
                    .eq('id', question.id);

                if (error) {
                    throw new Error(`Failed to update rationale for question ${question.id}: ${error.message}`);
                }
            }

            // Update state
            await StateManager.update(exam_id, {
                status: 'initializing',
                current_step: 8,
            });

            // Move to final step
            console.log(`📞 [Step 7] Invoking Step 8: VA Rationales`);
            await FunctionInvoker.invokeNext('step-8', { exam_id });

            console.log(`🎉 [Step 7] RC rationales generated!`);
            costTracker.printReport();

            return {
                success: true,
                exam_id,
                current_step: 7,
                total_steps: 8,
                next_function: 'daily-content-va-rationales'
            };
        });
    } catch (error) {
        console.error(`❌ [Step 7] Failed:`, error);
        throw error;
    }
}