import { fetchGenreForToday } from "./retrieval/fetchGenre";
import { fetchPassagesData } from "./retrieval/passageHandling/fetchPassagesData";
import { fetchQuestionsData } from "./retrieval/fetchQuestionsData";
import { generateEmbedding } from "./retrieval/generateEmbedding";
import { generatePassage } from "./retrieval/passageHandling/generatePassage";
import { searchPassageAndQuestionEmbeddings } from "./retrieval/searchPassageAndQuestionEmbeddings";
import { generateRCQuestions } from "./retrieval/rcQuestionsHandling/generateRCQuestions";
import { selectCorrectAnswers } from "./retrieval/rcQuestionsHandling/selectCorrectAnswers";
import { fetchNodes } from "./graph/fetchNodes";
import { tagQuestionsWithNodes } from "./retrieval/rcQuestionsHandling/tagQuestionsWithNodes";
import { getQuestionGraphContext } from "./graph/createReasoningGraphContext";
import { generateBatchRCRationales } from "./retrieval/rcQuestionsHandling/generateBatchRCRationales";

// VA specific imports
import { generateAllVAQuestions } from "./retrieval/vaQuestionsHandling/generateAllVAQuestions";
import { selectVAAnswers } from "./retrieval/vaQuestionsHandling/selectVAAnswers";
import { tagVAQuestionsWithNodes } from "./retrieval/vaQuestionsHandling/tagVAQuestionsWithNodes";
import { generateBatchVARationales } from "./retrieval/vaQuestionsHandling/generateBatchVARationales";
import { formatOutputForDB, generateOutputReport } from "./retrieval/formatOutputForDB";
import { saveAllDataToDB } from "./retrieval/saveAllDataToDB";
import { fetchArticleForUsage } from "./retrieval/articleHandling/fetchArticleForUsage";

// Cost tracking
import { CostTracker } from "./retrieval/utils/CostTracker";

// NEW: Import DataManager and EntityBuilder
import { DataManager } from "./retrieval/dataManager";
import {
    createPassage,
    createRCQuestions,
    createVAQuestions,
    updateQuestionsWithAnswers,
    updateQuestionsWithRationalesAndTags,
    getQuestionsForProcessing
} from "./retrieval/entityBuilder";

/**
 * Main workflow for generating daily CAT practice content.
 * Refactored to use centralized DataManager for clean ID management.
 */
export async function runDailyContent() {
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
        const passages = await fetchPassagesData(matches.passages.map(m => m.passage_id));
        const questions = await fetchQuestionsData(
            matches.questions.map(m => m.question_id),
            matches.passages.map(m => m.passage_id)
        );
        const passagesContent = passages.map(({ content }) => content);

        // Format reference data for RC (Questions linked to specific passages)
        // Strategy 6: Reduce from 3 to 2 references
        const referenceDataRC = passages.slice(0, 2).map(p => ({
            passage: p,
            questions: questions.filter(q => q.passage_id === p.id)
        }));

        // Format reference data for VA (Standalone questions/PYQs)
        // Strategy 6: Reduce from 3 to 2 references
        const referenceDataVA = passages.slice(0, 2).map(p => ({
            passage: p,
            questions: questions.filter(q => q.passage_id === null || q.passage_id === undefined)
        }));

        // --- PHASE 2: PASSAGE GENERATION ---
        console.log("\n✍️ [Step 6/15] Generating CAT-style passage");
        // Strategy 3: Skip evaluation/sharpening steps - use passage directly
        const passageData = await generatePassage({
            semanticIdeas: semantic_ideas,
            authorialPersona: authorial_persona,
            referencePassages: passagesContent, // Now uses 3 references (Strategy 6)
        }, costTracker);

        // Register passage in DataManager (this assigns ID automatically)
        const passageId = createPassage(dataManager, {
            title: null, // No title from direct generation
            content: passageData,
            genre: genre.name,
            articleId: articleMeta.id,
            articleSource: articleMeta.source_name,
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
        // Strategy 7: Consolidated VA question generation (single API call)
        console.log("\n🔮 [Step 9/15] Generating all VA questions (Summary, Completion, Jumbles, Odd One Out)");
        const vaQuestionsRaw = await generateAllVAQuestions({
            semanticIdeas: semantic_ideas,
            authorialPersona: authorial_persona,
            referenceData: referenceDataVA, // Now uses 2 references (Strategy 6)
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

        const rcContext = await getQuestionGraphContext(rcTagged, nodes);
        const vaContext = await getQuestionGraphContext(vaTagged, nodes);

        // Strategy 1: Batch rationale generation (single API call for all RC questions)
        console.log("\n🧾 [Step 13/15] Generating rationales for RC (batched)");
        const rcQuestionsFinal = await generateBatchRCRationales({
            passageText,
            questions: updatedRCQuestions,
            reasoningContexts: rcContext,
            referenceData: referenceDataRC, // Now uses 2 references (Strategy 6)
        }, costTracker);

        // Update RC questions with rationales and tags
        updateQuestionsWithRationalesAndTags(dataManager, rcQuestionsFinal);

        // Strategy 1: Batch rationale generation (single API call for all VA questions)
        console.log("\n🧾 [Step 14/15] Generating rationales for VA (batched)");
        const vaQuestionsFinal = await generateBatchVARationales({
            questions: updatedVAQuestions,
            reasoningContexts: vaContext,
            referenceData: referenceDataVA, // Now uses 2 references (Strategy 6)
        }, costTracker);

        // Update VA questions with rationales and tags
        updateQuestionsWithRationalesAndTags(dataManager, vaQuestionsFinal);

        // --- PHASE 7: FINALIZATION ---
        console.log("\n📋 [Step 15/16] Formatting output for database upload");

        // Format output using DataManager
        const output = formatOutputForDB(dataManager, genre);

        // Validate output
        // if (!validateOutputForDB(output)) {
        //     throw new Error("Output validation failed");
        // }

        // Generate and print report
        const report = generateOutputReport(output);
        console.log(report);

        const stats = dataManager.getStats();
        console.log("\nBreakdown:");
        console.log(`   Total Questions: ${stats.totalQuestions} (RC: ${stats.rcQuestions}, VA: ${stats.vaQuestions})`);

        // Save to file for review
        // const fs = require('fs');
        // const outputPath = './justReadingOutput.json';
        // fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        // console.log(`\n💾 Output saved to: ${outputPath}`);

        printSummaryReport(output);

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

        return output;

    } catch (error) {
        console.error("\n❌ [ERROR] Daily Content Generation failed:");
        console.error(error);
        throw error;
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