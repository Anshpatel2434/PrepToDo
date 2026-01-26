import { StateManager } from '../../shared/stateManager';
import { FunctionInvoker } from '../../shared/functionInvoker';
import { ErrorHandler } from '../../shared/errorHandler';
import { supabase } from '../../../../config/supabase';
import { CostTracker } from '../../retrieval/utils/CostTracker';
import { selectCorrectAnswers } from '../../retrieval/rcQuestionsHandling/selectCorrectAnswers';
import { StepResult } from '../../types/state';

export interface Step4Params {
    exam_id: string;
}

export async function handleStep4RCAnswers(params: Step4Params): Promise<StepResult> {
    const { exam_id } = params;
    console.log(`🚀 [Step 4] RC Answers: ${exam_id}`);

    try {
        return await ErrorHandler.withErrorHandling(exam_id, 'Step 4: RC Answers', async () => {
            // Load state
            console.log(`📖 [Step 4] Loading state`);
            const state = await StateManager.load(exam_id);
            const { passage_id, rc_question_ids } = state;

            if (!passage_id || !rc_question_ids || rc_question_ids.length === 0) {
                throw new Error('Missing passage_id or rc_question_ids in state');
            }

            // Fetch passage content and RC questions
            const [{ data: passageData, error: passageError },
                  { data: questionsData, error: questionsError }] = await Promise.all([
                supabase.from('passages').select('content').eq('id', passage_id).single(),
                supabase.from('questions').select('*').in('id', rc_question_ids)
            ]);

            if (passageError) throw new Error(`Failed to fetch passage: ${passageError.message}`);
            if (questionsError) throw new Error(`Failed to fetch questions: ${questionsError.message}`);

            const passageText = passageData.content;
            const questions = questionsData || [];

            // Select answers for RC questions
            console.log(`✅ [Step 4] Selecting correct answers for ${questions.length} RC questions`);
            const costTracker = new CostTracker();

            const questionsWithAnswers = await selectCorrectAnswers({
                passageText,
                questions
            }, costTracker);

            // Update questions with answers in database
            console.log(`💾 [Step 4] Saving answers`);
            for (const question of questionsWithAnswers) {
                const { error } = await supabase
                    .from('questions')
                    .update({ correct_option: question.correct_option })
                    .eq('id', question.id);

                if (error) {
                    throw new Error(`Failed to update answer for question ${question.id}: ${error.message}`);
                }
            }

            // Update state
            await StateManager.update(exam_id, {
                status: 'generating_va_questions',
                current_step: 5
            });

            // Move to next step
            console.log(`📞 [Step 4] Invoking Step 5: VA Questions`);
            await FunctionInvoker.invokeNext('step-5', { exam_id });

            console.log(`🎉 [Step 4] RC answers selected!`);
            costTracker.printReport();

            return {
                success: true,
                exam_id,
                current_step: 4,
                total_steps: 8,
                next_function: 'daily-content-va-questions'
            };
        });
    } catch (error) {
        console.error(`❌ [Step 4] Failed:`, error);
        throw error;
    }
}

// Add costTracker parameter compatibility for the selectCorrectAnswers function
// Ensure it matches the signature expected by the retrieval function