// runVAQuestions.ts
import { extractSemanticIdeasAndPersona } from "../passageHandling/extractSemanticIdeas";
import { generatePassage } from "../passageHandling/generatePassage";
import { finalizeCATPassage } from "../passageHandling/finalizeCATPassage";
import { generateVAQuestions } from "./generateVAQuestions";
import { selectVAAnswers } from "./selectVAAnswers";
import { fetchNodes } from "../../graph/fetchNodes";
import { tagVAQuestionsWithNodes } from "./tagVAQuestionsWithNodes";
import { getQuestionGraphContext } from "../../graph/createReasoningGraphContext";
import { generateVARationalesWithEdges } from "./generateVARationales";
import { formatOutputForDB, validateOutputForDB, generateOutputReport } from "./formatOutputForDB";
import { Passage, Question, SemanticIdeas, AuthorialPersona } from "../../schemas/types";
import { fetchPassagesData } from "../passageHandling/fetchPassagesData";
import { fetchQuestionsData } from "../fetchQuestionsData";
import { groupQuestionsWithPassages } from "../rcQuestionsHandling/generateRCQuestions";

interface RunVAQuestionsParams {
    semanticIdeas: SemanticIdeas;
    authorialPersona: AuthorialPersona;
    genre: string;
    passagesMatches: Array<{ passage_id: string }>;
    questionsMatches: Array<{ question_id: string }>;
}

interface RunVAQuestionsResult {
    vaQuestions: Question[];
}

/**
 * Main workflow for generating VA questions (para_summary, para_completion, para_jumble, odd_one_out)
 * along with RC questions for the passage.
 */
export async function runVAQuestions(params: RunVAQuestionsParams): Promise<RunVAQuestionsResult> {
    try {
        const { semanticIdeas, authorialPersona, genre, passagesMatches, questionsMatches } = params;

        console.log("🚀 [VA Questions] Starting VA question generation workflow");

        // Step 1: Fetch reference passages and questions
        console.log("📄 [VA Questions] Step 1/10: Fetching reference content");
        const passages = await fetchPassagesData(
            passagesMatches.map((match) => match.passage_id)
        );
        const questions = await fetchQuestionsData(
            questionsMatches.map((match) => match.question_id),
            passagesMatches.map((match) => match.passage_id)
        );

        if (passages.length < 5) {
            console.error("❌ [VA Questions] Insufficient reference passages");
            throw new Error("Need at least 5 reference passages");
        }

        const passagesContent = passages.map(({ content }) => content);
        const formattedData = groupQuestionsWithPassages(passages, questions);

        // Step 2: Generate CAT-style passage
        console.log("✍️ [VA Questions] Step 2/10: Generating new CAT-style passage");
        const passageGenerated = await generatePassage({
            semanticIdeas,
            authorialPersona,
            referencePassages: passagesContent,
        });

        // Step 3: Finalize passage (evaluate + sharpen)
        console.log("🛠️ [VA Questions] Step 3/10: Finalizing passage (evaluate + sharpen)");
        const data = await finalizeCATPassage(passageGenerated);

        // Step 4: Generate VA questions
        console.log("❓ [VA Questions] Step 4/10: Generating VA questions");
        const vaQuestions = await generateVAQuestions({
            semanticIdeas,
            authorialPersona,
            referenceData: formattedData,
            passageText: data["passageData"].content,
        });

        if (vaQuestions.length === 0) {
            console.warn("⚠️ [VA Questions] No VA questions generated, continuing anyway");
        }

        // Step 5: Select correct answers for VA questions
        console.log("✅ [VA Questions] Step 5/10: Selecting correct answers for VA questions");
        const vaQuestionsWithAnswers = await selectVAAnswers({
            questions: vaQuestions,
        });

        // Step 6: Fetch reasoning graph nodes
        console.log("🧠 [VA Questions] Step 6/10: Fetching graph nodes");
        const nodes = await fetchNodes();

        // Step 7: Tag VA questions with nodes
        console.log("🏷️ [VA Questions] Step 7/10: Tagging VA questions with nodes");
        const vaQuestionTaggedWithNodes = await tagVAQuestionsWithNodes({
            questions: vaQuestionsWithAnswers,
            nodes: nodes,
        });

        // Step 8: Build reasoning graph context for VA questions
        console.log("🕸️ [VA Questions] Step 8/10: Building reasoning graph context");
        const reasoningGraphContextForVAQuestions = await getQuestionGraphContext(
            vaQuestionTaggedWithNodes,
            nodes
        );

        // Step 9: Generate rationales for VA questions
        console.log("🧾 [VA Questions] Step 9/10: Generating rationales for VA questions");
        const vaQuestionsWithRationales = await generateVARationalesWithEdges({
            questions: vaQuestionTaggedWithNodes,
            reasoningContexts: reasoningGraphContextForVAQuestions,
            referenceData: formattedData,
        });

        console.log(`✅ [VA Questions] Step 10/10: Completed VA question generation`);
        console.log(`   Generated ${vaQuestionsWithRationales.length} VA questions`);

        return {
            vaQuestions: vaQuestionsWithRationales,
        };

    } catch (error) {
        console.error("❌ [VA Questions] Error in runVAQuestions:", error);
        throw error;
    }
}

/**
 * Complete workflow: RC + VA questions with formatted output for DB
 */
export async function runCompleteDailyContent(params: {
    semanticIdeas: SemanticIdeas;
    authorialPersona: AuthorialPersona;
    genre: string;
    passagesMatches: Array<{ passage_id: string }>;
    questionsMatches: Array<{ question_id: string }>;
}) {
    try {
        console.log("🚀 [Complete Daily Content] Starting complete daily content generation");

        // Import RC question generation functions
        const { generateRCQuestions } = await import("../rcQuestionsHandling/generateRCQuestions");
        const { selectCorrectAnswers } = await import("../rcQuestionsHandling/selectCorrectAnswers");
        const { tagQuestionsWithNodes } = await import("../rcQuestionsHandling/tagQuestionsWithNodes");
        const { generateRationalesWithEdges } = await import("../rcQuestionsHandling/generateRationaleWithEdges");

        const { semanticIdeas, authorialPersona, genre, passagesMatches, questionsMatches } = params;

        // Step 1: Fetch reference passages and questions
        console.log("📄 [Complete] Step 1/15: Fetching reference content");
        const passages = await fetchPassagesData(
            passagesMatches.map((match) => match.passage_id)
        );
        const questions = await fetchQuestionsData(
            questionsMatches.map((match) => match.question_id),
            passagesMatches.map((match) => match.passage_id)
        );

        if (passages.length < 5) {
            console.error("❌ [Complete] Insufficient reference passages");
            throw new Error("Need at least 5 reference passages");
        }

        const passagesContent = passages.map(({ content }) => content);
        const formattedData = groupQuestionsWithPassages(passages, questions);

        // Step 2: Generate CAT-style passage
        console.log("✍️ [Complete] Step 2/15: Generating new CAT-style passage");
        const passageGenerated = await generatePassage({
            semanticIdeas,
            authorialPersona,
            referencePassages: passagesContent,
        });

        // Step 3: Finalize passage (evaluate + sharpen)
        console.log("🛠️ [Complete] Step 3/15: Finalizing passage (evaluate + sharpen)");
        const data = await finalizeCATPassage(passageGenerated);

        // Step 4: Generate RC questions
        console.log("❓ [Complete] Step 4/15: Generating RC questions from PYQ patterns");
        const rcQuestions = await generateRCQuestions({
            passageText: data["passageData"].content,
            referenceData: formattedData,
            questionCount: 4,
        });

        // Step 5: Select correct answers for RC questions
        console.log("✅ [Complete] Step 5/15: Selecting correct answers for RC questions");
        const rcQuestionsWithAnswers = await selectCorrectAnswers({
            passageText: data["passageData"].content,
            questions: rcQuestions,
        });

        // Step 6: Generate VA questions
        console.log("❓ [Complete] Step 6/15: Generating VA questions");
        const vaQuestions = await generateVAQuestions({
            semanticIdeas,
            authorialPersona,
            referenceData: formattedData,
            passageText: data["passageData"].content,
        });

        // Step 7: Select correct answers for VA questions
        console.log("✅ [Complete] Step 7/15: Selecting correct answers for VA questions");
        const vaQuestionsWithAnswers = await selectVAAnswers({
            questions: vaQuestions,
        });

        // Step 8: Fetch reasoning graph nodes
        console.log("🧠 [Complete] Step 8/15: Fetching graph nodes");
        const nodes = await fetchNodes();

        // Step 9: Tag RC questions with nodes
        console.log("🏷️ [Complete] Step 9/15: Tagging RC questions with nodes");
        const rcQuestionTaggedWithNodes = await tagQuestionsWithNodes({
            passageText: data["passageData"].content,
            questions: rcQuestionsWithAnswers,
            nodes: nodes,
        });

        // Step 10: Tag VA questions with nodes
        console.log("🏷️ [Complete] Step 10/15: Tagging VA questions with nodes");
        const vaQuestionTaggedWithNodes = await tagVAQuestionsWithNodes({
            questions: vaQuestionsWithAnswers,
            nodes: nodes,
        });

        // Step 11: Build reasoning graph context for RC questions
        console.log("🕸️ [Complete] Step 11/15: Building reasoning graph context for RC");
        const reasoningGraphContextForRCQuestions = await getQuestionGraphContext(
            rcQuestionTaggedWithNodes,
            nodes
        );

        // Step 12: Build reasoning graph context for VA questions
        console.log("🕸️ [Complete] Step 12/15: Building reasoning graph context for VA");
        const reasoningGraphContextForVAQuestions = await getQuestionGraphContext(
            vaQuestionTaggedWithNodes,
            nodes
        );

        // Step 13: Generate rationales for RC questions
        console.log("🧾 [Complete] Step 13/15: Generating rationales for RC questions");
        const rcQuestionsWithRationales = await generateRationalesWithEdges({
            passageText: data["passageData"].content,
            questions: rcQuestionTaggedWithNodes,
            reasoningContexts: reasoningGraphContextForRCQuestions,
            referenceData: formattedData,
        });

        // Step 14: Generate rationales for VA questions
        console.log("🧾 [Complete] Step 14/15: Generating rationales for VA questions");
        const vaQuestionsWithRationales = await generateVARationalesWithEdges({
            questions: vaQuestionTaggedWithNodes,
            reasoningContexts: reasoningGraphContextForVAQuestions,
            referenceData: formattedData,
        });

        // Step 15: Format output for DB
        console.log("📋 [Complete] Step 15/15: Formatting output for DB upload");
        const output = formatOutputForDB({
            passageData: data["passageData"],
            rcQuestions: rcQuestionsWithRationales,
            vaQuestions: vaQuestionsWithRationales,
        });

        // Validate output
        if (!validateOutputForDB(output)) {
            throw new Error("Output validation failed");
        }

        // Generate and print report
        const report = generateOutputReport(output);
        console.log(report);

        console.log("✅ [Complete] Daily content generation completed successfully");

        return output;

    } catch (error) {
        console.error("❌ [Complete] Error in runCompleteDailyContent:", error);
        throw error;
    }
}
