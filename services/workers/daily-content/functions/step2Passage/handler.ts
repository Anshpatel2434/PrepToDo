import { v4 as uuidv4 } from 'uuid';
import { StateManager } from '../../shared/stateManager';
import { FunctionInvoker } from '../../shared/functionInvoker';
import { ErrorHandler } from '../../shared/errorHandler';
import { supabase } from '../../../../config/supabase';
import { CostTracker } from '../../retrieval/utils/CostTracker';
import { generatePassage } from '../../retrieval/passageHandling/generatePassage';
import { StepResult } from '../../types/state';

export interface Step2Params {
    exam_id: string;
}

export async function handleStep2Passage(params: Step2Params): Promise<StepResult> {
    const { exam_id } = params;
    console.log(`🚀 [Step 2] Passage generation: ${exam_id}`);

    try {
        return await ErrorHandler.withErrorHandling(exam_id, 'Step 2: Passage', async () => {
            // Load state
            console.log(`📖 [Step 2] Loading state`);
            const state = await StateManager.load(exam_id);
            const { articles_data, reference_passages_content } = state;

            if (!articles_data) {
                throw new Error('No article data found in state');
            }

            // Generate passage
            console.log(`✍️ [Step 2] Generating CAT-style passage`);
            const costTracker = new CostTracker();

            const passageContent = await generatePassage({
                semanticIdeas: articles_data[0].semantic_ideas,
                authorialPersona: articles_data[0].authorial_persona,
                referencePassages: reference_passages_content || []
            }, costTracker);

            const wordCount = passageContent.split(/\s+/).length;
            console.log(`   Generated passage: ${wordCount} words`);

            // Determine difficulty based on word count
            let difficulty: "easy" | "medium" | "hard";
            if (wordCount < 400) {
                difficulty = "easy";
            } else if (wordCount < 600) {
                difficulty = "medium";
            } else {
                difficulty = "hard";
            }

            // Save passage to database
            const passageId = uuidv4();
            console.log(`💾 [Step 2] Saving passage: ${passageId}`);
            const { error: passageError } = await supabase
                .from('passages')
                .insert({
                    id: passageId,
                    paper_id: exam_id,
                    article_id: articles_data[0].articleMeta.id,
                    content: passageContent,
                    word_count: wordCount,
                    difficulty: difficulty,
                    genre: state.genre,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (passageError) {
                throw new Error(`Failed to save passage: ${passageError.message}`);
            }

            // Update state and mark passage as generated
            await StateManager.update(exam_id, {
                status: 'initializing',
                current_step: 3,
                passages_ids: [passageId]
            });

            // Move to next step
            console.log(`📞 [Step 2] Invoking Step 3: RC Questions`);
            await FunctionInvoker.invokeNext('step-3', { exam_id });

            console.log(`🎉 [Step 2] Passage generation complete!`);
            costTracker.printReport();

            return {
                success: true,
                exam_id,
                current_step: 2,
                total_steps: 8,
                next_function: 'daily-content-rc-questions'
            };
        });
    } catch (error) {
        console.error(`❌ [Step 2] Failed:`, error);
        throw error;
    }
}