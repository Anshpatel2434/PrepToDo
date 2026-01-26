import { v4 as uuidv4 } from 'uuid';
import { StateManager } from '../../shared/stateManager';
import { FunctionInvoker } from '../../shared/functionInvoker';
import { ErrorHandler } from '../../shared/errorHandler';
import { supabase } from '../../../../config/supabase';
import { CostTracker } from '../../retrieval/utils/CostTracker';
import { generateRCQuestions } from '../../retrieval/rcQuestionsHandling/generateRCQuestions';
import { StepResult } from '../../types/state';

export interface Step3Params {
    exam_id: string;
}

export async function handleStep3RCQuestions(params: Step3Params): Promise<StepResult> {
    const { exam_id } = params;
    console.log(`🚀 [Step 3] RC Questions: ${exam_id}`);

    try {
        return await ErrorHandler.withErrorHandling(exam_id, 'Step 3: RC Questions', async () => {
            // Load state
            console.log(`📖 [Step 3] Loading state`);
            const state = await StateManager.load(exam_id);
            const { passages_ids, reference_data_rc } = state;

            if (!passages_ids || passages_ids.length === 0) {
                throw new Error('No passage ID found in state');
            }

            // Fetch passage content from DB
            const { data: passageData, error: passageError } = await supabase
                .from('passages')
                .select('content')
                .eq('id', passages_ids[0])
                .single();

            if (passageError) {
                throw new Error(`Failed to fetch passage: ${passageError.message}`);
            }

            const passageText = passageData.content;

            // Generate RC questions
            console.log(`❓ [Step 3] Generating RC questions`);
            const costTracker = new CostTracker();

            const rcQuestionsRaw = await generateRCQuestions({
                passageText,
                referenceData: reference_data_rc || [],
                questionCount: 4
            }, costTracker);

            // Save questions to database
            const questionIds: string[] = [];
            console.log(`💾 [Step 3] Saving ${rcQuestionsRaw.length} RC questions`);

            for (let i = 0; i < rcQuestionsRaw.length; i++) {
                const questionId = uuidv4();
                const questionData = rcQuestionsRaw[i];

                const { error: questionError } = await supabase
                    .from('questions')
                    .insert({
                        ...questionData,
                        id: questionId,
                        paper_id: exam_id,
                        passage_id: passages_ids[0],
                        difficulty: questionData.difficulty || 'medium',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (questionError) {
                    throw new Error(`Failed to save question ${i + 1}: ${questionError.message}`);
                }

                questionIds.push(questionId);
            }

            // Update state
            await StateManager.update(exam_id, {
                status: 'initializing',
                current_step: 4,
                rc_question_ids: questionIds
            });

            // Move to next step
            console.log(`📞 [Step 3] Invoking Step 4: RC Answers`);
            await FunctionInvoker.invokeNext('step-4', { exam_id });

            console.log(`🎉 [Step 3] RC questions generated!`);
            costTracker.printReport();

            return {
                success: true,
                exam_id,
                current_step: 3,
                total_steps: 8,
                next_function: 'daily-content-rc-answers'
            };
        });
    } catch (error) {
        console.error(`❌ [Step 3] Failed:`, error);
        throw error;
    }
}