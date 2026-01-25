import { supabase } from '../../../../config/supabase';
import { StateManager } from '../../shared/stateManager';
import { FunctionInvoker } from '../../shared/functionInvoker';
import { ErrorHandler } from '../../shared/errorHandler';
import { selectCorrectAnswers } from '../../core/questions/rc';
import { selectVAAnswers } from '../../core/questions/va';
import { StepResult } from '../../types/state';

export interface Step5Params {
    exam_id: string;
}

export async function handleStep5SelectAnswers(params: Step5Params): Promise<StepResult> {
    const { exam_id } = params;

    console.log(`🚀 [Step 5] Starting answer selection for exam: ${exam_id}`);

    try {
        return await ErrorHandler.withErrorHandling(exam_id, 'Step 5: Select Answers', async () => {
            const state = await StateManager.load(exam_id);
            const { rc_question_ids, va_question_ids, passages_ids } = state;

            // Select RC answers (per passage with passageText)
            if (rc_question_ids && rc_question_ids.length > 0 && passages_ids && passages_ids.length > 0) {
                console.log(`   Selecting answers for ${rc_question_ids.length} RC questions`);

                // Load all passages
                const { data: passages } = await supabase
                    .from('passages')
                    .select('*')
                    .in('id', passages_ids);

                // Process each passage
                for (const passage of passages || []) {
                    const { data: rcQuestions } = await supabase
                        .from('questions')
                        .select('*')
                        .in('id', rc_question_ids)
                        .eq('passage_id', passage.id);

                    if (rcQuestions && rcQuestions.length > 0) {
                        const rcWithAnswers = await selectCorrectAnswers({
                            passageText: passage.content,
                            questions: rcQuestions
                        });

                        // Update questions with answers
                        for (const question of rcWithAnswers) {
                            await supabase
                                .from('questions')
                                .update({ correct_answer: question.correct_answer })
                                .eq('id', question.id);
                        }
                    }
                }

                console.log(`   ✅ RC answers selected`);
            }

            // Select VA answers
            if (va_question_ids && va_question_ids.length > 0) {
                console.log(`   Selecting answers for ${va_question_ids.length} VA questions`);

                const { data: vaQuestions } = await supabase
                    .from('questions')
                    .select('*')
                    .in('id', va_question_ids);

                const vaWithAnswers = await selectVAAnswers({
                    questions: vaQuestions || []
                });

                for (const question of vaWithAnswers) {
                    await supabase
                        .from('questions')
                        .update({ correct_answer: question.correct_answer })
                        .eq('id', question.id);
                }

                console.log(`   ✅ VA answers selected`);
            }

            console.log(`✅ [Step 5] All answers selected`);

            await StateManager.update(exam_id, {
                status: 'generating_rc_rationales',
                current_step: 6
            });

            console.log(`📞 [Step 5] Invoking Step 6: RC Rationales`);
            await FunctionInvoker.invokeNext('step-6', { exam_id });

            return {
                success: true,
                exam_id,
                current_step: 5,
                total_steps: 7,
                next_function: 'customized-mocks-rc-rationales'
            };
        });
    } catch (error) {
        console.error(`❌ [Step 5] Failed:`, error);
        throw error;
    }
}
