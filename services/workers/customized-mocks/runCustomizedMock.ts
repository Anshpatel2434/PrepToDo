import { updateGenres } from "./retrieval/updateGenre";
import { fetchPassagesData } from "./retrieval/passageHandling/fetchPassagesData";
import { fetchQuestionsData } from "./retrieval/fetchQuestionsData";
import { generateEmbedding } from "./retrieval/generateEmbedding";
import { generatePassage } from "./retrieval/passageHandling/generatePassage";
import { searchPassageAndQuestionEmbeddings } from "./retrieval/searchPassageAndQuestionEmbeddings";
import { fetchArticleForUsage } from "./retrieval/articleHandling/fetchArticleForUsage";
import { evaluateCATLikeness } from "./retrieval/passageHandling/evaluateCATLikeness";
import { sharpenToCATStyle } from "./retrieval/passageHandling/sharpenToCATStyle";
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
import { formatOutputForDB, generateOutputReport, validateOutputForDB } from "./retrieval/formatOutputForDB";
import { saveAllDataToDB } from "./retrieval/saveAllDataToDB";
import { CustomizedMockRequest, CustomizedMockResult } from "./schemas/types";

// NEW: Import DataManager and EntityBuilder
import { DataManager } from "./retrieval/dataManager";
import { createPassage, createRCQuestions, createVAQuestions, getQuestionsForProcessing } from "./retrieval/entityBuilder";

/**
 * Main workflow for generating customized CAT mock test.
 * Refactored to use centralized DataManager for clean ID management.
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
        // Initialize DataManager - central source of truth for all IDs
        const dataManager = new DataManager();
        console.log(`✅ [DataManager] Initialized with Exam ID: ${dataManager.getExamId()}`);

        // --- PHASE 1: PREPARATION & RETRIEVAL ---

        // Determine genres (use defaults if not specified)
        const genres = target_genres && target_genres.length > 0
            ? target_genres
            : ["Philosophy", "History", "Economics"];

        console.log(`\n🎯 [Step 1/X] Genres: ${genres.join(", ")}`);
        await updateGenres(genres);

        // Fetch articles using fetchArticleForUsage for each genre
        console.log(`\n📄 [Step 2/X] Fetching ${num_passages} articles with semantic data`);

        const articlesData: Array<{
            articleMeta: any;
            semantic_ideas: any;
            authorial_persona: any;
            genre: string;
        }> = [];

        // Fetch one article per passage from the genres
        for (let i = 0; i < num_passages; i++) {
            const genre = genres[i % genres.length]; // Cycle through genres
            console.log(`\n📘 [Article ${i + 1}/${num_passages}] Fetching for genre: ${genre}`);

            const { articleMeta, semantic_ideas, authorial_persona } = await fetchArticleForUsage({
                genre: genre,
                usageType: "mock"
            });

            articlesData.push({
                articleMeta,
                semantic_ideas,
                authorial_persona,
                genre
            });

            console.log(`✅ [Article ${i + 1}] Fetched: ${articleMeta.title}`);
        }

        console.log(`\n✅ [Article Fetch] Successfully fetched ${articlesData.length} articles with semantic data`);

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

        console.log(`\n✍️ [Step 4/X] Generating ${articlesData.length} CAT-style passages`);

        // Store passage IDs for later use
        const passageIds: string[] = [];

        for (let i = 0; i < articlesData.length; i++) {
            const { articleMeta, semantic_ideas, authorial_persona, genre } = articlesData[i];

            console.log(`\n📝 [Passage ${i + 1}/${articlesData.length}] Genre: ${genre}`);

            // Use semantic ideas and persona from database (no extraction needed)
            console.log(`   🧠 [Passage ${i + 1}] Using pre-computed semantic ideas and persona from database`);

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

            // Evaluate CAT-likeness
            console.log(`   📊 [Passage ${i + 1}] Evaluating CAT-likeness`);
            const evaluation = await evaluateCATLikeness(draftPassage);
            console.log(`   📊 [Passage ${i + 1}] CAT-likeness score: ${evaluation.overall_score}`);

            console.log(`   ⚡ [Passage ${i + 1}] Sharpening passage (score: ${evaluation.overall_score})`);
            const improvedPassageData = await sharpenToCATStyle({
                passage: draftPassage,
                deficiencies: evaluation.key_deficiencies,
            });

            // Register passage in DataManager (this assigns ID automatically)
            const passageId = createPassage(dataManager, {
                content: improvedPassageData.content,
                genre: genre,
                articleId: articleMeta.id,
                articleSource: articleMeta.source_name,
            });

            passageIds.push(passageId);

            const wordCount = improvedPassageData.content.split(/\s+/).length;
            console.log(`   ✅ [Passage ${i + 1}] Created with ID: ${passageId.substring(0, 8)}... (${wordCount} words)`);
        }

        // --- PHASE 3: RC QUESTIONS ---

        console.log(`\n❓ [Step 5/X] Generating RC Questions`);

        for (let i = 0; i < passageIds.length; i++) {
            const passageId = passageIds[i];
            const articleData = articlesData[i];

            const rcQuestionsCount = question_type_distribution?.rc_questions || 4;
            if (rcQuestionsCount > 0) {
                console.log(`\n❓ [RC Questions Passage ${i + 1}] Generating ${rcQuestionsCount} questions`);

                // Generate questions (LLM returns raw question data)
                const rcQuestions = await generateRCQuestions({
                    passageData: {
                        passageData: {
                            id: passageId,
                            content: dataManager.getPassagesForDB("")[i].content,
                        }
                    },
                    referenceData: referenceDataRC,
                    questionCount: rcQuestionsCount,
                    personalization: {
                        targetMetrics: target_metrics,
                        weakAreas: weak_areas_to_address,
                    },
                });

                // Register questions in DataManager
                const questionIds = createRCQuestions(dataManager, passageId, rcQuestions);
                console.log(`✅ [RC Questions Passage ${i + 1}] Created ${questionIds.length} questions`);
            }
        }

        // --- PHASE 4: VA QUESTIONS ---

        console.log(`\n🔮 [Step 6/X] Generating VA questions`);

        // Generate VA questions using available passages (with fallback to first passage)
        const getArticleData = (index: number) => {
            return articlesData[index] || articlesData[0];
        };

        const getPassageContent = (index: number) => {
            const passages = dataManager.getPassagesForDB("");
            return passages[index]?.content || passages[0]?.content || "";
        };

        // Para summary
        const vaQuestionsSummary = await generateVAQuestions({
            semanticIdeas: getArticleData(0).semantic_ideas,
            authorialPersona: getArticleData(0).authorial_persona,
            referenceData: referenceDataVA,
            passageText: getPassageContent(0),
            questionDistribution: {
                para_summary: 2,
                para_completion: 0,
                para_jumble: 0,
                odd_one_out: 0,
            },
            personalization: {
                targetMetrics: target_metrics,
                weakAreas: weak_areas_to_address,
            },
        });

        createVAQuestions(dataManager, vaQuestionsSummary);

        // Para completion
        const vaQuestionsParaCompletion = await generateVAQuestions({
            semanticIdeas: getArticleData(1).semantic_ideas,
            authorialPersona: getArticleData(1).authorial_persona,
            referenceData: referenceDataVA,
            passageText: getPassageContent(1),
            questionDistribution: {
                para_summary: 0,
                para_completion: 2,
                para_jumble: 0,
                odd_one_out: 0,
            },
            personalization: {
                targetMetrics: target_metrics,
                weakAreas: weak_areas_to_address,
            },
        });

        createVAQuestions(dataManager, vaQuestionsParaCompletion);

        // Para jumble
        const vaQuestionsParaJumble = await generateVAQuestions({
            semanticIdeas: getArticleData(2).semantic_ideas,
            authorialPersona: getArticleData(2).authorial_persona,
            referenceData: referenceDataVA,
            passageText: getPassageContent(2),
            questionDistribution: {
                para_summary: 0,
                para_completion: 0,
                para_jumble: 2,
                odd_one_out: 0,
            },
            personalization: {
                targetMetrics: target_metrics,
                weakAreas: weak_areas_to_address,
            },
        });

        createVAQuestions(dataManager, vaQuestionsParaJumble);

        // Odd one out
        const vaQuestionsOddOneOut = await generateVAQuestions({
            semanticIdeas: getArticleData(3 % articlesData.length).semantic_ideas,
            authorialPersona: getArticleData(3 % articlesData.length).authorial_persona,
            referenceData: referenceDataVA,
            passageText: getPassageContent(3 % passageIds.length),
            questionDistribution: {
                para_summary: 0,
                para_completion: 0,
                para_jumble: 0,
                odd_one_out: 2,
            },
            personalization: {
                targetMetrics: target_metrics,
                weakAreas: weak_areas_to_address,
            },
        });

        createVAQuestions(dataManager, vaQuestionsOddOneOut);

        console.log(`✅ [VA Questions] Generated all VA questions`);

        // --- PHASE 5: ANSWER SELECTION ---

        console.log(`\n✅ [Step 7/X] Selecting correct answers`);

        // Get all questions for answer selection
        const allRCQuestions = getQuestionsForProcessing(dataManager).filter(q => q.passage_id !== null);
        const allVAQuestions = getQuestionsForProcessing(dataManager).filter(q => q.passage_id === null);

        // Select RC answers
        for (let i = 0; i < passageIds.length; i++) {
            const passageId = passageIds[i];
            const passageContent = dataManager.getPassagesForDB("")[i].content;
            const rcQuestions = allRCQuestions.filter(q => q.passage_id === passageId);

            if (rcQuestions.length > 0) {
                const rcQuestionsWithAnswers = await selectCorrectAnswers({
                    passageText: passageContent,
                    questions: rcQuestions,
                });

                // Update questions in DataManager
                for (const q of rcQuestionsWithAnswers) {
                    dataManager.updateQuestion(q.id, {
                        correctAnswer: q.correct_answer,
                    });
                }
            }
        }

        // Select VA answers
        const vaQuestionsWithAnswers = await selectVAAnswers({
            questions: allVAQuestions,
        });

        for (const q of vaQuestionsWithAnswers) {
            dataManager.updateQuestion(q.id, {
                correctAnswer: q.correct_answer,
            });
        }

        // --- PHASE 6: GRAPH & RATIONALES ---

        console.log(`\n🏷️ [Step 8/X] Fetching reasoning graph nodes`);
        const nodes = await fetchNodes();

        console.log(`🕸️ [Step 9/X] Tagging questions and building graph context`);

        // Get updated questions after answer selection
        const updatedRCQuestions = getQuestionsForProcessing(dataManager).filter(q => q.passage_id !== null);
        const updatedVAQuestions = getQuestionsForProcessing(dataManager).filter(q => q.passage_id === null);

        // Tag RC questions
        const rcTagged = await tagQuestionsWithNodes({
            passageText: dataManager.getPassagesForDB("")[0]?.content || "",
            questions: updatedRCQuestions,
        });

        // Tag VA questions
        const vaTagged = await tagVAQuestionsWithNodes({
            questions: updatedVAQuestions,
        });

        const rcContext = await getQuestionGraphContext(rcTagged, nodes);
        const vaContext = await getQuestionGraphContext(vaTagged, nodes);

        // Generate rationales for RC questions
        console.log(`\n🧾 [Step 10/X] Generating rationales for RC questions`);
        for (let i = 0; i < passageIds.length; i++) {
            const passageId = passageIds[i];
            const passageText = dataManager.getPassagesForDB("")[i].content;
            const filteredRCQuestions = updatedRCQuestions.filter(q => q.passage_id === passageId);

            if (filteredRCQuestions.length > 0) {
                const rcQuestionsWithRationales = await generateRationalesWithEdges({
                    passageText: passageText,
                    questions: filteredRCQuestions,
                    reasoningContexts: rcContext,
                    referenceData: referenceDataRC,
                });

                // Update questions with rationales and tags
                for (const q of rcQuestionsWithRationales) {
                    dataManager.updateQuestion(q.id, {
                        rationale: q.rationale,
                        tags: q.tags,
                    });
                }
            }
        }

        // Generate rationales for VA questions
        console.log(`\n🧾 [Step 11/X] Generating rationales for VA questions`);
        const vaQuestionsFinal = await generateVARationalesWithEdges({
            questions: updatedVAQuestions,
            reasoningContexts: vaContext,
            referenceData: referenceDataVA,
        });

        for (const q of vaQuestionsFinal) {
            dataManager.updateQuestion(q.id, {
                rationale: q.rationale,
                tags: q.tags,
            });
        }

        // --- PHASE 7: FINALIZATION ---

        console.log(`\n📋 [Step 12/X] Formatting output for database upload`);

        // Format output using DataManager
        const output = formatOutputForDB(dataManager, {
            userId: user_id,
            mockName: mock_name || "Customized Test",
            timeLimitMinutes: time_limit_minutes,
        });

        // Validate output
        if (!validateOutputForDB(output)) {
            throw new Error("Output validation failed");
        }

        // Generate and print report
        const report = generateOutputReport(output);
        console.log(report);

        const stats = dataManager.getStats();
        console.log("\nBreakdown:");
        console.log(`   Total Passages: ${stats.passageCount}`);
        console.log(`   Total Questions: ${stats.totalQuestions} (RC: ${stats.rcQuestions}, VA: ${stats.vaQuestions})`);

        // Save to file for review
        const fs = require('fs');
        const outputPath = './justReadingOutputCustom.json';
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`\n💾 Output saved to: ${outputPath}`);

        console.log(`\n📋 [Step 13/X] Uploading to database`);
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
