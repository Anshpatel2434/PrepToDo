// fetchArticleText.ts
import { JSDOM } from "jsdom";

/**
 * Fetches and extracts readable text from an article URL.
 * The returned text MUST NOT be stored.
 */
export async function fetchArticleText(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: {
            // Pretend to be a normal browser to avoid bot blocks
            "User-Agent":
                "Mozilla/5.0 (compatible; PrepToDoBot/1.0; +https://preptodo.in)",
            Accept: "text/html",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch article: ${response.status}`);
    }

    const html = await response.text();

    /**
     * Parse DOM
     */
    const dom = new JSDOM(html);
    const document = dom.window.document;

    /**
     * Remove noisy elements
     */
    const REMOVE_TAGS = [
        "script",
        "style",
        "nav",
        "footer",
        "header",
        "aside",
        "noscript",
        "form",
    ];

    REMOVE_TAGS.forEach((tag) => {
        document.querySelectorAll(tag).forEach((el) => el.remove());
    });

    /**
     * Prefer <article> tag if available
     */
    const articleNode =
        document.querySelector("article") ||
        document.querySelector("main") ||
        document.body;

    if (!articleNode) {
        throw new Error("Unable to locate article content");
    }

    /**
     * Extract text
     */
    let text = articleNode.textContent || "";

    // Normalize whitespace
    text = text
        .replace(/\s+/g, " ")
        .replace(/\n+/g, "\n")
        .trim();

    /**
     * Safety guard: too short = junk
     */
    if (text.length < 700) {
        throw new Error("Extracted article text too short to be useful");
    }

    return text;
}
