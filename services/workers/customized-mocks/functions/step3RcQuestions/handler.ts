import { supabase } from '../../../../config/supabase';
import { StateManager } from '../../shared/stateManager';
import { FunctionInvoker } from '../../shared/functionInvoker';
import { ErrorHandler } from '../../shared/errorHandler';
import { generateRCQuestions } from '../../core/questions/rc';
import { StepResult } from '../../types/state';
import { CostTracker } from '../../retrieval/utils/CostTracker';

export interface Step3Params {
    exam_id: string;
}

export async function handleStep3RcQuestions(params: Step3Params): Promise<StepResult> {
    const { exam_id } = params;

    console.log(`🚀 [Step 3] Starting RC question generation for exam: ${exam_id}`);

    try {
        return await ErrorHandler.withErrorHandling(exam_id, 'Step 3: RC Questions', async () => {
            // Load state
            const state = await StateManager.load(exam_id);
            const { passages_ids, params: originalParams, reference_data_rc } = state;

            if (!passages_ids || passages_ids.length === 0) {
                throw new Error('No passages found in state');
            }

            // Load passages from database
            const { data: passages, error: passagesError } = await supabase
                .from('passages')
                .select('*')
                .in('id', passages_ids);

            if (passagesError || !passages) {
                throw new Error(`Failed to load passages: ${passagesError?.message}`);
            }

            console.log(`📚 [Step 3] Generating RC questions for ${passages.length} passages`);

            const costTracker = new CostTracker();
            const rcQuestionIds: string[] = [];

            // Determine questions per passage
            const questionsPerPassage = originalParams.question_type_distribution?.rc_questions || 4;

            // Generate RC questions for each passage
            for (let i = 0; i < passages.length; i++) {
                const passage = passages[i];
                console.log(`   Generating RC questions for passage ${i + 1}/${passages.length}`);

                const questions = await generateRCQuestions({
                    passageData: {
                        passageData: passage
                    },
                    referenceData: reference_data_rc || [],
                    questionCount: questionsPerPassage,
                    personalization: {
                        targetMetrics: originalParams.target_metrics,
                        weakAreas: originalParams.weak_areas_to_address
                    }
                }, costTracker);

                const rcQuestionsWithPaperId = questions.map(q => ({
                    ...q,
                    paper_id: exam_id,
                }));

                // Save questions
                const { data: savedQuestions, error: questionsError } = await supabase
                    .from('questions')
                    .insert(rcQuestionsWithPaperId)
                    .select('id');

                if (questionsError) {
                    throw new Error(`Failed to save RC questions: ${questionsError.message}`);
                }

                rcQuestionIds.push(...savedQuestions.map(q => q.id));
                console.log(`   ✅ ${questions.length} RC questions saved for passage ${i + 1}`);
            }

            console.log(`✅ [Step 3] All RC questions generated (${rcQuestionIds.length} total)`);

            // Update state
            await StateManager.update(exam_id, {
                status: 'generating_va_questions',
                current_step: 4,
                rc_question_ids: rcQuestionIds
            });

            // Invoke next function
            console.log(`📞 [Step 3] Invoking Step 4: VA Questions`);
            await FunctionInvoker.invokeNext('step-4', { exam_id });

            console.log(`🎉 [Step 3] RC Questions complete!`);

            return {
                success: true,
                exam_id,
                current_step: 3,
                total_steps: 7,
                next_function: 'customized-mocks-va-questions'
            };
        });
    } catch (error) {
        console.error(`❌ [Step 3] Failed:`, error);
        throw error;
    }
}
