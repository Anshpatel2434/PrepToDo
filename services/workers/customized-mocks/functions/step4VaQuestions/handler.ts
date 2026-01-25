import { supabase } from '../../../../config/supabase';
import { StateManager } from '../../shared/stateManager';
import { FunctionInvoker } from '../../shared/functionInvoker';
import { ErrorHandler } from '../../shared/errorHandler';
import { generateVAQuestions } from '../../core/questions/va';
import { StepResult } from '../../types/state';
import { CostTracker } from '../../retrieval/utils/CostTracker';

export interface Step4Params {
    exam_id: string;
}

export async function handleStep4VaQuestions(params: Step4Params): Promise<StepResult> {
    const { exam_id } = params;

    console.log(`🚀 [Step 4] Starting VA question generation for exam: ${exam_id}`);

    try {
        return await ErrorHandler.withErrorHandling(exam_id, 'Step 4: VA Questions', async () => {
            const state = await StateManager.load(exam_id);
            const { passages_ids, articles_data, params: originalParams, reference_data_va } = state;

            if (!passages_ids || passages_ids.length === 0) {
                throw new Error('No passages found in state');
            }

            if (!articles_data || articles_data.length === 0) {
                throw new Error('No articles data found in state');
            }

            const { data: passages } = await supabase
                .from('passages')
                .select('*')
                .in('id', passages_ids);

            if (!passages || passages.length === 0) {
                throw new Error('Failed to load passages');
            }

            console.log(`📚 [Step 4] Generating VA questions`);

            const costTracker = new CostTracker();
            const distribution = originalParams.question_type_distribution || {};
            const allVaQuestions: any[] = [];

            // Helper to get article/passage data with fallback
            const getArticleData = (index: number) => articles_data[index] || articles_data[0];
            const getPassageContent = (index: number) => passages[index]?.content || passages[0]?.content || '';

            // Generate each VA question type separately (matching runCustomizedMock.ts)
            const questionTypes = [
                { type: 'para_summary', count: distribution.para_summary || 2, index: 0 },
                { type: 'para_completion', count: distribution.para_completion || 2, index: 1 },
                { type: 'para_jumble', count: distribution.para_jumble || 2, index: 2 },
                { type: 'odd_one_out', count: distribution.odd_one_out || 2, index: 3 }
            ];

            for (const { type, count, index } of questionTypes) {
                if (count > 0) {
                    console.log(`   Generating ${count} ${type} questions`);

                    const articleData = getArticleData(index % articles_data.length);
                    const passageText = getPassageContent(index % passages.length);

                    const questions = await generateVAQuestions({
                        semanticIdeas: articleData.semantic_ideas,
                        authorialPersona: articleData.authorial_persona,
                        referenceData: reference_data_va || [],
                        passageText: passageText,
                        questionDistribution: {
                            para_summary: type === 'para_summary' ? count : 0,
                            para_completion: type === 'para_completion' ? count : 0,
                            para_jumble: type === 'para_jumble' ? count : 0,
                            odd_one_out: type === 'odd_one_out' ? count : 0
                        },
                        personalization: {
                            targetMetrics: originalParams.target_metrics,
                            weakAreas: originalParams.weak_areas_to_address
                        }
                    }, costTracker);

                    allVaQuestions.push(...questions.map(q => ({
                        ...q,
                        paper_id: exam_id,
                    })));
                    console.log(`   ✅ Generated ${questions.length} ${type} questions`);
                }
            }

            // Save all VA questions to database
            const { data: savedQuestions, error } = await supabase
                .from('questions')
                .insert(allVaQuestions)
                .select('id');

            if (error) {
                throw new Error(`Failed to save VA questions: ${error.message}`);
            }

            const vaQuestionIds = savedQuestions.map(q => q.id);
            console.log(`✅ [Step 4] ${vaQuestionIds.length} VA questions generated and saved`);

            await StateManager.update(exam_id, {
                status: 'selecting_answers',
                current_step: 5,
                va_question_ids: vaQuestionIds
            });

            console.log(`📞 [Step 4] Invoking Step 5: Select Answers`);
            await FunctionInvoker.invokeNext('step-5', { exam_id });

            return {
                success: true,
                exam_id,
                current_step: 4,
                total_steps: 7,
                next_function: 'customized-mocks-select-answers'
            };
        });
    } catch (error) {
        console.error(`❌ [Step 4] Failed:`, error);
        throw error;
    }
}
