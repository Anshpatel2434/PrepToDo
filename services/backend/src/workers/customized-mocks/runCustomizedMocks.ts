import { CustomizedMockRequest, CustomizedMockResult, QuestionMetricTag, SemanticIdeas, AuthorialPersona } from "./schemas/types";
import { DataManager } from "./retrieval/dataManager";
import { CostTracker } from "./retrieval/utils/CostTracker";
import { StateManager } from "./shared/StateManager";
import { updateGenres } from "./retrieval/updateGenre";
import { fetchPassagesData } from "./retrieval/passageHandling/fetchPassagesData";
import { fetchQuestionsData } from "./retrieval/fetchQuestionsData";
import { generateEmbedding } from "./retrieval/generateEmbedding";
import { generatePassage } from "./retrieval/passageHandling/generatePassage";
import { searchPassageAndQuestionEmbeddings } from "./retrieval/searchPassageAndQuestionEmbeddings";
import { fetchArticleForUsage } from "./retrieval/articleHandling/fetchArticleForUsage";
import { generateRCQuestions, groupQuestionsWithPassages } from "./retrieval/rcQuestionsHandling/generateRCQuestions";
import { selectCorrectAnswers } from "./retrieval/rcQuestionsHandling/selectCorrectAnswers";
import { fetchNodes } from "./graph/fetchNodes";
import { tagQuestionsWithNodes } from "./retrieval/rcQuestionsHandling/tagQuestionsWithNodes";
import { getQuestionGraphContext } from "./graph/createReasoningGraphContext";
import { generateBatchRCRationales } from "./retrieval/rcQuestionsHandling/generateBatchRCRationales";
import { generateVAQuestions } from "./retrieval/vaQuestionsHandling/generateVAQuestions";
import { selectVAAnswers } from "./retrieval/vaQuestionsHandling/selectVAAnswers";
import { tagVAQuestionsWithNodes } from "./retrieval/vaQuestionsHandling/tagVAQuestionsWithNodes";
import { generateBatchVARationales } from "./retrieval/vaQuestionsHandling/generateBatchVARationales";
import { formatOutputForDB, generateOutputReport, validateOutputForDB } from "./retrieval/formatOutputForDB";
import { saveAllDataToDB } from "./retrieval/saveAllDataToDB";
import { createPassage, createRCQuestions, createVAQuestions, getQuestionsForProcessing, updateQuestionsWithAnswers, updateQuestionsWithRationalesAndTags } from "./retrieval/entityBuilder";
import { db } from "../../db";
import { examPapers, examGenerationState } from "../../db/schema";
import { v4 as uuidv4 } from 'uuid';

export async function runCustomizedMocks(params: CustomizedMockRequest): Promise<CustomizedMockResult> {
    console.log("🚀 [Worker] Starting customized mock generation");
    console.log("   - User:", params.user_id);
    console.log("   - Type:", params.difficulty_target);
    console.log("   - Passages:", params.num_passages);

    const costTracker = new CostTracker();
    const dataManager = new DataManager(params.exam_id);
    const examId = dataManager.getExamId();

    // Track references for context
    let allReferencePassages: any[] = [];
    let allReferenceQuestions: any[] = [];

    // Store first article context for VA generation if needed
    let primarySemanticIdeas: SemanticIdeas | null = null;
    let primaryAuthorialPersona: AuthorialPersona | null = null;
    let primaryPassageText: string = "";

    try {
        // --- Initialization Phase ---
        // 1. Initial Exam Paper and State records are now created by the controller
        // This prevents race conditions where the UI tries to fetch the exam before the worker starts.

        console.log(`✅ [Init] Using existing initialized exam ${examId}`);

        // Update target genres usage (if provided)
        if (params.target_genres && params.target_genres.length > 0) {
            await updateGenres(params.target_genres);
        }

        // =========================================================================
        // STEP 1-2: Generate Passages
        // =========================================================================
        await StateManager.update(examId, { status: 'generating_passages', current_step: 2 });

        console.log("📝 [Step 2] Generating Passages...");

        const numPassages = params.num_passages || 1;
        const genres = params.target_genres || ["Technology"]; // Default fallback

        for (let i = 0; i < numPassages; i++) {
            const genre = genres[i % genres.length];
            console.log(`   - Generating passage ${i + 1}/${numPassages} (Genre: ${genre})`);

            // 1. Fetch Article
            const { articleMeta, semantic_ideas, authorial_persona } = await fetchArticleForUsage({
                genre: genre,
                usageType: "mock",
                user_id: params.user_id
            }) as { articleMeta: any, semantic_ideas: SemanticIdeas, authorial_persona: AuthorialPersona };

            // Capture for VA usage later (using the first available)
            if (!primarySemanticIdeas) {
                primarySemanticIdeas = semantic_ideas;
                primaryAuthorialPersona = authorial_persona;
            }

            // 2. Find Reference Passages (Vector Search)
            let referencePassages: any[] = [];
            if (semantic_ideas && semantic_ideas.core_topic) {
                const embedding = await generateEmbedding(semantic_ideas.core_topic);
                const searchResults = await searchPassageAndQuestionEmbeddings(embedding, 3);
                referencePassages = searchResults.passages;
                // Track for final storage
                allReferencePassages.push(...referencePassages);
                allReferenceQuestions.push(...searchResults.questions);
            }

            // Ensure we have exactly 3 reference passages (pad if needed)
            const safeReferencePassages = referencePassages.map(p => p.content);
            while (safeReferencePassages.length < 3) {
                safeReferencePassages.push("Reference passage not available.");
            }

            // 3. Generate Passage Content
            const passageContent = await generatePassage({
                semanticIdeas: semantic_ideas,
                authorialPersona: authorial_persona,
                referencePassages: safeReferencePassages.slice(0, 3), // Ensure strictly 3
                personalization: params.user_analytics ? {
                    targetMetrics: params.user_analytics.weak_topics || undefined,
                    difficultyTarget: params.difficulty_target as "easy" | "medium" | "hard" | "mixed",
                    weakAreas: params.user_analytics.weak_question_types || undefined
                } : {
                    difficultyTarget: params.difficulty_target as "easy" | "medium" | "hard" | "mixed"
                }
            }, costTracker);

            if (!primaryPassageText) primaryPassageText = passageContent;

            // 4. Create Passage Entity
            const passageId = createPassage(dataManager, {
                content: passageContent,
                genre: genre,
                articleId: articleMeta.id,
                articleSource: articleMeta.source_name || "Unknown"
            });

            console.log(`     -> Passage created: ${passageId}`);
        }

        // =========================================================================
        // STEP 3: Generate RC Questions
        // =========================================================================
        await StateManager.update(examId, {
            status: 'generating_rc_questions',
            current_step: 3,
            reference_passages_content: allReferencePassages // Store some context
        });

        console.log("📝 [Step 3] Generating RC Questions...");

        const passages = dataManager.getPassagesForDB(params.mock_name || "Custom Mock");

        // Prepare global reference data
        // For now we just use the first few found references
        // Ideally we should group them properly: Passage -> associated Questions
        // But here we rely on what we fetched in Step 2.
        // We need to fetch questions for these reference passages to make a complete ReferenceData object

        // Fetch questions for reference passages
        let globalReferenceData: any[] = [];
        if (allReferencePassages.length > 0) {
            const refPIds = allReferencePassages.map(p => p.id);
            // We need to fetch questions for these passages
            // Assuming fetchQuestionsData can fetch by passage IDs
            // Actually search functions return questions too.
            // Let's use what searchPassageAndQuestionEmbeddings returned if possible, 
            // but we didn't store the questions fully in Step 2 per passage loop.
            // Simpler: Just fetch from DB for these IDs.
            const refQuestions = await fetchQuestionsData([], refPIds);
            globalReferenceData = groupQuestionsWithPassages(allReferencePassages, refQuestions);
        }

        for (const passage of passages) {
            console.log(`   - Generating questions for passage: ${passage.id}`);

            // 1. Get embedding for context (for specific references if needed, else global)
            // Using globalReferenceData derived above for now to save tokens/calls

            // 2. Generate Questions
            const targetQuestionCount = params?.question_type_distribution?.rc_questions;

            const generatedQuestions = await generateRCQuestions({
                passageData: { passageData: passage }, // Wrapper as expected by function
                referenceData: globalReferenceData.slice(0, 2), // Use top 2 references
                questionCount: targetQuestionCount || 4,
                personalization: params.user_analytics ? {
                    targetMetrics: params.user_analytics.weak_topics || undefined,
                    weakAreas: params.user_analytics.weak_question_types || undefined
                } : undefined
            }, costTracker);

            // 3. Register Questions
            createRCQuestions(dataManager, passage.id, generatedQuestions);
        }

        // =========================================================================
        // STEP 4: Generate VA Questions
        // =========================================================================
        await StateManager.update(examId, { status: 'generating_va_questions', current_step: 4 });

        console.log("📝 [Step 4] Generating VA Questions...");

        // Calculate needed VA questions
        const currentStats = dataManager.getStats();
        const neededVA = Math.max(0, (params.total_questions || 24) - currentStats.rcQuestions);

        if (neededVA > 0 && primarySemanticIdeas && primaryAuthorialPersona) {
            console.log(`   - Need ${neededVA} VA questions`);

            const vaQuestions = await generateVAQuestions({
                semanticIdeas: primarySemanticIdeas,
                authorialPersona: primaryAuthorialPersona,
                referenceData: globalReferenceData.slice(0, 3), // Pass references
                referenceQuestions: { questions: allReferenceQuestions }, // Pass standalone reference questions
                passageText: primaryPassageText, // Pass context
                questionDistribution: params.question_type_distribution ?? undefined, // Use provided distribution, ensure undefined if null
                personalization: params.user_analytics ? {
                    targetMetrics: params.user_analytics.weak_topics || undefined,
                    weakAreas: params.user_analytics.weak_question_types || undefined
                } : undefined
            }, costTracker);

            createVAQuestions(dataManager, vaQuestions);
        }

        // =========================================================================
        // STEP 5: Select Answers
        // =========================================================================
        await StateManager.update(examId, { status: 'selecting_answers', current_step: 5 });

        console.log("📝 [Step 5] Selecting Answers...");

        // RC Answers
        const rcQuestions = getQuestionsForProcessing(dataManager, { questionType: 'rc_question' });
        for (const passage of passages) {
            const pQuestions = rcQuestions.filter(q => q.passage_id === passage.id);
            if (pQuestions.length > 0) {
                const answers = await selectCorrectAnswers({
                    passageText: passage.content,
                    questions: pQuestions
                });
                // Since selectCorrectAnswers returns full question objects (or subsets),
                // we might need to assume it returns objects compatible with update
                // The function currently returns updated question objects.
                updateQuestionsWithAnswers(dataManager, answers);
            }
        }

        // VA Answers
        // Get VA questions (those without passage_id)
        const vaQuestionsDB = dataManager.getQuestionsForDB().filter(q => !q.passage_id);
        if (vaQuestionsDB.length > 0) {
            const vaAnswers = await selectVAAnswers({ questions: vaQuestionsDB });
            updateQuestionsWithAnswers(dataManager, vaAnswers);
        }

        // =========================================================================
        // STEP 6: Generate Rationales & Tagging (RC)
        // =========================================================================
        await StateManager.update(examId, { status: 'generating_rc_rationales', current_step: 6 });

        console.log("📝 [Step 6] Generating RC Rationales & Tagging...");

        // Fetch and strict filter nodes
        const rawNodes = await fetchNodes();

        for (const passage of passages) {

            const pQuestions = getQuestionsForProcessing(dataManager, { passageId: passage.id });
            if (pQuestions.length === 0) continue;

            // 1. Tag with Metrics
            const taggedQuestions = await tagQuestionsWithNodes({
                passageText: passage.content,
                questions: pQuestions
            });

            // tagQuestionsWithNodes returns list of { question_id, metric_keys }
            // We need to associate these tags before generating graph context

            // 2. Generate Graph Context
            // We need to convert the structure to what getQuestionGraphContext expects
            // It expects QuestionMetricTag[]
            const graphContexts = await getQuestionGraphContext(taggedQuestions as QuestionMetricTag[], rawNodes as any);

            // 3. Generate Rationales (Batch)
            const questionsWithRationales = await generateBatchRCRationales({
                passageText: passage.content,
                questions: pQuestions,
                reasoningContexts: graphContexts,
                referenceData: globalReferenceData.slice(0, 2)
            }, costTracker);

            // Update Tags and Rationales
            // questionsWithRationales should have the updated tags and rationales
            updateQuestionsWithRationalesAndTags(dataManager, questionsWithRationales as any);
        }

        // =========================================================================
        // STEP 7: Generate Rationales (VA) & Finalize
        // =========================================================================
        await StateManager.update(examId, { status: 'generating_va_rationales', current_step: 7 });

        console.log("📝 [Step 7] Generating VA Rationales...");

        if (vaQuestionsDB.length > 0) {
            // 1. Tag
            const taggedVA = await tagVAQuestionsWithNodes({ questions: vaQuestionsDB });

            // 2. Context
            const graphContextsVA = await getQuestionGraphContext(taggedVA as QuestionMetricTag[], rawNodes as any);

            // 3. Rationales
            const vaRationales = await generateBatchVARationales({
                questions: vaQuestionsDB,
                reasoningContexts: graphContextsVA,
                referenceQuestions: allReferenceQuestions
            }, costTracker);

            updateQuestionsWithRationalesAndTags(dataManager, vaRationales as any);
        }

        // =========================================================================
        // COMPLETION: Save to DB
        // =========================================================================
        console.log("💾 Saving to Database...");

        const finalOutput = formatOutputForDB(dataManager, {
            userId: params.user_id,
            mockName: params.mock_name || "Custom Mock",
            timeLimitMinutes: params.time_limit_minutes || 60
        });

        if (!validateOutputForDB(finalOutput)) {
            throw new Error("Validation failed for generated mock data");
        }

        await saveAllDataToDB({
            examData: finalOutput.exam,
            passagesData: finalOutput.passages,
            questionsData: finalOutput.questions
        });

        await StateManager.markCompleted(examId);

        console.log(generateOutputReport(finalOutput));
        console.log(`✅ [Worker] customized-mocks completed successfully for ${examId}`);
        console.log(`💰 Total Cost: $${costTracker.getReport().totalCost.toFixed(4)}`);

        return {
            success: true,
            exam_id: examId,
            mock_name: finalOutput.exam.name,
            passage_count: finalOutput.passages.length,
            question_count: finalOutput.questions.length,
            user_id: params.user_id,
            message: "Mock generated successfully"
        };

    } catch (error) {
        console.error("❌ [Worker] Error in customized-mocks:", error);
        await StateManager.markFailed(examId, error instanceof Error ? error.message : String(error));
        return {
            success: false,
            user_id: params.user_id,
            passage_count: 0,
            question_count: 0,
            message: `Generation failed: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
