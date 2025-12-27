import { generateEmbedding } from "./retrieval/generateEmbedding";
import { searchTheoryEmbeddings } from "./retrieval/searchTheoryEmbeddings";
import { fetchTheoryChunk } from "./retrieval/fetchTheoryChunk";
import { expandConceptGraph } from "./graph/expandConceptGraph";
import { buildTeachingContext } from "./assembly/buildTeachingContext";
import { narrateConcept } from "./synthesis/narrateConcept";

export async function runConceptTeaching(conceptQuery: string) {
	console.log("🚀 [START] Concept Teaching:", conceptQuery);

	const embedding = await generateEmbedding(conceptQuery);

	const matches = await searchTheoryEmbeddings(embedding, 5);
	console.log("THESE WERE THE TOP 5 MATCHES AND THEIR IDS : ");
	console.log(matches);
	const primaryMatch = matches[0];

	console.log(
		"🎯 [Selection] Using theory_id:",
		primaryMatch.theory_id,
		"score:",
		primaryMatch.score
	);

	const theoryChunk = await fetchTheoryChunk(primaryMatch.theory_id);

	const graphRelations = await expandConceptGraph(theoryChunk.id);

	const teachingContext = buildTeachingContext(theoryChunk, graphRelations);

	const explanation = await narrateConcept(teachingContext);

	console.log("🏁 [END] Concept Teaching complete");

	return explanation;
}
