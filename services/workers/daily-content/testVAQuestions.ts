// testVAQuestions.ts - Test runner for VA question generation
import { runCompleteDailyContent } from "./retrieval/vaQuestionsHandling/runVAQuestions";
import { semantic_ideas, authorial_persona, genreName } from "./retrieval/articleTestForTesting";
import { generateEmbedding } from "./retrieval/generateEmbedding";
import { searchPassageAndQuestionEmbeddings } from "./retrieval/searchPassageAndQuestionEmbeddings";

/**
 * Test function to run the complete VA question generation workflow
 */
async function testVAQuestions() {
    try {
        console.log("🚀 [TEST] Starting VA Questions Test");
        console.log("=".repeat(80));

        // Step 1: Generate embedding for genre/topic
        console.log("\n🧠 [TEST] Generating embedding for genre:", genreName);
        const embedding = await generateEmbedding(genreName);

        // Step 2: Search for similar passages and questions
        console.log("\n🔎 [TEST] Searching for similar passages and questions...");
        const matches = await searchPassageAndQuestionEmbeddings(embedding, 5);
        const passagesMatches = matches.passages;
        const questionsMatches = matches.questions;

        console.log(`   Found ${passagesMatches.length} passages and ${questionsMatches.length} questions`);

        // Step 3: Run complete daily content generation
        console.log("\n📝 [TEST] Running complete daily content generation...");
        console.log("=".repeat(80));

        const result = await runCompleteDailyContent({
            semanticIdeas: semantic_ideas,
            authorialPersona: authorial_persona,
            genre: genreName,
            passagesMatches,
            questionsMatches,
        });

        console.log("\n✅ [TEST] Test completed successfully!");
        console.log("=".repeat(80));
        console.log("\n📊 [TEST] Results Summary:");
        console.log(`   - Exam ID: ${result.exam.id}`);
        console.log(`   - Passage ID: ${result.passage.id}`);
        console.log(`   - Passage Word Count: ${result.passage.word_count}`);
        console.log(`   - Total Questions: ${result.questions.length}`);

        // Count question types
        const questionTypes = result.questions.reduce((acc, q) => {
            acc[q.question_type] = (acc[q.question_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log("\n📋 [TEST] Question Types:");
        Object.entries(questionTypes).forEach(([type, count]) => {
            console.log(`   - ${type}: ${count}`);
        });

        // Print passage preview
        console.log("\n📄 [TEST] Passage Preview (first 200 chars):");
        console.log(result.passage.content.substring(0, 200) + "...");

        // Print sample question
        if (result.questions.length > 0) {
            console.log("\n❓ [TEST] Sample Question:");
            const sampleQ = result.questions[0];
            console.log(`   Type: ${sampleQ.question_type}`);
            console.log(`   Question: ${sampleQ.question_text.substring(0, 100)}...`);
            console.log(`   Correct Answer: ${sampleQ.correct_answer.answer}`);
            console.log(`   Difficulty: ${sampleQ.difficulty}`);
        }

        // Log JSON output for DB upload
        console.log("\n💾 [TEST] JSON Output for DB Upload:");
        console.log("=".repeat(80));
        console.log(JSON.stringify(result, null, 2));

        console.log("\n✅ [TEST] All tests passed!");

        return result;

    } catch (error) {
        console.error("\n❌ [TEST] Test failed with error:");
        console.error(error);
        process.exit(1);
    }
}

// Run the test
testVAQuestions().then(() => {
    console.log("\n🎉 [TEST] Test runner finished");
    process.exit(0);
}).catch((error) => {
    console.error("\n💥 [TEST] Fatal error:", error);
    process.exit(1);
});
