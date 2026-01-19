import { v4 as uuidv4 } from 'uuid';

/**
 * Finalizes the CAT passage with metadata.
 * Calculates word count and assigns difficulty.
 */
export async function finalizeCATPassage(passageText: string, genre:string): Promise<{
    passageData: {
        id: string;
        title: string;
        content: string;
        word_count: number;
        difficulty: "easy" | "medium" | "hard";
        genre:string;
    };
}> {
    console.log("📝 [Passage Finalize] Finalizing passage metadata");

    const wordCount = passageText.split(/\s+/).length;

    // Simple heuristic for difficulty
    let difficulty: "easy" | "medium" | "hard";
    if (wordCount < 400) {
        difficulty = "easy";
    } else if (wordCount < 600) {
        difficulty = "medium";
    } else {
        difficulty = "hard";
    }

    const passageData = {
        id: uuidv4(),
        title: "Custom Mock Passage",
        content: passageText,
        word_count: wordCount,
        difficulty: difficulty,
        genre: genre,
    };

    console.log(`✅ [Passage Finalize] Finalized: ${wordCount} words, ${difficulty} difficulty`);

    return { passageData };
}
