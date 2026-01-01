import { fetchPassagesData } from "./retrieval/fetchPassagesData";
import { fetchQuestionsData } from "./retrieval/fetchQuestionsData";
import { generateEmbedding } from "./retrieval/generateEmbedding";
import { searchPassageAndQuestionEmbeddings } from "./retrieval/searchPassageAndQuestionEmbeddings";


export async function runDailyContent(genre: string) {
    console.log("🚀 [START] Daily Content Generation:", genre);

    const embedding = await generateEmbedding(genre);

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

    console.log("These are the passages : ")
    console.log(passages)
    console.log("These are the questions : ")
    console.log(questions)

    // const graphRelations = await expandConceptGraph(theoryChunk.id);

    // const teachingContext = buildTeachingContext(theoryChunk, graphRelations);

    // const explanation = await narrateConcept(teachingContext);

    // console.log("🏁 [END] Concept Teaching complete");

    // return explanation;
}
