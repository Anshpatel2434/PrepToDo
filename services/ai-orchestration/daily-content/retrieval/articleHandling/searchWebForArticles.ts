import OpenAI from "openai";
import {zodResponseFormat} from "openai/helpers/zod"
import { getExistingArticleUrls } from "./fetchExistingArticleUrls";
import { z } from "zod";


const client = new OpenAI();

// schemas/article.schema.ts

export const ArticleSchema = z.object({
    title: z.string().min(5),
    url: z.string().describe("The full canonical URL of the article"),
    source_name: z.string(),
    author: z.string().nullable(),
    published_at: z.string().nullable(), // ISO date string if available
    genre: z.string(),
    topic_tags: z.array(z.string()).max(8),
    is_safe_source: z.boolean(),
});

export type ArticleOutput = z.infer<typeof ArticleSchema>;


const MODEL = "gpt-4o-mini-search-preview";

export async function searchWebForArticle(
    genre: string
): Promise<ArticleOutput> {
    // STEP 1: Fetch existing URLs
    const existingUrls = await getExistingArticleUrls();

    const prompt = `
Search for ONE high-quality analytical article suitable
for CAT Reading Comprehension practice.

STRICT SOURCE ALLOWLIST:
- aeon.co
- psyche.co
- jstor.org
- smithsonianmag.com
- technologyreview.com

STRICT EXCLUSION RULE (CRITICAL):
You MUST NOT return any article whose URL matches or closely resembles
ANY of the URLs listed below.

EXCLUDED URLs:
${existingUrls.map((url) => `- ${url}`).join("\n")}

STRICT CONTENT RULES:
- Idea-driven, analytical writing only
- No news reporting
- No opinion columns
- No blogs or personal essays
- No political propaganda
- Prefer timeless topics over current events

TARGET GENRE: ${genre}

Return ONLY structured metadata.
Do NOT summarize.
Do NOT include article content.
Do NOT explain your choice.
`;

    const completion = await client.chat.completions.parse({
        model: MODEL,
        messages: [
            {
                role: "system",
                content:
                    "You are a strict web research engine. You must obey exclusion rules exactly.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        response_format: zodResponseFormat(ArticleSchema, "article_schema"),
    });

    const parsed = completion.choices[0].message;
    
    if (!parsed) {
        throw new Error("Failed to parse article metadata");
    }

    return parsed.parsed;
}
