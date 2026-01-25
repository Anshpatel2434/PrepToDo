import { v4 as uuidv4 } from 'uuid';
import { StateManager } from '../../shared/stateManager';
import { FunctionInvoker } from '../../shared/functionInvoker';
import { ErrorHandler } from '../../shared/errorHandler';
import { generatePassage } from '../../core/passages/generatePassage';
import { StepResult } from '../../types/state';
import { CostTracker } from '../../retrieval/utils/CostTracker';
import { supabase } from '../../../../config/supabase';

export interface Step2Params {
    exam_id: string;
}

export async function handleStep2Passages(params: Step2Params): Promise<StepResult> {
    const { exam_id } = params;

    console.log(`🚀 [Step 2] Starting passage generation for exam: ${exam_id}`);

    try {
        return await ErrorHandler.withErrorHandling(exam_id, 'Step 2: Passages', async () => {
            // Load state
            const state = await StateManager.load(exam_id);
            const { articles_data } = state;

            if (!articles_data || articles_data.length === 0) {
                throw new Error('No articles data found in state');
            }

            console.log(`📚 [Step 2] Generating ${articles_data.length} passages`);

            const costTracker = new CostTracker();
            const passageIds: string[] = [];

            // Generate passages
            for (let i = 0; i < articles_data.length; i++) {
                const articleData = articles_data[i];
                console.log(`   Generating passage for genre ${articleData.articleMeta.genre} ${i + 1}/${articles_data.length}`);

                const passageContent = await generatePassage({
                    semanticIdeas: articleData.semantic_ideas,
                    authorialPersona: articleData.authorial_persona,
                    referencePassages: state.reference_passages_content || [],
                    personalization: {
                        targetMetrics: state.params.target_metrics,
                        difficultyTarget: state.params.difficulty_target,
                        weakAreas: state.params.weak_areas_to_address
                    }
                }, costTracker);

                const wordCount = passageContent.split(/\s+/).length

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
                const { error: passageError } = await supabase
                    .from('passages')
                    .insert({
                        id: passageId,
                        paper_id: exam_id,
                        article_id: articleData.articleMeta.id,
                        content: passageContent,
                        word_count: wordCount,
                        difficulty: difficulty,
                        genre: articleData.articleMeta.genre,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (passageError) {
                    throw new Error(`Failed to save passage: ${passageError.message}`);
                }

                passageIds.push(passageId);
                console.log(`   ✅ Passage ${i + 1} saved: ${passageId}`);
            }

            console.log(`✅ [Step 2] All passages generated`);

            // Update state
            await StateManager.update(exam_id, {
                status: 'generating_rc_questions',
                current_step: 3,
                passages_ids: passageIds
            });

            // Invoke next function
            console.log(`📞 [Step 2] Invoking Step 3: RC Questions`);
            await FunctionInvoker.invokeNext('step-3', { exam_id });

            console.log(`🎉 [Step 2] Passages complete!`);

            return {
                success: true,
                exam_id,
                current_step: 2,
                total_steps: 7,
                next_function: 'customized-mocks-rc-questions'
            };
        });
    } catch (error) {
        console.error(`❌ [Step 2] Failed:`, error);
        throw error;
    }
}
