// runDailyContent.ts
import { extractSemanticIdeasAndPersona } from "./retrieval/passageHandling/extractSemanticIdeas";
import { fetchGenreForToday } from "./retrieval/fetchGenre";
import { fetchPassagesData } from "./retrieval/passageHandling/fetchPassagesData";
import { fetchQuestionsData } from "./retrieval/fetchQuestionsData";
import { generateEmbedding } from "./retrieval/generateEmbedding";
import { generatePassage } from "./retrieval/passageHandling/generatePassage";
import { saveArticleToDB } from "./retrieval/articleHandling/saveArticle";
import { searchPassageAndQuestionEmbeddings } from "./retrieval/searchPassageAndQuestionEmbeddings";
import { getValidArticleWithText } from "./retrieval/articleHandling/getValidArticleWithText";
import { finalizeCATPassage } from "./retrieval/passageHandling/finalizeCATPassage";
import { generateRCQuestions } from "./retrieval/rcQuestionsHandling/generateRCQuestions";
import { selectCorrectAnswers } from "./retrieval/rcQuestionsHandling/selectCorrectAnswers";
import { fetchNodes } from "./graph/fetchNodes";
import { tagQuestionsWithNodes } from "./retrieval/rcQuestionsHandling/tagQuestionsWithNodes";
import { getQuestionGraphContext } from "./graph/createReasoningGraphContext";
import { generateRationalesWithEdges } from "./retrieval/rcQuestionsHandling/generateRationaleWithEdges";
import { runCompleteDailyContent } from "./retrieval/vaQuestionsHandling/runVAQuestions";

/**
 * Main workflow for generating daily CAT practice content.
 *
 * Workflow Steps:
 * 1. Select genre
 * 2. Fetch valid article with text
 * 3. Save article to database
 * 4. Extract semantic ideas and authorial persona
 * 5. Generate embedding for genre/topic
 * 6. Retrieve similar passages and questions via vector search
 * 7. Generate CAT-style passage using semantic ideas and PYQ references
 * 8. Evaluate and sharpen passage to CAT standards
 * 9. Generate RC questions using PYQ patterns for guidance
 * 10. Select correct answers for each question
 * 11. Tag each question with primary reasoning node from graph
 * 12. Build reasoning graph context (nodes + edges) for each question
 * 13. Generate elimination-driven rationales using graph structure
 * 14. Format output for database upload (Exam, Passage, Questions)
 */

export async function runDailyContent() {
    console.log("🚀 [START] Daily Content Generation start ");

    try {
        // Step 1: Select genre
        console.log("\n🎯 [Step 1/14] Selecting genre");
        const genre = await fetchGenreForToday();
        console.log(`   Selected genre: ${genre.name}`);

        // Step 2: Fetch valid article with text
        console.log("\n📄 [Step 2/14] Fetching valid article with text");
        const { articleMeta, articleText } = await getValidArticleWithText(genre.name);
        console.log(`   Article title: ${articleMeta.title}`);
        console.log(`   Article length: ${articleText.length} characters`);

        // Step 3: Save article to database
        console.log("\n💾 [Step 3/14] Saving article to database");
        await saveArticleToDB(articleMeta);
        console.log("   Article saved successfully");

        // Step 4: Extract semantic ideas and authorial persona
        console.log("\n🧠 [Step 4/14] Extracting semantic ideas and authorial persona");
        const { semantic_ideas, authorial_persona } = await extractSemanticIdeasAndPersona(articleText, genre.name);
        console.log(`   Semantic ideas extracted successfully`);
        console.log(`   Authorial persona extracted successfully`);

        // Step 5: Generate embedding for genre/topic
        console.log("\n🧠 [Step 5/14] Generating embedding for genre/topic");
        const embedding = await generateEmbedding(genre.name);
        console.log("   Embedding generated successfully");

        // Step 6: Retrieve similar passages and questions via vector search
        console.log("\n🔎 [Step 6/14] Vector search for similar passages and questions");
        const matches = await searchPassageAndQuestionEmbeddings(embedding, 5);
        const passagesMatches = matches.passages;
        const questionsMatches = matches.questions;
        console.log(`   Found ${passagesMatches.length} passages`);
        console.log(`   Found ${questionsMatches.length} questions`);

        // Step 7: Generate CAT-style passage using semantic ideas and PYQ references
        console.log("\n✍️ [Step 7/14] Generating new CAT-style passage");
        const passageGenerated = await generatePassage({
            semanticIdeas: semantic_ideas,
            authorialPersona: authorial_persona,
            referencePassages: passagesMatches.map(p => p.content),
        });
        console.log("   Passage generated successfully");

        // Step 8: Evaluate and sharpen passage to CAT standards
        console.log("\n🛠️ [Step 8/14] Finalizing passage (evaluate + sharpen)");
        const data = await finalizeCATPassage(passageGenerated);
        console.log("   Passage finalized successfully");

        // Step 9: Generate RC questions using PYQ patterns for guidance
        console.log("\n❓ [Step 9/14] Generating RC questions from PYQ patterns");
        const referenceData = passagesMatches.slice(0, 3).map(passage => {
            passage: passage,
            questions: questionsMatches.filter(q => q.passage_id === passage.id),
        });

        const rcQuestions = await generateRCQuestions({
            passageText: data["passageData"].content,
            referenceData: referenceData,
            questionCount: 4,
        });
        console.log(`   Generated ${rcQuestions.length} RC questions`);

        // Step 10: Select correct answers for each question
        console.log("\n✅ [Step 10/14] Selecting correct answers");
        const rcQuestionsWithAnswers = await selectCorrectAnswers({
            passageText: data["passageData"].content,
            questions: rcQuestions,
        });
        console.log("   Correct answers selected for RC questions");

        // Step 11: Tag each question with primary reasoning node from graph
        console.log("\n🏷️ [Step 11/14] Fetching graph + tagging + assembling reasoning context (RC questions)");
        const nodes = await fetchNodes();

        const rcQuestionsTaggedWithNodes = await tagQuestionsWithNodes({
            passageText: data["passageData"].content,
            questions: rcQuestionsWithAnswers,
            nodes: nodes,
        });
        console.log("   RC questions tagged with nodes");

        // Step 12: Build reasoning graph context (nodes + edges) for RC questions
        console.log("\n🕸️ [Step 12/14] Building reasoning graph context for RC questions");
        const reasoningGraphContextForRCQuestions = await getQuestionGraphContext(
            rcQuestionsTaggedWithNodes,
            nodes
        );
        console.log("   Reasoning graph context built for RC questions");

        // Step 13: Generate elimination-driven rationales using graph structure (RC questions)
        console.log("\n🧾 [Step 13/14] Generating rationales (graph-driven elimination) for RC questions");
        const rcQuestionsWithRationales = await generateRationalesWithEdges({
            passageText: data["passageData"].content,
            questions: rcQuestionsTaggedWithNodes,
            reasoningContexts: reasoningGraphContextForRCQuestions,
            referenceData: referenceData,
        });
        console.log("   Rationales generated for RC questions");

        // Step 14: Generate VA questions (NEW)
        console.log("\n🔮 [Step 14/14] Generating VA questions (para_summary, para_completion, para_jumble, odd_one_out)");
        const vaQuestions = await runCompleteDailyContent({
            semanticIdeas: semantic_ideas,
            authorialPersona: authorial_persona,
            genre: genre.name,
            passagesMatches,
            questionsMatches,
        });
        console.log(`   Generated ${vaQuestions.length} VA questions`);

        // Combine RC and VA questions
        const allQuestions = [...rcQuestionsWithRationales, ...vaQuestions];

        // Format output for database upload
        console.log("\n📋 [Step 14/14] Formatting output for database upload");
        const { exam, passage, questions } = await runCompleteDailyContent({
            semanticIdeas: semantic_ideas,
            authorialPersona: authorial_persona,
            genre: genre.name,
            passagesMatches,
            questionsMatches,
        });

        console.log("\n✅ [COMPLETE] Daily Content Generation finished");
        console.log("=".repeat(80));
        console.log("\n📊 SUMMARY:");
        console.log("-".repeat(40));
        console.log(`   Exam: ${exam.name} (${exam.year})`);
        console.log(`   Passage: ${passage.word_count} words, ${passage.genre}`);
        console.log(`   Questions: ${questions.length} total`);

        // Count by type
        const questionCounts = questions.reduce((acc, q) => {
            acc[q.question_type] = (acc[q.question_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log("\nBreakdown:");
        Object.entries(questionCounts).forEach(([type, count]) => {
            console.log(`   ${type}: ${count}`);
        });

        return allQuestions;

    } catch (error) {
        console.error("\n❌ [ERROR] Daily Content Generation failed:");
        console.error(error);
        throw error;
    }
}
