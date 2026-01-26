import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../../../config/supabase';
import { StateManager } from '../../shared/stateManager';
import { FunctionInvoker } from '../../shared/functionInvoker';
import { ErrorHandler } from '../../shared/errorHandler';
import { fetchArticleForUsage, updateGenres } from '../../core/articles/fetchArticle';
import { StepResult } from '../../types/state';

export interface Step1Params {
    user_id: string;
    mock_name?: string;
    target_genres?: string[];
    num_passages?: number;
    total_questions?: number;
    question_type_distribution?: {
        rc_questions?: number;
        para_summary?: number;
        para_completion?: number;
        para_jumble?: number;
        odd_one_out?: number;
    };
    difficulty_target?: "easy" | "medium" | "hard" | "mixed";
    target_metrics?: string[];
    weak_areas_to_address?: string[];
    time_limit_minutes?: number;
    per_question_time_limit?: number;
}

export async function handleStep1Init(params: Step1Params): Promise<StepResult> {
    const examId = uuidv4();

    console.log(`🚀 [Step 1] Starting initialization for exam: ${examId}`);
    console.log(`   User: ${params.user_id}`);
    console.log(`   Mock Name: ${params.mock_name || 'Customized Mock'}`);

    try {
        return await ErrorHandler.withErrorHandling(examId, 'Step 1: Init', async () => {
            // Extract parameters
            const {
                user_id,
                mock_name = 'Customized Mock',
                target_genres = ['Philosophy', 'History', 'Economics'],
                num_passages = 4,
                total_questions = 24,
                time_limit_minutes = 40,
            } = params;

            // Step 1.1: Create exam record
            console.log(`📝 [Step 1.1] Creating exam record`);
            const { data: examData, error: examError } = await supabase
                .from('exam_papers')
                .insert({
                    id: examId,
                    name: mock_name,
                    year: new Date().getFullYear(),
                    generated_by_user_id: user_id,
                    time_limit_minutes,
                    generation_status: 'initializing',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (examError) {
                throw new Error(`Failed to create exam: ${examError.message}`);
            }

            console.log(`✅ [Step 1.1] Exam created: ${examId}`);

            // Step 1.2: Create generation state record
            console.log(`📝 [Step 1.2] Creating generation state`);
            const { error: stateError } = await supabase
                .from('exam_generation_state')
                .insert({
                    exam_id: examId,
                    status: 'initializing',
                    current_step: 1,
                    total_steps: 7,
                    user_id,
                    params: params as any,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (stateError) {
                throw new Error(`Failed to create state: ${stateError.message}`);
            }

            console.log(`✅ [Step 1.2] Generation state created`);

            console.log(`\n🎯 [Step 1.2.1] Genres: ${target_genres.join(", ")}`);
            await updateGenres(target_genres);

            // Step 1.3: Fetch articles
            console.log(`📚 [Step 1.3] Fetching ${num_passages} articles`);
            const articlesData = [];

            for (let i = 0; i < num_passages; i++) {
                const genre = target_genres[i % target_genres.length];
                console.log(`   Fetching article ${i + 1}/${num_passages} for genre: ${genre}`);

                const articleData = await fetchArticleForUsage({
                    genre,
                    usageType: 'mock',
                    user_id
                });

                articlesData.push(articleData);
                console.log(`   ✅ Article ${i + 1}: ${articleData.articleMeta.title}`);
            }

            console.log(`✅ [Step 1.3] All articles fetched`);
            
            console.log(`📝 [Step 1.3.1] Updating the used articles ids in exam`);
            const articleIds = articlesData.map(a => a.articleMeta.id);
            const { error: articleIdsError } = await supabase
                .from('exam_papers')
                .update({ used_articles_id: articleIds })
                .eq('id', examId);

            if (articleIdsError) {
                throw new Error(`Failed to update article IDs in exam: ${articleIdsError.message}`);
            }
            // Step 1.4: Prepare reference data (PYQ passages and questions)
            console.log(`🧠 [Step 1.4] Preparing reference data for question generation`);

            const { generateEmbedding, searchPassageAndQuestionEmbeddings, fetchPassagesData, fetchQuestionsData } =
                await import('../../shared/referenceDataHelpers');

            const embedding = await generateEmbedding(target_genres.join(" "));
            const matches = await searchPassageAndQuestionEmbeddings(embedding, 3);

            const passages = await fetchPassagesData(matches.passages.map((m: any) => m.passage_id));
            const questions = await fetchQuestionsData(
                matches.questions.map((m: any) => m.question_id),
                matches.passages.map((m: any) => m.passage_id)
            );

            const passagesContent = passages.map(({ content }: any) => content);

            const referenceDataRC = passages.slice(0, 2).map((p: any) => ({
                passage: p,
                questions: questions.filter((q: any) => q.passage_id === p.id)
            }));

            const referenceDataVA = passages.slice(0, 2).map((p: any) => ({
                passage: p,
                questions: questions.filter((q: any) => q.passage_id === null || q.passage_id === undefined)
            }));

            console.log(`✅ [Step 1.4] Reference data prepared (${passagesContent.length} passages, ${questions.length} questions)`);

            // Step 1.5: Update state with articles and reference data
            console.log(`💾 [Step 1.5] Saving all data to state`);
            await StateManager.update(examId, {
                status: 'generating_passages',
                current_step: 2,
                articles_data: articlesData,
                reference_passages_content: passagesContent,
                reference_data_rc: referenceDataRC,
                reference_data_va: referenceDataVA
            });

            console.log(`✅ [Step 1.5] State updated`);

            // Step 1.6: Invoke next function
            console.log(`📞 [Step 1.6] Invoking Step 2: Passages`);
           await FunctionInvoker.invokeNext('step-2', { exam_id: examId });

            console.log(`🎉 [Step 1] Initialization complete!`);

            return {
                success: true,
                exam_id: examId,
                current_step: 1,
                total_steps: 7,
                next_function: 'customized-mocks-passages'
            };
        });
    } catch (error) {
        console.error(`❌ [Step 1] Failed:`, error);
        throw error;
    }
}
