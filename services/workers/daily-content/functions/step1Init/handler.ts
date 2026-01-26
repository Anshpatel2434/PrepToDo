import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../../../config/supabase';
import { StateManager } from '../../shared/stateManager';
import { FunctionInvoker } from '../../shared/functionInvoker';
import { ErrorHandler } from '../../shared/errorHandler';
import { fetchGenreForToday } from '../../retrieval/fetchGenre';
import { fetchArticleForUsage } from '../../retrieval/articleHandling/fetchArticleForUsage';
import { generateEmbedding } from '../../retrieval/generateEmbedding';
import { searchPassageAndQuestionEmbeddings } from '../../retrieval/searchPassageAndQuestionEmbeddings';
import { fetchPassagesData } from '../../retrieval/passageHandling/fetchPassagesData';
import { fetchQuestionsData } from '../../retrieval/fetchQuestionsData';
import { StepResult } from '../../types/state';

export async function handleStep1Init(): Promise<StepResult> {
    const examId = uuidv4();
    console.log(`🚀 [Step 1] Daily content initialization: ${examId}`);

    try {
        return await ErrorHandler.withErrorHandling(examId, 'Step 1: Init', async () => {
            // Step 1.1: Select genre for today
            console.log(`🎯 [Step 1.1] Selecting genre for today`);
            const genre = await fetchGenreForToday();
            console.log(`   Selected genre: ${genre.name}`);

            // Step 1.2: Fetch article and extract semantic data
            console.log(`📄 [Step 1.2] Fetching article for genre: ${genre.name}`);
            const { articleMeta, semantic_ideas, authorial_persona } = await fetchArticleForUsage({
                genre: genre.name,
                usageType: "daily"
            });
            console.log(`   Article: ${articleMeta.title}`);

            // Step 1.3: Generate embedding and fetch reference data
            console.log(`🧠 [Step 1.3] Generating embedding and fetching PYQ references`);
            const embedding = await generateEmbedding(genre.name);
            const matches = await searchPassageAndQuestionEmbeddings(embedding, 3);

            const passages = await fetchPassagesData(matches.passages.map(m => m.passage_id));
            const questions = await fetchQuestionsData(
                matches.questions.map(m => m.question_id),
                matches.passages.map(m => m.passage_id)
            );
            const passagesContent = passages.map(({ content }) => content);

            // Format reference data
            const referenceDataRC = passages.slice(0, 2).map(p => ({
                passage: p,
                questions: questions.filter(q => q.passage_id === p.id)
            }));

            const referenceDataVA = passages.slice(0, 2).map(p => ({
                passage: p,
                questions: questions.filter(q => q.passage_id === null || q.passage_id === undefined)
            }));

            console.log(`   References: ${passagesContent.length} passages, ${questions.length} questions`);

            // Step 1.4: Create daily content exam record
            console.log(`📝 [Step 1.4] Creating daily content exam record`);
            const { data: examData, error: examError } = await supabase
                .from('exam_papers')
                .insert({
                    id: examId,
                    name: `Daily Practice`,
                    used_articles_id: [articleMeta.id],
                    year: new Date().getFullYear(),
                    exam_type: "CAT",
                    slot: null,
                    is_official: false,
                    generation_status: 'initializing',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (examError) {
                throw new Error(`Failed to create exam: ${examError.message}`);
            }

            console.log(`✅ [Step 1.4] Exam created: ${examId}`);

            // Step 1.5: Create generation state
            console.log(`💾 [Step 1.5] Creating generation state`);
            await StateManager.create(examId, genre.name, 8);

            // Step 1.6: Update state with all initial data
            console.log(`🗂️ [Step 1.6] Saving initial data to state`);
            await StateManager.update(examId, {
                status: 'initializing',
                current_step: 2,
                genre: genre.name,
                articles_data: [{
                    articleMeta,
                    semantic_ideas,
                    authorial_persona
                }],
                reference_passages_content: passagesContent,
                reference_data_rc: referenceDataRC,
                reference_data_va: referenceDataVA
            });

            // Step 1.7: Invoke next function
            console.log(`📞 [Step 1.7] Invoking Step 2: Passage generation`);
            await FunctionInvoker.invokeNext('step-2', { exam_id: examId });

            console.log(`🎉 [Step 1] Initialization complete!`);

            return {
                success: true,
                exam_id: examId,
                current_step: 1,
                total_steps: 8,
                next_function: 'daily-content-passage'
            };
        });
    } catch (error) {
        console.error(`❌ [Step 1] Failed:`, error);
        throw error;
    }
}