import { extractSemanticIdeasAndPersona } from "./retrieval/passageHandling/extractSemanticIdeas";
import { fetchGenreByName } from "./retrieval/fetchGenre";
import { fetchPassagesData } from "./retrieval/fetchPassagesData";
import { fetchQuestionsData } from "./retrieval/fetchQuestionsData";
import { generateEmbedding } from "./retrieval/generateEmbedding";
import { generatePassage } from "./retrieval/passageHandling/generatePassage";
import { searchPassageAndQuestionEmbeddings } from "./retrieval/searchPassageAndQuestionEmbeddings";
import { getValidArticlesForCustomMock } from "./retrieval/articleHandling/getValidArticlesForCustomMock";
import { finalizeCATPassage } from "./retrieval/passageHandling/finalizeCATPassage";
import { generateRCQuestions } from "./retrieval/rcQuestionsHandling/generateRCQuestions";
import { selectCorrectAnswers } from "./retrieval/rcQuestionsHandling/selectCorrectAnswers";
import { fetchNodes } from "./graph/fetchNodes";
import { tagQuestionsWithNodes } from "./retrieval/rcQuestionsHandling/tagQuestionsWithNodes";
import { getQuestionGraphContext } from "./graph/createReasoningGraphContext";
import { generateRationalesWithEdges } from "./retrieval/rcQuestionsHandling/generateRationaleWithEdges";

// VA specific imports
import { generateVAQuestions } from "./retrieval/vaQuestionsHandling/generateVAQuestions";
import { selectVAAnswers } from "./retrieval/vaQuestionsHandling/selectVAAnswers";
import { tagVAQuestionsWithNodes } from "./retrieval/vaQuestionsHandling/tagVAQuestionsWithNodes";
import { generateVARationalesWithEdges } from "./retrieval/vaQuestionsHandling/generateVARationales";
import { formatOutputForDB, generateOutputReport } from "./retrieval/formatOutputForDB";
import { saveAllDataToDB } from "./retrieval/saveAllDataToDB";
import { CustomizedMockRequest, CustomizedMockResult } from "./schemas/types";

/**
 * Main workflow for generating customized CAT mock test.
 * Based on daily-content workflow but with personalization and multiple passages.
 */
export async function runCustomizedMock(params: CustomizedMockRequest): Promise<CustomizedMockResult> {
    const {
        user_id,
        mock_name,
        target_genres,
        num_passages,
        total_questions,
        question_type_distribution,
        difficulty_target,
        target_metrics,
        weak_areas_to_address,
        time_limit_minutes,
        per_question_time_limit,
        user_analytics,
    } = params;

    console.log("🚀 [START] Customized Mock Generation sequence initiated");
    console.log(`   User ID: ${user_id}`);
    console.log(`   Mock Name: ${mock_name}`);
    console.log(`   Passages: ${num_passages}`);
    console.log(`   Total Questions: ${total_questions}`);

    try {
        // --- PHASE 1: PREPARATION & RETRIEVAL ---

        // Determine genres (use defaults if not specified)
        const genres = target_genres && target_genres.length > 0
            ? target_genres
            : ["Philosophy", "History", "Economics", "Science", "Literature"];

        console.log(`\n🎯 [Step 1/X] Genres: ${genres.join(", ")}`);

        // Fetch multiple articles with smart article usage checking
        console.log(`\n📄 [Step 2/X] Fetching ${num_passages} valid articles`);
        const { articles, genreNames } = await getValidArticlesForCustomMock({
            userId: user_id,
            genres: genres,
            numArticles: num_passages,
            maxAttempts: 10,
        });

        console.log(`✅ [Article Fetch] Fetched ${articles.length} articles`);

        // Generate embeddings and fetch PYQ references ONCE
        console.log(`\n🧠 [Step 3/X] Generating embedding and fetching PYQ references`);
        const embedding = await generateEmbedding(genres.join(" "));
        const matches = await searchPassageAndQuestionEmbeddings(embedding, 5);

        // Fetch full data for matches
        const passages = await fetchPassagesData(matches.passages.map(m => m.passage_id));
        const questions = await fetchQuestionsData(
            matches.questions.map(m => m.question_id),
            matches.passages.map(m => m.passage_id)
        );
        const passagesContent = passages.map(({ content }) => content);

        // Format reference data for RC (Questions linked to specific passages)
        const referenceDataRC = passages.slice(0, 3).map(p => ({
            passage: p,
            questions: questions.filter(q => q.passage_id === p.id)
        }));

        // Format reference data for VA (Standalone questions/PYQs)
        const referenceDataVA = passages.slice(0, 3).map(p => ({
            passage: p,
            questions: questions.filter(q => q.passage_id === null || q.passage_id === undefined)
        }));

        // --- PHASE 2: PASSAGE GENERATION (for each article) ---

        const allPassagesData: Array<{
            passageData: {
                id: string;
                title: string;
                content: string;
                word_count: number;
                difficulty: "easy" | "medium" | "hard";
            };
            articleData: any;
            semanticIdeas: any;
            authorialPersona: any;
        }> = [];

        console.log(`\n✍️ [Step 4/X] Generating ${articles.length} CAT-style passages`);

        for (let i = 0; i < articles.length; i++) {
            const { articleMeta, articleText } = articles[i];
            const genre = genreNames[i];

            console.log(`\n📝 [Passage ${i + 1}/${articles.length}] Genre: ${genre}`);

            // Extract semantic ideas and persona
            console.log(`   🧠 [Passage ${i + 1}] Extracting semantic ideas and persona`);
            const { semantic_ideas, authorial_persona } = await extractSemanticIdeasAndPersona(
                articleText,
                genre
            );

            // Generate CAT-style passage
            console.log(`   ✍️ [Passage ${i + 1}] Generating CAT-style passage`);
            const draftPassage = await generatePassage({
                semanticIdeas: semantic_ideas,
                authorialPersona: authorial_persona,
                referencePassages: passagesContent,
                personalization: {
                    targetMetrics: target_metrics,
                    difficultyTarget: difficulty_target,
                    weakAreas: weak_areas_to_address,
                },
            });

            // Finalize passage
            const finalizedData = await finalizeCATPassage(draftPassage);
            const passageText = finalizedData["passageData"].content;

            console.log(`   ✅ [Passage ${i + 1}] Generated: ${finalizedData["passageData"].word_count} words`);

            allPassagesData.push({
                passageData: finalizedData["passageData"],
                articleData: articleMeta,
                semanticIdeas: semantic_ideas,
                authorialPersona: authorial_persona,
            });
        }

        // --- PHASE 3: RC QUESTIONS ---

        const allRCQuestions: any[] = [];

        for (let i = 0; i < allPassagesData.length; i++) {
            const passageData = allPassagesData[i];
            const passageText = passageData.passageData.content;

            const rcQuestionsCount = question_type_distribution?.rc_questions || 4;
            if (rcQuestionsCount > 0) {
                console.log(`\n❓ [RC Questions Passage ${i + 1}] Generating ${rcQuestionsCount} questions`);

                const rcQuestions = await generateRCQuestions({
                    passageText,
                    referenceData: referenceDataRC,
                    questionCount: rcQuestionsCount,
                    personalization: {
                        targetMetrics: target_metrics,
                        weakAreas: weak_areas_to_address,
                    },
                });

                console.log(`✅ [RC Answers Passage ${i + 1}] Selecting correct answers`);
                const rcQuestionsWithAnswers = await selectCorrectAnswers({
                    passageText,
                    questions: rcQuestions,
                });

                allRCQuestions.push(...rcQuestionsWithAnswers);
            }
        }

        // --- PHASE 4: VA QUESTIONS ---

        console.log(`\n🔮 [Step 5/X] Generating VA questions`);

        const vaQuestions = await generateVAQuestions({
            semanticIdeas: allPassagesData[0].semanticIdeas, // Use first passage's ideas
            authorialPersona: allPassagesData[0].authorialPersona,
            referenceData: referenceDataVA,
            passageText: allPassagesData[0].passageData.content,
            questionDistribution: question_type_distribution,
            personalization: {
                targetMetrics: target_metrics,
                weakAreas: weak_areas_to_address,
            },
        });

        console.log(`✅ [VA Answers] Selecting correct answers`);
        const vaQuestionsWithAnswers = await selectVAAnswers({
            questions: vaQuestions,
        });

        // --- PHASE 5: GRAPH & RATIONALES ---

        console.log(`\n🏷️ [Step 6/X] Fetching reasoning graph nodes`);
        const nodes = await fetchNodes();

        console.log(`🕸️ [Step 7/X] Tagging questions and building graph context`);

        // Tag RC questions
        const rcTagged = await tagQuestionsWithNodes({
            passageText: allPassagesData[0].passageData.content,
            questions: allRCQuestions,
        });

        // Tag VA questions
        const vaTagged = await tagVAQuestionsWithNodes({
            questions: vaQuestionsWithAnswers,
        });

        const rcContext = await getQuestionGraphContext(rcTagged, nodes);
        const vaContext = await getQuestionGraphContext(vaTagged, nodes);

        console.log(`\n🧾 [Step 8/X] Generating rationales for RC`);
        const rcQuestionsFinal = await generateRationalesWithEdges({
            passageText: allPassagesData[0].passageData.content,
            questions: allRCQuestions,
            reasoningContexts: rcContext,
            referenceData: referenceDataRC,
        });

        console.log(`\n🧾 [Step 9/X] Generating rationales for VA`);
        const vaQuestionsFinal = await generateVARationalesWithEdges({
            questions: vaQuestionsWithAnswers,
            reasoningContexts: vaContext,
            referenceData: referenceDataVA,
        });

        // --- PHASE 6: FINALIZATION ---

        console.log(`\n📋 [Step 10/X] Formatting output for database upload`);

        // Calculate actual question counts
        const actualRCCount = allRCQuestions.length;
        const actualVACount = vaQuestionsFinal.length;
        const actualTotal = actualRCCount + actualVACount;

        const output = formatOutputForDB({
            passagesData: allPassagesData.map(pd => ({
                passageData: pd.passageData,
                articleData: pd.articleData,
            })),
            rcQuestions: rcQuestionsFinal,
            vaQuestions: vaQuestionsFinal,
            userId: user_id,
            mockName: mock_name || "Custom Mock Test",
            timeLimitMinutes: time_limit_minutes,
        });

        // Validate output
        if (!formatOutputForDB.validateOutputForDB(output)) {
            throw new Error("Output validation failed");
        }

        // Generate and print report
        const report = generateOutputReport(output);
        console.log(report);

        console.log("\nBreakdown:");
        console.log(`   Total Passages: ${output.passages.length}`);
        console.log(`   Total Questions: ${output.questions.length} (RC: ${actualRCCount}, VA: ${actualVACount})`);

        console.log(`\n📋 [Step 11/X] Uploading to database`);
        await saveAllDataToDB({
            examData: output.exam,
            passagesData: output.passages,
            questionsData: output.questions
        });

        console.log("\n✅ [COMPLETE] Customized Mock Generation finished successfully");

        return {
            success: true,
            exam_id: output.exam.id,
            mock_name: output.exam.name,
            passage_count: output.passages.length,
            question_count: output.questions.length,
            user_id: user_id,
            time_limit_minutes: time_limit_minutes,
            message: `Successfully generated custom mock with ${output.passages.length} passages and ${output.questions.length} questions`,
        };

    } catch (error) {
        console.error("\n❌ [ERROR] Customized Mock Generation failed:");
        console.error(error);
        return {
            success: false,
            exam_id: undefined,
            mock_name: mock_name,
            passage_count: 0,
            question_count: 0,
            user_id: user_id,
            time_limit_minutes: time_limit_minutes,
            message: error instanceof Error ? error.message : String(error),
        };
    }
}
