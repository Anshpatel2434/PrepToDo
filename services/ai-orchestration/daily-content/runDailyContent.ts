import { generateEmbedding } from "./retrieval/generateEmbedding";
import { searchTheoryEmbeddings } from "./retrieval/searchTheoryEmbeddings";


export async function runDailyContent(genre: string) {
    console.log("🚀 [START] Daily Content Generation:", genre);

    const embedding = await generateEmbedding(genre);

    const matches = await searchTheoryEmbeddings(embedding, 5);
    console.log("THESE WERE THE TOP 5 MATCHES AND THEIR IDS : ");
    console.log(matches);
    const passagesMatches = matches.passages;
    const questionsMatches = matches.questions;

    // console.log(
    //     "🎯 [Selection] Using theory_id:",
    //     primaryMatch.theory_id,
    //     "score:",
    //     primaryMatch.score
    // );

    // const theoryChunk = await fetchTheoryChunk(primaryMatch.theory_id);

    // const graphRelations = await expandConceptGraph(theoryChunk.id);

    // const teachingContext = buildTeachingContext(theoryChunk, graphRelations);

    // const explanation = await narrateConcept(teachingContext);

    // console.log("🏁 [END] Concept Teaching complete");

    // return explanation;
}
