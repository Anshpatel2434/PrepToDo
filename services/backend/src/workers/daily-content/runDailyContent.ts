// =============================================================================
// Daily Content Worker - Main Orchestrator
// =============================================================================
// Refactored for Drizzle ORM - Main workflow for generating daily CAT practice content

import { fetchGenreForToday } from "./retrieval/fetchGenre";
import { fetchPassagesData } from "./retrieval/passageHandling/fetchPassagesData";
import { fetchQuestionsData } from "./retrieval/fetchQuestionsData";
import { generateEmbedding } from "./retrieval/generateEmbedding";
import { searchPassageAndQuestionEmbeddings } from "./retrieval/searchPassageAndQuestionEmbeddings";
import { generateRCQuestions } from "./retrieval/rcQuestionsHandling/generateRCQuestions";
import { fetchNodes } from "./graph/fetchNodes";
import { getQuestionGraphContext } from "./graph/createReasoningGraphContext";

// VA specific imports
import { generateAllVAQuestions } from "./retrieval/vaQuestionsHandling/generateAllVAQuestions";
import { formatOutputForDB, generateOutputReport } from "./retrieval/formatOutputForDB";
import { saveAllDataToDB } from "./retrieval/saveAllDataToDB";
import { fetchArticleForUsage } from "./retrieval/articleHandling/fetchArticleForUsage";

// Cost tracking
import { CostTracker } from "./retrieval/utils/CostTracker";

// Data management
import { DataManager } from "./retrieval/dataManager";
import {
    createPassage,
    createRCQuestions,
    createVAQuestions,
    updateQuestionsWithAnswers,
    updateQuestionsWithRationalesAndTags,
    getQuestionsForProcessing
} from "./retrieval/entityBuilder";

import type { DailyContentResult, Passage, Question } from "./types";
import { generatePassage } from "./retrieval/passageHandling/generatePassage";
import { selectCorrectAnswers } from "./retrieval/rcQuestionsHandling/selectCorrectAnswers";
import { selectVAAnswers } from "./retrieval/vaQuestionsHandling/selectVAAnswers";
import { tagQuestionsWithNodes } from "./retrieval/rcQuestionsHandling/tagQuestionsWithNodes";
import { tagVAQuestionsWithNodes } from "./retrieval/vaQuestionsHandling/tagVAQuestionsWithNodes";
import { generateBatchRCRationales } from "./retrieval/rcQuestionsHandling/generateBatchRCRationales";
import { generateBatchVARationales } from "./retrieval/vaQuestionsHandling/generateBatchVARationales";

/**
 * Main workflow for generating daily CAT practice content.
 * Refactored to use centralized DataManager for clean ID management.
 */
export async function runDailyContent(): Promise<DailyContentResult> {
    console.log("🚀 [START] Daily Content Generation sequence initiated");

    try {
        // Initialize DataManager - central source of truth for all IDs
        const dataManager = new DataManager();
        console.log(`✅ [DataManager] Initialized with Exam ID: ${dataManager.getExamId()}`);

        // Initialize Cost Tracker (Strategy 14)
        const costTracker = new CostTracker();
        console.log("💰 [CostTracker] Initialized for monitoring AI costs");

        // --- PHASE 1: PREPARATION & RETRIEVAL ---
        console.log("\n🎯 [Step 1/15] Selecting genre");
        const genre = await fetchGenreForToday();

        console.log("\n🧠 [Step 4/15] Extracting semantic ideas and persona from database");
        const { articleMeta, semantic_ideas, authorial_persona } = await fetchArticleForUsage({ genre: genre.name, usageType: "daily" });

        console.log("\n🧠 [Step 5/15] Generating embedding and fetching PYQ references");
        const embedding = await generateEmbedding(genre.name);
        // Strategy 6: Reduce from 5 to 3 references
        const matches = await searchPassageAndQuestionEmbeddings(embedding, 3);

        // Fetch full data for matches (from old workflow logic)
        const passageMatches = matches.passages as any[];
        const questionMatches = matches.questions as any[];

        const passages = await fetchPassagesData(passageMatches.map((m: any) => m.passage_id));
        const questions = await fetchQuestionsData(
            questionMatches.map((m: any) => m.question_id),
            passageMatches.map((m: any) => m.passage_id)
        );
        const passagesContent = passages.map((p: any) => p.content);

        // Format reference data for RC (Questions linked to specific passages)
        // Strategy 6: Reduce from 3 to 2 references
        const referenceDataRC = passages.slice(0, 2).map((p: any) => ({
            passage: p,
            questions: questions.filter((q: any) => q.passage_id === p.id)
        }));

        // Format reference data for VA (Standalone questions/PYQs)
        // Separate logic for VA references: we want standalone questions mostly.
        const allReferenceQuestions = questions.filter((q: any) => q.passage_id === null || q.passage_id === undefined);

        // We still keep referenceDataVA for passage style context if needed, but primary is Questions
        const referenceDataVA = passages.slice(0, 2).map((p: any) => ({
            passage: p,
            questions: [] // No specific attached questions for these passages in VA context usually
        }));

        // --- PHASE 2: PASSAGE GENERATION ---
        console.log("\n✍️ [Step 6/15] Generating CAT-style passage");
        // Strategy 3: Skip evaluation/sharpening steps - use passage directly
        const passageData = await generatePassage({
            semanticIdeas: semantic_ideas,
            authorialPersona: authorial_persona,
            referencePassages: passagesContent,
        }, costTracker);

        // Register passage in DataManager (this assigns ID automatically)
        const passageId = createPassage(dataManager, {
            title: null,
            content: passageData,
            genre: genre.name,
            articleId: articleMeta.id,
            articleSource: articleMeta.source_name || "",
        });

        const passageText = dataManager.getPassageContent();
        const wordCount = passageText.split(/\s+/).length;
        console.log(`✅ [Passage] Created with ID: ${passageId.substring(0, 8)}... (${wordCount} words)`);

        // --- PHASE 3: RC QUESTIONS ---
        console.log("\n❓ [Step 7/15] Generating RC questions");
        const rcQuestionsRaw = await generateRCQuestions({
            passageText,
            referenceData: referenceDataRC,
            questionCount: 4,
        }, costTracker);

        // Register RC questions in DataManager
        const rcQuestionIds = createRCQuestions(dataManager, passageId, rcQuestionsRaw);
        console.log(`✅ [RC Questions] Created ${rcQuestionIds.length} questions`);

        // --- PHASE 4: VA QUESTIONS ---
        console.log("\n🔮 [Step 9/15] Generating all VA questions");
        const vaQuestionsRaw = await generateAllVAQuestions({
            semanticIdeas: semantic_ideas,
            authorialPersona: authorial_persona,
            referenceData: referenceDataVA,
            referenceQuestions: { questions: allReferenceQuestions },
            passageText,
        }, costTracker);

        // Register VA questions in DataManager
        const vaQuestionIds = createVAQuestions(dataManager, vaQuestionsRaw);
        console.log(`✅ [VA Questions] Created ${vaQuestionIds.length} questions`);

        // --- PHASE 5: ANSWER SELECTION ---
        console.log("\n✅ [Step 8/15] Selecting correct answers for RC");
        const allRCQuestions = getQuestionsForProcessing(dataManager).filter(q => q.passage_id !== null);
        const rcQuestionsWithAnswers = await selectCorrectAnswers({
            passageText,
            questions: allRCQuestions,
        });

        // Update RC questions with answers
        updateQuestionsWithAnswers(dataManager, rcQuestionsWithAnswers);

        console.log("\n✅ [Step 10/15] Selecting correct answers for VA");
        const allVAQuestions = getQuestionsForProcessing(dataManager).filter(q => q.passage_id === null);
        const vaQuestionsWithAnswers = await selectVAAnswers({
            questions: allVAQuestions,
        });

        // Update VA questions with answers
        updateQuestionsWithAnswers(dataManager, vaQuestionsWithAnswers);

        // --- PHASE 6: GRAPH & RATIONALES ---
        console.log("\n🏷️ [Step 11/15] Fetching reasoning graph nodes");
        const nodes = await fetchNodes();

        console.log("\n🕸️ [Step 12/15] Tagging questions and building graph context");

        // Get updated questions after answer selection
        const updatedRCQuestions = getQuestionsForProcessing(dataManager).filter(q => q.passage_id !== null);
        const updatedVAQuestions = getQuestionsForProcessing(dataManager).filter(q => q.passage_id === null);

        const rcTagged = await tagQuestionsWithNodes({ passageText, questions: updatedRCQuestions });
        const vaTagged = await tagVAQuestionsWithNodes({ questions: updatedVAQuestions });

        const rcContext = await getQuestionGraphContext(rcTagged, nodes as any);
        const vaContext = await getQuestionGraphContext(vaTagged, nodes as any);

        console.log("\n🧾 [Step 13/15] Generating rationales for RC (batched)");
        const rcQuestionsFinal = await generateBatchRCRationales({
            passageText,
            questions: updatedRCQuestions,
            reasoningContexts: rcContext,
            referenceData: referenceDataRC,
        }, costTracker);

        // Update RC questions with rationales and tags
        updateQuestionsWithRationalesAndTags(dataManager, rcQuestionsFinal);

        console.log("\n🧾 [Step 14/15] Generating rationales for VA (batched)");
        const vaQuestionsFinal = await generateBatchVARationales({
            questions: updatedVAQuestions,
            reasoningContexts: vaContext,
            referenceQuestions: allReferenceQuestions
        }, costTracker);

        // Update VA questions with rationales and tags
        updateQuestionsWithRationalesAndTags(dataManager, vaQuestionsFinal);

        // --- PHASE 7: FINALIZATION ---
        console.log("\n📋 [Step 15/16] Formatting output for database upload");

        // Format output using DataManager
        const output = formatOutputForDB(dataManager, genre);

        // Generate and print report
        const report = generateOutputReport(output);
        console.log(report);

        const stats = dataManager.getStats();
        console.log("\nBreakdown:");
        console.log(`   Total Questions: ${stats.totalQuestions} (RC: ${stats.rcQuestions}, VA: ${stats.vaQuestions})`);

        // --- PHASE 8: DATABASE UPLOAD ---
        console.log("\n📋 [Step 16/16] Uploading to database");
        await saveAllDataToDB({
            examData: output.exam,
            passageData: output.passage,
            questionsData: output.questions
        });

        // Strategy 14: Print cost tracking report
        console.log("\n✅ [COMPLETE] Daily Content Generation finished successfully");
        costTracker.printReport();

        return {
            success: true,
            exam_id: dataManager.getExamId(),
            message: "Daily content generated successfully",
            stats: {
                total_questions: stats.totalQuestions,
                rc_questions: stats.rcQuestions,
                va_questions: stats.vaQuestions,
                passage_word_count: wordCount,
                genre: genre.name,
            }
        };

    } catch (error) {
        console.error("\n❌ [ERROR] Daily Content Generation failed:");
        console.error(error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Helper to print the final generation report
 */
function printSummaryReport(output: any) {
    console.log("=".repeat(50));
    console.log(`PASSAGE: ${output.passage.title} (${output.passage.word_count} words)`);
    console.log(`TOTAL QUESTIONS: ${output.questions.length}`);

    const counts = output.questions.reduce((acc: Record<string, number>, q: any) => {
        acc[q.question_type] = (acc[q.question_type] || 0) + 1;
        return acc;
    }, {});

    console.log("BREAKDOWN:");
    Object.entries(counts).forEach(([type, count]) => {
        console.log(` - ${type}: ${count}`);
    });
    console.log("=".repeat(50));
}
