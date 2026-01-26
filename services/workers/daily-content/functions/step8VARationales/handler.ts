import { StateManager } from '../../shared/stateManager';
import { ErrorHandler } from '../../shared/errorHandler';
import { supabase } from '../../../../config/supabase';
import { CostTracker } from '../../retrieval/utils/CostTracker';
import { generateBatchVARationales } from '../../retrieval/vaQuestionsHandling/generateBatchVARationales';
import { tagVAQuestionsWithNodes } from '../../retrieval/vaQuestionsHandling/tagVAQuestionsWithNodes';
import { getQuestionGraphContext } from '../../graph/createReasoningGraphContext';
import { StepResult } from '../../types/state';

export interface Step8Params {
    exam_id: string;
}

export async function handleStep8VARationales(params: Step8Params): Promise<StepResult> {
    const { exam_id } = params;
    console.log(`🚀 [Step 8] VA Rationales: ${exam_id}`);

    try {
        return await ErrorHandler.withErrorHandling(exam_id, 'Step 8: VA Rationales', async () => {
            // Load state
            console.log(`📖 [Step 8] Loading state`);
            const state = await StateManager.load(exam_id);
            const { va_question_ids, reference_data_va, reasoning_graph_nodes } = state;

            if (!va_question_ids || !reasoning_graph_nodes) {
                throw new Error('Missing required data in state for VA rationale generation');
            }

            // Fetch VA questions
            const { data: questionsData, error: questionsError } = await supabase
                .from('questions')
                .select('*')
                .in('id', va_question_ids);

            if (questionsError) throw new Error(`Failed to fetch questions: ${questionsError.message}`);

            const questions = questionsData || [];

            // Tag VA questions with reasoning nodes
            console.log(`🏷️ [Step 8] Tagging VA questions with reasoning nodes`);
            const taggedQuestions = await tagVAQuestionsWithNodes({
                questions
            }, new CostTracker());

            // Build reasoning graph context
            console.log(`🕸️ [Step 8] Building reasoning graph context`);
            const reasoningContexts = await getQuestionGraphContext(taggedQuestions, reasoning_graph_nodes);

            // Generate batch rationales
            console.log(`🧾 [Step 8] Generating rationales for VA questions`);
            const costTracker = new CostTracker();

            const questionsWithRationales = await generateBatchVARationales({
                questions: taggedQuestions,
                reasoningContexts,
                referenceData: reference_data_va || []
            }, costTracker);

            // Update questions with rationales and tags in database
            console.log(`💾 [Step 8] Saving rationales and reasoning graph tags`);
            for (const question of questionsWithRationales) {
                const { error } = await supabase
                    .from('questions')
                    .update({
                        rationale: question.rationale,
                        reasoning_graph_node: question.reasoning_graph_node,
                        reasoning_graph_tags: question.reasoning_graph_tags
                    })
                    .eq('id', question.id);

                if (error) {
                    throw new Error(`Failed to update rationale for question ${question.id}: ${error.message}`);
                }
            }

            // Mark as completed and cleanup
            console.log(`🎉 [Step 8] Marking daily content as completed`);
            await StateManager.markCompleted(exam_id);

            // Generate final report
            const [{ data: examData, error: examError },
                  { data: passageData, error: passageError },
                  { data: allQuestions, error: questionsError }] = await Promise.all([
                supabase.from('exam_papers').select('*').eq('id', exam_id).single(),
                supabase.from('passages').select('*').eq('paper_id', exam_id).maybeSingle(),
                supabase.from('questions').select('*').eq('exam_id', exam_id)
            ]);

            if (examError) throw new Error(`Failed to fetch final exam: ${examError.message}`);

            // Print summary report
            console.log("=".repeat(50));
            console.log(`DAILY CONTENT GENERATION COMPLETE: ${exam_id}`);
            console.log(`GENRE: ${state.genre}`);
            console.log(`PASSAGE: ${passageData ? `${passageData.word_count} words` : 'N/A'}`);
            console.log(`TOTAL QUESTIONS: ${allQuestions ? allQuestions.length : 0}`);

            if (allQuestions) {
                const counts = allQuestions.reduce((acc: Record<string, number>, q: any) => {
                    acc[q.question_type] = (acc[q.question_type] || 0) + 1;
                    return acc;
                }, {});

                console.log("QUESTION BREAKDOWN:");
                Object.entries(counts).forEach(([type, count]) => {
                    console.log(`  - ${type}: ${count}`);
                });
            }
            console.log("=".repeat(50));

            costTracker.printReport();
            console.log(`✅ [COMPLETE] Daily content generation finished successfully: ${exam_id}`);

            return {
                success: true,
                exam_id,
                current_step: 8,
                total_steps: 8
            };
        });
    } catch (error) {
        console.error(`❌ [Step 8] Failed:`, error);
        throw error;
    }
}