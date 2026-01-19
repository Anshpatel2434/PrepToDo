// fetchArticleText.ts

/**
 * Fetches and extracts readable text from an article URL.
 * The returned text MUST NOT be stored.
 * Uses regex-based parsing for Deno edge runtime compatibility.
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
     * Remove noisy elements using regex
     * This is Deno-compatible and avoids Node.js DOM libraries
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
        "iframe",
        "svg",
    ];

    let cleanedHtml = html;

    // Remove script/style tags with their content
    for (const tag of REMOVE_TAGS) {
        // Remove both self-closing and paired tags with content
        cleanedHtml = cleanedHtml.replace(
            new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, "gi"),
            ""
        );
        cleanedHtml = cleanedHtml.replace(
            new RegExp(`<${tag}[^>]*\\/?>`, "gi"),
            ""
        );
    }

    // Remove all HTML comments
    cleanedHtml = cleanedHtml.replace(/<!--[\s\S]*?-->/g, "");

    // Try to extract content from specific containers in order of preference
    const contentPatterns = [
        /<article[^>]*>([\s\S]*?)<\/article>/i,
        /<main[^>]*>([\s\S]*?)<\/main>/i,
        /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*id="content"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<body[^>]*>([\s\S]*?)<\/body>/i,
    ];

    let extractedContent = "";

    for (const pattern of contentPatterns) {
        const match = cleanedHtml.match(pattern);
        if (match && match[1]) {
            extractedContent = match[1];
            break;
        }
    }

    if (!extractedContent) {
        throw new Error("Unable to locate article content");
    }

    // Remove all remaining HTML tags
    let text = extractedContent.replace(/<[^>]+>/g, " ");

    // Decode HTML entities
    const htmlEntities: Record<string, string> = {
        "&nbsp;": " ",
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&apos;": "'",
        "&mdash;": "—",
        "&ndash;": "–",
        "&rsquo;": "'",
        "&lsquo;": "'",
        "&rdquo;": '"',
        "&ldquo;": '"',
    };

    for (const [entity, replacement] of Object.entries(htmlEntities)) {
        text = text.replace(new RegExp(entity, "g"), replacement);
    }

    // Decode numeric entities
    text = text.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
    text = text.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    // Normalize whitespace
    text = text
        .replace(/\s+/g, " ")
        .replace(/\n+/g, "\n")
        .trim();

    // Remove consecutive punctuation cleanup
    text = text.replace(/\s+([.,!?;:])/g, "$1");

    /**
     * Safety guard: too short = junk
     */
    if (text.length < 700) {
        throw new Error("Extracted article text too short to be useful");
    }

    return text;
}
