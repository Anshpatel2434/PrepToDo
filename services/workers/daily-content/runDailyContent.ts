import { extractSemanticIdeasAndPersona } from "./retrieval/passageHandling/extractSemanticIdeas";
import { fetchGenreForToday } from "./retrieval/fetchGenre";
import { fetchPassagesData } from "./retrieval/passageHandling/fetchPassagesData";
import { fetchQuestionsData } from "./retrieval/fetchQuestionsData";
import { generateEmbedding } from "./retrieval/generateEmbedding";
import { generatePassage } from "./retrieval/passageHandling/generatePassage";
import { searchPassageAndQuestionEmbeddings } from "./retrieval/searchPassageAndQuestionEmbeddings";
import { getValidArticleWithText } from "./retrieval/articleHandling/getValidArticleWithText";
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
import { formatOutputForDB, generateOutputReport } from "./retrieval/vaQuestionsHandling/formatOutputForDB";
import { saveAllDataToDB } from "./retrieval/saveAllDataToDB";

/**
 * Main workflow for generating daily CAT practice content.
 * Merged RC + VA workflows with graph-driven rationales.
 */
export async function runDailyContent() {
    console.log("🚀 [START] Daily Content Generation sequence initiated");

    try {
        // --- PHASE 1: PREPARATION & RETRIEVAL ---
        console.log("\n🎯 [Step 1/15] Selecting genre");
        const genre = await fetchGenreForToday();

        console.log("\n📄 [Step 2,3/15] Fetching valid article with text and saving to database");
        const { articleMeta, articleText } = await getValidArticleWithText(genre.name);


        console.log("\n🧠 [Step 4/15] Extracting semantic ideas and persona");
        const { semantic_ideas, authorial_persona } = await extractSemanticIdeasAndPersona(articleText, genre.name);

        console.log("\n🧠 [Step 5/15] Generating embedding and fetching PYQ references");
        const embedding = await generateEmbedding(genre.name);
        const matches = await searchPassageAndQuestionEmbeddings(embedding, 5);

        // Fetch full data for matches (from old workflow logic)
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

        // --- PHASE 2: PASSAGE GENERATION ---
        console.log("\n✍️ [Step 6/15] Generating and sharpening CAT-style passage");
        const draftPassage = await generatePassage({
            semanticIdeas: semantic_ideas,
            authorialPersona: authorial_persona,
            referencePassages: passagesContent,
        });
        const finalizedData = await finalizeCATPassage(draftPassage);
        const passageText = finalizedData["passageData"].content;

        // --- PHASE 3: RC QUESTIONS ---
        console.log("\n❓ [Step 7/15] Generating RC questions");
        const rcQuestions = await generateRCQuestions({
            passageText,
            referenceData: referenceDataRC,
            questionCount: 4,
        });

        console.log("\n✅ [Step 8/15] Selecting correct answers for RC");
        const rcQuestionsWithAnswers = await selectCorrectAnswers({
            passageText,
            questions: rcQuestions,
        });

        // --- PHASE 4: VA QUESTIONS ---
        console.log("\n🔮 [Step 9/15] Generating VA questions (Summary, Completion, Jumbles)");
        const vaQuestions = await generateVAQuestions({
            semanticIdeas: semantic_ideas,
            authorialPersona: authorial_persona,
            referenceData: referenceDataVA,
            passageText,
        });

        console.log("\n✅ [Step 10/15] Selecting correct answers for VA");
        const vaQuestionsWithAnswers = await selectVAAnswers({
            questions: vaQuestions,
        });

        // --- PHASE 5: GRAPH & RATIONALES ---
        console.log("\n🏷️ [Step 11/15] Fetching reasoning graph nodes");
        const nodes = await fetchNodes();

        console.log("\n🕸️ [Step 12/15] Tagging questions and building graph context");
        const rcTagged = await tagQuestionsWithNodes({ passageText, questions: rcQuestionsWithAnswers, nodes });
        const vaTagged = await tagVAQuestionsWithNodes({ questions: vaQuestionsWithAnswers, nodes });

        const rcContext = await getQuestionGraphContext(rcTagged, nodes);
        const vaContext = await getQuestionGraphContext(vaTagged, nodes);
        console.log("--------------this is the vaContext-------------")

        console.log("\n🧾 [Step 13/15] Generating rationales for RC");
        const rcQuestionsFinal = await generateRationalesWithEdges({
            passageText,
            questions: rcQuestionsWithAnswers,
            reasoningContexts: rcContext,
            referenceData: referenceDataRC,
        });

        console.log("\n🧾 [Step 14/15] Generating rationales for VA");
        const vaQuestionsFinal = await generateVARationalesWithEdges({
            questions: vaQuestionsWithAnswers,
            reasoningContexts: vaContext,
            referenceData: referenceDataVA,
        });

        // --- PHASE 6: FINALIZATION ---
        console.log("\n📋 [Step 15/16] Formatting output for database upload");
        const output = formatOutputForDB({
            passageData: finalizedData["passageData"],
            rcQuestions: rcQuestionsFinal,
            vaQuestions: vaQuestionsFinal,
            genreData: genre
        });

        // Validate output
        // if (!validateOutputForDB(output)) {
        //     throw new Error("Output validation failed");
        // }

        // --- PHASE 6: FINALIZATION ---
        console.log("\n📋 [Step 16/16] Uploading to database");
        await saveAllDataToDB({
            examData: output.exam,
            passageData: output.passage,
            questionsData : output.questions
        });

        // Generate and print report
        const report = generateOutputReport(output);
        console.log(report);

        console.log("\nBreakdown:");

        // Save to file for review
        const fs = require('fs');
        const outputPath = './justReadingOutput.json';
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`\n💾 Output saved to: ${outputPath}`);

        console.log("\n✅ [COMPLETE] Daily Content Generation finished successfully");
        printSummaryReport(output);

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