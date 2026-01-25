import { supabase } from '../../../../config/supabase';
import { StateManager } from '../../shared/stateManager';
import { FunctionInvoker } from '../../shared/functionInvoker';
import { ErrorHandler } from '../../shared/errorHandler';
import { generateBatchRCRationales } from '../../core/questions/rc';
import { fetchNodes, tagQuestionsWithNodes, getQuestionGraphContext } from '../../core/reasoning';
import { StepResult } from '../../types/state';
import { CostTracker } from '../../retrieval/utils/CostTracker';

export interface Step6Params {
    exam_id: string;
}

export async function handleStep6RcRationales(params: Step6Params): Promise<StepResult> {
    const { exam_id } = params;

    console.log(`🚀 [Step 6] Starting RC rationale generation for exam: ${exam_id}`);

    try {
        return await ErrorHandler.withErrorHandling(exam_id, 'Step 6: RC Rationales', async () => {
            const state = await StateManager.load(exam_id);
            const { rc_question_ids, passages_ids, reference_data_rc } = state;

            if (!rc_question_ids || rc_question_ids.length === 0) {
                console.log(`⚠️ [Step 6] No RC questions found, skipping`);
                await StateManager.update(exam_id, {
                    status: 'generating_va_rationales',
                    current_step: 7
                });
                await FunctionInvoker.invokeNext('step-7', { exam_id });
                return { success: true, exam_id, current_step: 6, total_steps: 7 };
            }

            const { data: rcQuestions } = await supabase
                .from('questions')
                .select('*')
                .in('id', rc_question_ids);

            console.log(`📚 [Step 6] Generating rationales for ${rcQuestions?.length} RC questions`);

            const costTracker = new CostTracker();
            const nodes = await fetchNodes();

            // Load all passages for tagging
            const { data: passages } = await supabase
                .from('passages')
                .select('*')
                .in('id', passages_ids || []);

            const allPassageTexts = passages?.map(p => p.content).join('\n\n---\n\n') || '';

            // Tag questions with nodes
            const tagged = await tagQuestionsWithNodes({
                passageText: allPassageTexts,
                questions: rcQuestions || []
            });

            const context = await getQuestionGraphContext(tagged, nodes);

            // Generate rationales per passage
            for (const passage of passages || []) {
                const passageQuestions = (rcQuestions || []).filter(q => q.passage_id === passage.id);

                if (passageQuestions.length > 0) {
                    const withRationales = await generateBatchRCRationales({
                        passageText: passage.content,
                        questions: passageQuestions,
                        reasoningContexts: context,
                        referenceData: reference_data_rc || []
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
                }
            }

            console.log(`✅ [Step 6] RC rationales generated`);

            await StateManager.update(exam_id, {
                status: 'generating_va_rationales',
                current_step: 7
            });

            console.log(`📞 [Step 6] Invoking Step 7: VA Rationales`);
            await FunctionInvoker.invokeNext('step-7', { exam_id });

            return {
                success: true,
                exam_id,
                current_step: 6,
                total_steps: 7,
                next_function: 'customized-mocks-va-rationales'
            };
        });
    } catch (error) {
        console.error(`❌ [Step 6] Failed:`, error);
        throw error;
    }
}
