// runJustReadingTest.ts
// Simple test runner that uses existing test data and generates VA questions
import { semantic_ideas, authorial_persona, genreName } from "./retrieval/articleTestForTesting";
import { generateEmbedding } from "./retrieval/generateEmbedding";
import { searchPassageAndQuestionEmbeddings } from "./retrieval/searchPassageAndQuestionEmbeddings";
import { runCompleteDailyContent } from "./retrieval/vaQuestionsHandling/runVAQuestions";

/**
 * Test runner that generates complete daily content including VA questions
 */
async function runJustReadingTest() {
    try {
        console.log("🚀 [JustReading Test] Starting complete daily content generation");
        console.log("=".repeat(80));

        // Step 1: Generate embedding for genre/topic
        console.log("\n🧠 [Step 1/3] Generating embedding for genre:", genreName);
        const embedding = await generateEmbedding(genreName);
        console.log("✅ Embedding generated successfully");

        // Step 2: Search for similar passages and questions
        console.log("\n🔎 [Step 2/3] Searching for similar passages and questions...");
        const matches = await searchPassageAndQuestionEmbeddings(embedding, 5);
        const passagesMatches = matches.passages;
        const questionsMatches = matches.questions;

        console.log(`   Found ${passagesMatches.length} passages`);
        console.log(`   Found ${questionsMatches.length} questions`);
        console.log("✅ Search completed successfully");

        // Step 3: Run complete daily content generation (RC + VA questions)
        console.log("\n📝 [Step 3/3] Running complete daily content generation...");
        console.log("-".repeat(80));

        const result = await runCompleteDailyContent({
            semanticIdeas: semantic_ideas,
            authorialPersona: authorial_persona,
            genre: genreName,
            passagesMatches,
            questionsMatches,
        });

        console.log("-".repeat(80));
        console.log("\n✅ [JustReading Test] Test completed successfully!");
        console.log("=".repeat(80));

        // Log summary
        console.log("\n📊 SUMMARY:");
        console.log("-".repeat(40));
        console.log(`Exam: ${result.exam.name} (${result.exam.year})`);
        console.log(`Passage: ${result.passage.word_count} words, ${result.passage.genre}`);
        console.log(`Questions: ${result.questions.length} total`);

        // Count by type
        const questionTypes = result.questions.reduce((acc, q) => {
            acc[q.question_type] = (acc[q.question_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        console.log("\nBreakdown:");
        Object.entries(questionTypes).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
        });

        // Save to file for review
        const fs = require('fs');
        const outputPath = './justReadingOutput.json';
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`\n💾 Output saved to: ${outputPath}`);

        return result;

    } catch (error) {
        console.error("\n❌ [JustReading Test] Failed with error:");
        console.error(error);
        process.exit(1);
    }
}

// Run the test
console.log("Starting JustReading Test...\n");
runJustReadingTest().then(() => {
    console.log("\n🎉 Test completed successfully!");
    console.log("Check justReadingOutput.json for the complete output");
    process.exit(0);
}).catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
});
