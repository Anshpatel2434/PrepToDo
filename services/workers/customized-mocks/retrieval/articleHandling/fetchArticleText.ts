import OpenAI from "openai";
import { openai } from "../../../../config/openai";

const client = openai;

/**
 * Fetches article text using various strategies.
 * Tries multiple methods to extract article content.
 */
export async function fetchArticleText(url: string): Promise<string> {
    console.log(`⏳ [Article Text] Fetching content from: ${url.substring(0, 50)}...`);

    // Method 1: Try to fetch with browser-less extraction
    try {
        // Note: For production, you'd use a service like jina.ai, r.jina.ai/http, or a proper scraper
        // This is a placeholder that needs proper implementation based on your infrastructure

        const response = await fetch(`https://r.jina.ai/${url}`);
        if (response.ok) {
            const text = await response.text();
            const wordCount = text.split(/\s+/).length;
            console.log(`✅ [Article Text] Fetched ${wordCount} words`);
            return text;
        }
    } catch (error) {
        console.warn(`⚠️ [Article Text] Primary fetch failed:`, error);
    }

    // Method 2: Fallback - throw error for manual intervention
    throw new Error(`Failed to fetch article text from ${url}. Please implement proper scraping.`);
}
