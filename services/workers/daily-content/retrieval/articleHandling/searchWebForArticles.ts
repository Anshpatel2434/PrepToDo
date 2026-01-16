import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod"
import { getExistingArticleUrls } from "./fetchExistingArticleUrls";
import { z } from "zod";


const client = new OpenAI();

// schemas/article.schema.ts

export const ArticleWebSchema = z.object({
    title: z.string().min(5),
    url: z.string().describe("The full canonical URL of the article"),
    source_name: z.string(),
    author: z.string().nullable(),
    published_at: z.string().nullable(), // ISO date string if available
    genre: z.string(),
    topic_tags: z.array(z.string()).max(8),
    is_safe_source: z.boolean(),
});

export type ArticleOutput = z.infer<typeof ArticleWebSchema>;


const MODEL = "gpt-4o-mini-search-preview";

/**
 * Normalize URL to catch duplicates with different formats
 * - Remove trailing slashes
 * - Remove query parameters
 * - Remove fragments
 * - Convert to lowercase
 * - Remove www prefix
 */
function normalizeUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        let normalized = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;

        // Remove trailing slash
        normalized = normalized.replace(/\/$/, '');

        // Remove www prefix
        normalized = normalized.replace(/^(https?:\/\/)www\./, '$1');

        return normalized.toLowerCase();
    } catch {
        // If URL parsing fails, just normalize the string
        return url.toLowerCase().replace(/\/$/, '').replace(/^(https?:\/\/)www\./, '$1');
    }
}

/**
 * Check if a URL is similar to any in the exclusion list
 */
function isUrlExcluded(url: string, excludedUrls: string[]): boolean {
    const normalizedUrl = normalizeUrl(url);
    const normalizedExcluded = excludedUrls.map(u => normalizeUrl(u));

    return normalizedExcluded.includes(normalizedUrl);
}

/**
 * Generate diverse search strategies based on attempt number
 * This helps get different results across retries
 */
function getSearchStrategy(attemptNumber: number, genre: string): {
    timeframe: string;
    focusArea: string;
    sourcePreference: string;
} {
    const strategies = [
        {
            timeframe: "published in the last 2 years",
            focusArea: "in-depth analysis and research-based insights",
            sourcePreference: "academic or long-form journalism sources"
        },
        {
            timeframe: "published in the last 5 years",
            focusArea: "thought-provoking essays and critical analysis",
            sourcePreference: "literary magazines or intellectual publications"
        },
        {
            timeframe: "published in the last 3 years",
            focusArea: "interdisciplinary perspectives and novel insights",
            sourcePreference: "science and technology publications"
        },
        {
            timeframe: "published in the last year",
            focusArea: "comprehensive explorations of complex topics",
            sourcePreference: "cultural and philosophical magazines"
        },
        {
            timeframe: "published in the last 4 years",
            focusArea: "evidence-based arguments and scholarly discourse",
            sourcePreference: "policy and economics publications"
        },
        {
            timeframe: "from any recent period",
            focusArea: "nuanced perspectives on contemporary issues",
            sourcePreference: "diverse intellectual sources"
        },
        {
            timeframe: "published in the last 18 months",
            focusArea: "deep dives into specialized subjects",
            sourcePreference: "specialized magazines and journals"
        },
        {
            timeframe: "published in the last 6 months",
            focusArea: "fresh analytical perspectives",
            sourcePreference: "emerging voices in quality publications"
        },
        {
            timeframe: "published in the last 3 years",
            focusArea: "historical context and timeless insights",
            sourcePreference: "established intellectual publications"
        },
        {
            timeframe: "from recent archives",
            focusArea: "underexplored topics with analytical depth",
            sourcePreference: "niche but reputable sources"
        }
    ];

    // Cycle through strategies based on attempt number
    return strategies[(attemptNumber - 1) % strategies.length];
}

export async function searchWebForArticle(
    genre: string,
    exclude: string[],
    attemptNumber: number = 1
): Promise<ArticleOutput> {
    // STEP 1: Fetch existing URLs from database (with genre prioritization)
    const existingUrls = await getExistingArticleUrls(500, genre);

    // Combine database URLs with runtime exclusions
    const allExcludedUrls = [...existingUrls, ...exclude];

    // Get diverse search strategy based on attempt
    const strategy = getSearchStrategy(attemptNumber, genre);

    const prompt = `
Search for ONE high-quality analytical article suitable for CAT Reading Comprehension practice.

SEARCH STRATEGY FOR THIS ATTEMPT:
- Timeframe: ${strategy.timeframe}
- Focus: ${strategy.focusArea}
- Source preference: ${strategy.sourcePreference}

STRICT SOURCE ALLOWLIST (you MUST choose from these):
- aeon.co
- psyche.co
- smithsonianmag.com
- technologyreview.com
- theatlantic.com
- nautil.us
- economist.com
- project-syndicate.org
- theconversation.com
- harvardmagazine.com
- scientificamerican.com
- lrb.co.uk
- nybooks.com

CRITICAL EXCLUSION RULE:
You have ${allExcludedUrls.length} URLs to AVOID. You MUST find a COMPLETELY DIFFERENT article.
Do NOT return any article whose URL matches, resembles, or is a variant of these excluded URLs.

${allExcludedUrls.length > 0 ? `
EXCLUDED URLs (${allExcludedUrls.length} total):
${allExcludedUrls.slice(0, 100).map((url) => `- ${url}`).join("\n")}
${allExcludedUrls.length > 100 ? `... and ${allExcludedUrls.length - 100} more URLs` : ''}
` : 'No URLs excluded yet.'}

STRICT CONTENT RULES:
- Idea-driven, analytical writing only
- No news reporting or breaking news
- No opinion columns or editorials
- No blogs or personal essays
- No political propaganda
- Prefer timeless topics over current events
- Must be substantive (1500+ words ideal)

TARGET GENRE: ${genre}

DIVERSITY REQUIREMENT:
This is attempt #${attemptNumber}. If previous attempts failed, you MUST search for:
- Different subtopics within the genre
- Different authors
- Different publication sources
- Different time periods
- Different angles or perspectives

Return ONLY structured metadata.
Do NOT summarize the article.
Do NOT include article content.
Do NOT explain your choice.
`;

    console.log(`⏳ [Article Search] Waiting for LLM response (attempt ${attemptNumber})`);

    const completion = await client.chat.completions.parse({
        model: MODEL,
        messages: [
            {
                role: "system",
                content:
                    "You are a strict web research engine specialized in finding unique, high-quality analytical articles. You MUST obey exclusion rules exactly and find completely different articles on each attempt. Prioritize diversity and uniqueness.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(ArticleWebSchema, "article_schema"),
    });

    const parsed = completion.choices[0].message;

    if (!parsed || !parsed.parsed) {
        throw new Error("Failed to parse article metadata");
    }

    const article = parsed.parsed;

    // STEP 2: Verify the returned URL is not in our exclusion list
    if (isUrlExcluded(article.url, allExcludedUrls)) {
        console.warn(`⚠️ [Article Search] AI returned an excluded URL: ${article.url}`);
        throw new Error(`AI returned a duplicate URL despite exclusion list`);
    }

    console.log(`✅ [Article Search] Found unique article: ${article.title}`);
    console.log(`   Source: ${article.source_name}`);
    console.log(`   URL: ${article.url}`);

    return article;
}
