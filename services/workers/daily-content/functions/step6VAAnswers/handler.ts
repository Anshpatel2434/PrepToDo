import { StateManager } from '../../shared/stateManager';
import { FunctionInvoker } from '../../shared/functionInvoker';
import { ErrorHandler } from '../../shared/errorHandler';
import { supabase } from '../../../../config/supabase';
import { CostTracker } from '../../retrieval/utils/CostTracker';
import { selectVAAnswers } from '../../retrieval/vaQuestionsHandling/selectVAAnswers';
import { StepResult } from '../../types/state';

export interface Step6Params {
    exam_id: string;
}

export async function handleStep6VAAnswers(params: Step6Params): Promise<StepResult> {
    const { exam_id } = params;
    console.log(`🚀 [Step 6] VA Answers: ${exam_id}`);

    try {
        return await ErrorHandler.withErrorHandling(exam_id, 'Step 6: VA Answers', async () => {
            // Load state
            console.log(`📖 [Step 6] Loading state`);
            const state = await StateManager.load(exam_id);
            const { va_question_ids } = state;

            if (!va_question_ids || va_question_ids.length === 0) {
                throw new Error('No va_question_ids found in state');
            }

            // Fetch VA questions
            const { data: questionsData, error: questionsError } = await supabase
                .from('questions')
                .select('*')
                .in('id', va_question_ids);

            if (questionsError) {
                throw new Error(`Failed to fetch questions: ${questionsError.message}`);
            }

            const questions = questionsData || [];

            // Select answers for VA questions
            console.log(`✅ [Step 6] Selecting correct answers for ${questions.length} VA questions`);
            const costTracker = new CostTracker();

            const questionsWithAnswers = await selectVAAnswers({
                questions
            }, costTracker);

            // Update questions with answers in database
            console.log(`💾 [Step 6] Saving answers`);
            for (const question of questionsWithAnswers) {
                const { error } = await supabase
                    .from('questions')
                    .update({ correct_option: question.correct_option })
                    .eq('id', question.id);

                if (error) {
                    throw new Error(`Failed to update answer for question ${question.id}: ${error.message}`);
                }
            }

            // Update state - fetch reasoning graph nodes for rationale generation
            console.log(`🧠 [Step 6] Fetching reasoning graph nodes`);
            const { fetchNodes } = await import('../../graph/fetchNodes');
            const nodes = await fetchNodes();

            await StateManager.update(exam_id, {
                status: 'generating_rc_rationales',
                current_step: 7,
                reasoning_graph_nodes: nodes
            });

            // Move to next step
            console.log(`📞 [Step 6] Invoking Step 7: RC Rationales`);
            await FunctionInvoker.invokeNext('step-7', { exam_id });

            console.log(`🎉 [Step 6] VA answers selected!`);
            costTracker.printReport();

            return {
                success: true,
                exam_id,
                current_step: 6,
                total_steps: 8,
                next_function: 'daily-content-rc-rationales'
            };
        });
    } catch (error) {
        console.error(`❌ [Step 6] Failed:`, error);
        throw error;
    }
}