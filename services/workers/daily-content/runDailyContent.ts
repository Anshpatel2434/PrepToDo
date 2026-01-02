import { extractSemanticIdeasAndPersona } from "./retrieval/passageHandling/extractSemanticIdeas";
import { fetchGenreForToday } from "./retrieval/fetchGenre";
import { fetchPassagesData } from "./retrieval/passageHandling/fetchPassagesData";
import { fetchQuestionsData } from "./retrieval/fetchQuestionsData";
import { generateEmbedding } from "./retrieval/generateEmbedding";
import { generatePassage } from "./retrieval/passageHandling/generatePassage";
import { saveArticleToDB } from "./retrieval/articleHandling/saveArticle";
import { searchPassageAndQuestionEmbeddings } from "./retrieval/searchPassageAndQuestionEmbeddings";
import { getValidArticleWithText } from "./retrieval/articleHandling/getValidArticleWithText";
import { authorial_persona, genreName, semantic_ideas } from "./retrieval/articleTestForTesting";
import { finalizeCATPassage } from "./retrieval/passageHandling/finalizeCATPassage";
import { generateRCQuestions } from "./retrieval/rcQuestionsHandling/generateRCQuestions";
import { selectCorrectAnswers } from "./retrieval/rcQuestionsHandling/selectCorrectAnswers";
import { fetchNodes } from "./graph/fetchNodes";
import { tagQuestionsWithNodes } from "./retrieval/rcQuestionsHandling/tagQuestionsWithNodes";
import { getQuestionGraphContext } from "./graph/createReasoningGraphContext";
import { generateRationalesWithEdges } from "./retrieval/rcQuestionsHandling/generateRationaleWithEdges";

/**
 * Main workflow for generating daily CAT practice content.
 *
 * Workflow Steps:
 * 1. Generate embedding for genre/topic
 * 2. Retrieve similar passages and questions via vector search
 * 3. Generate CAT-style passage using semantic ideas and PYQ references
 * 4. Evaluate and sharpen passage to CAT standards
 * 5. Generate RC questions using PYQ patterns for guidance
 * 6. Select correct answers for each question
 * 7. Tag each question with primary reasoning node from graph
 * 8. Build reasoning graph context (nodes + edges) for each question
 * 9. Generate elimination-driven rationales using graph structure
 */

function groupQuestionsWithPassages(passages, questions) {
    return passages.slice(0, 3).map(passage => {
        return {
            passage: passage,
            questions: questions.filter(q => q.passage_id === passage.id)
        };
    });
}


export async function runDailyContent() {

    console.log("🚀 [START] Daily Content Generation start ");	
 	
    // // 1. Select genre	
    // const genre = await fetchGenreForToday();	
 	
    // let { articleMeta, articleText } =	
    //     await getValidArticleWithText(genre.name);	
 	
    // // 4. Save artile to database	
    // await saveArticleToDB(articleMeta)	
 	
    // console.log('This is the article text and its length is : ', (articleText: string) => {	
    //     // Trim leading/trailing spaces and split by one or more whitespace characters	
    //     const words = articleText.trim().split(/\s+/);	
 	
    //     // Filter out any empty strings that might result from extra spaces	
    //     const filteredWords = words.filter(word => word.length > 0);	
 	
    //     return filteredWords.length;	
    // })	
    // console.log(articleText.slice(0, 500))	
 	
    // // 4. Extract semantic ideas	
    // const {	
    //     semantic_ideas,	
    //     authorial_persona,	
    // } = await extractSemanticIdeasAndPersona(articleText, genre.name);	
 	
    // console.log("semantic ideas ")	
    // console.log(semantic_ideas)	
 	
    // console.log("authorial_persona")	
    // console.log(authorial_persona)	
 	
    // articleText = null

    const embedding = await generateEmbedding(genreName);

    const matches = await searchPassageAndQuestionEmbeddings(embedding, 5);
    const passagesMatches = matches.passages;
    const questionsMatches = matches.questions;

    const passages = await fetchPassagesData(passagesMatches.map(match => match.passage_id));
    const questions = await fetchQuestionsData(questionsMatches.map(match => match.question_id), passagesMatches.map(match => match.passage_id));

    const passagesContent = passages.map(({ content }) => content);

    const passageGenerated = await generatePassage({ semanticIdeas: semantic_ideas, authorialPersona: authorial_persona, referencePassages: passagesContent });

    const data = await finalizeCATPassage(passageGenerated);

    const formattedData = groupQuestionsWithPassages(passages, questions);

    let generatedQuestions = await generateRCQuestions({passageText : data["passageData"].content, referenceData: formattedData, questionCount: 4});

    let generatedQuestionsWithAnswers = await selectCorrectAnswers({passageText: data["passageData"].content, questions: generatedQuestions});

    const nodes = await fetchNodes();

    const questionTaggedWithNodes = await tagQuestionsWithNodes({passageText: data["passageData"].content, questions: generatedQuestionsWithAnswers, nodes: nodes});

    const reasoningGraphContextForQuestions = await getQuestionGraphContext(questionTaggedWithNodes, nodes);

    const finalQuestionsFormed = await generateRationalesWithEdges({passageText: data["passageData"].content, questions: generatedQuestionsWithAnswers, reasoningContexts: reasoningGraphContextForQuestions, referenceData: formattedData});

    console.log("✅ [COMPLETE] Daily Content Generation finished");

    console.log(finalQuestionsFormed);
}
