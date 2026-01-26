import { v4 as uuidv4 } from 'uuid';
import { StateManager } from '../../shared/stateManager';
import { FunctionInvoker } from '../../shared/functionInvoker';
import { ErrorHandler } from '../../shared/errorHandler';
import { supabase } from '../../../../config/supabase';
import { CostTracker } from '../../retrieval/utils/CostTracker';
import { generateAllVAQuestions } from '../../retrieval/vaQuestionsHandling/generateAllVAQuestions';
import { StepResult } from '../../types/state';

export interface Step5Params {
    exam_id: string;
}

export async function handleStep5VAQuestions(params: Step5Params): Promise<StepResult> {
    const { exam_id } = params;
    console.log(`🚀 [Step 5] VA Questions: ${exam_id}`);

    try {
        return await ErrorHandler.withErrorHandling(exam_id, 'Step 5: VA Questions', async () => {
            // Load state
            console.log(`📖 [Step 5] Loading state`);
            const state = await StateManager.load(exam_id);
            const { passage_id, article_data, reference_data_va } = state;

            if (!passage_id || !article_data) {
                throw new Error('Missing passage_id or article_data in state');
            }

            // Fetch passage content from DB
            const { data: passageData, error: passageError } = await supabase
                .from('passages')
                .select('content')
                .eq('id', passage_id)
                .single();

            if (passageError) {
                throw new Error(`Failed to fetch passage: ${passageError.message}`);
            }

            const passageText = passageData.content;

            // Generate VA questions
            console.log(`❓ [Step 5] Generating VA questions`);
            const costTracker = new CostTracker();

            const vaQuestionsRaw = await generateAllVAQuestions({
                semanticIdeas: article_data.semantic_ideas,
                authorialPersona: article_data.authorial_persona,
                referenceData: reference_data_va || [],
                passageText
            }, costTracker);

            // Save VA questions to database
            const questionIds: string[] = [];
            console.log(`💾 [Step 5] Saving ${vaQuestionsRaw.length} VA questions`);

            for (let i = 0; i < vaQuestionsRaw.length; i++) {
                const questionId = uuidv4();
                const questionData = vaQuestionsRaw[i];

                const { error: questionError } = await supabase
                    .from('questions')
                    .insert({
                        id: questionId,
                        exam_id: exam_id,
                        passage_id: null, // VA questions have no passage
                        question_text: questionData.question_text,
                        question_type: questionData.question_type,
                        options: questionData.options,
                        difficulty: questionData.difficulty,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (questionError) {
                    throw new Error(`Failed to save VA question ${i + 1}: ${questionError.message}`);
                }

                questionIds.push(questionId);
            }

            // Update state
            await StateManager.update(exam_id, {
                status: 'selecting_va_answers',
                current_step: 6,
                va_question_ids: questionIds
            });

            // Move to next step
            console.log(`📞 [Step 5] Invoking Step 6: VA Answers`);
            await FunctionInvoker.invokeNext('step-6', { exam_id });

            console.log(`🎉 [Step 5] VA questions generated!`);
            costTracker.printReport();

            return {
                success: true,
                exam_id,
                current_step: 5,
                total_steps: 8,
                next_function: 'daily-content-va-answers'
            };
        });
    } catch (error) {
        console.error(`❌ [Step 5] Failed:`, error);
        throw error;
    }
}