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
    console.log("only passages content")
    console.log(passagesContent)

    console.log("stringyfy of the semantics : ")
    console.log(semantic_ideas)

    console.log("stringyfy of the authorial persona : ")
    console.log(authorial_persona)

    const passageGenerated = await generatePassage({ semanticIdeas: semantic_ideas, authorialPersona: authorial_persona, referencePassages: passagesContent })

    // const passageGenerated = await generatePassage({
    //     semanticIdeas: text, referencePassages: passagesContent
    // })

    console.log("this is the passage generated")
    console.log(passageGenerated)

    const data = await finalizeCATPassage(passageGenerated);

    console.log("Improved final passage : ")
    console.log(data)
    console.log(data["passage"])

    // const graphRelations = await expandConceptGraph(theoryChunk.id);

    // const teachingContext = buildTeachingContext(theoryChunk, graphRelations);

    // const explanation = await narrateConcept(teachingContext);

    // console.log("🏁 [END] Concept Teaching complete");

    // return explanation;
}
