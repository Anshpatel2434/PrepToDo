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

function groupQuestionsWithPassages(passages, questions) {
    // 1. Take only the first 3 passages
    return passages.slice(0, 3).map(passage => {
        return {
            passage: passage,
            // 2. Filter questions where the passage_id matches the current passage's id
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
    // const embedding = await generateEmbedding("Neuroscience");

    const matches = await searchPassageAndQuestionEmbeddings(embedding, 5);
    const passagesMatches = matches.passages;
    const questionsMatches = matches.questions;

    // console.log(
    //     "🎯 [Selection] Using theory_id:",
    //     primaryMatch.theory_id,
    //     "score:",
    //     primaryMatch.score
    // );

    const passages = await fetchPassagesData(passagesMatches.map(match => match.passage_id));
    const questions = await fetchQuestionsData(questionsMatches.map(match => match.question_id), passagesMatches.map(match => match.passage_id));

    const passagesContent = passages.map(({ content }) => content)

    // console.log("stringyfy of the semantics : ")
    // console.log(semantic_ideas)

    // console.log("stringyfy of the authorial persona : ")
    // console.log(authorial_persona)

    const passageGenerated = await generatePassage({ semanticIdeas: semantic_ideas, authorialPersona: authorial_persona, referencePassages: passagesContent })

    // const passageGenerated = await generatePassage({
    //     semanticIdeas: text, referencePassages: passagesContent
    // })

    const data = await finalizeCATPassage(passageGenerated);

    console.log("Improved final passage : ")
    console.log(data)

    const formattedData = groupQuestionsWithPassages(passages, questions);

    let generatedQuestions = await generateRCQuestions({passageText : data["passageData"].content,referenceData:  formattedData, questionCount: 4})
    console.log("hell these are the generated questions : ")
    console.log(generatedQuestions)

    let generatedQuestionsWithAnswers = await selectCorrectAnswers({passageText: data["passageData"].content, questions: generatedQuestions})
    console.log("Hell these are the generated questions with the answers : ")
    console.log(generatedQuestionsWithAnswers)

    //fetch nodes 
    const nodes = await fetchNodes()

    //tagging question with nodes 
    const questionTaggedWithNodes = await tagQuestionsWithNodes({passageText: data["passageData"].content, questions: generatedQuestionsWithAnswers, nodes: nodes})
    console.log("hell these are the questionTaggedWithNodes for questions ")
    console.log(questionTaggedWithNodes)

    //getting edges info
    const reasoningGraphContextForQuestions = await getQuestionGraphContext(questionTaggedWithNodes, nodes)
    console.log("hell these are the reasoning graph context for questions ")
    console.log(reasoningGraphContextForQuestions)

    const finalQuestionsFormed = await generateRationalesWithEdges({passageText: data["passageData"].content, questions: generatedQuestionsWithAnswers, reasoningContexts: reasoningGraphContextForQuestions, referenceData: formattedData})

    console.log("--------------------------------- AND THESE IS THE FINAL RESULT--------------------------------")
    console.log(finalQuestionsFormed)

    // const graphRelations = await expandConceptGraph(theoryChunk.id);

    // const teachingContext = buildTeachingContext(theoryChunk, graphRelations);

    // const explanation = await narrateConcept(teachingContext);

    // console.log("🏁 [END] Concept Teaching complete");

    // return explanation;
}
