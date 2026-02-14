// =============================================================================
// Shared Utility — Correct Answer Normalization
// =============================================================================
// The `correct_answer` column in the DB is a `text` column that may contain:
//   1. A plain string like "B"
//   2. A JSON string like '{"answer":"B"}'
//   3. An already-parsed object like { answer: "B" }
//
// This utility normalizes all formats to a consistent { answer: "..." } object.

/**
 * Normalize `correct_answer` from any DB/API format into { answer: string }.
 * Handles plain strings, JSON strings, and already-parsed objects.
 */
export function parseCorrectAnswer(raw: unknown): { answer: string } {
    if (raw === null || raw === undefined) {
        return { answer: "" };
    }

    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed.startsWith('{')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (typeof parsed === 'object' && parsed !== null && 'answer' in parsed) {
                    return { answer: String(parsed.answer ?? "") };
                }
                return { answer: trimmed };
            } catch {
                return { answer: trimmed };
            }
        }
        return { answer: trimmed };
    }

    if (typeof raw === 'object' && raw !== null && 'answer' in raw) {
        return { answer: String((raw as { answer?: unknown }).answer ?? "") };
    }

    return { answer: String(raw) };
}

/**
 * Extract just the plain answer string from any correct_answer format.
 * Convenience wrapper around parseCorrectAnswer.
 */
export function extractCorrectAnswerString(raw: unknown): string {
    return parseCorrectAnswer(raw).answer;
}
