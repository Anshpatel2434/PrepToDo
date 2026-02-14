// =============================================================================
// Shared Frontend Utility — Answer Extraction
// =============================================================================
// Normalizes the various formats of correct_answer and user_answer
// received from the backend into clean string values.

/**
 * Extract the plain answer string from any correct_answer format.
 * Handles: { answer: "B" }, "B", '{"answer":"B"}', null/undefined
 */
export function extractCorrectAnswer(correctAnswer: unknown): string {
    if (correctAnswer === null || correctAnswer === undefined) {
        return "";
    }

    // Already an object with .answer property
    if (typeof correctAnswer === 'object' && correctAnswer !== null && 'answer' in correctAnswer) {
        return String((correctAnswer as { answer?: unknown }).answer ?? "");
    }

    // String — might be JSON or plain
    if (typeof correctAnswer === 'string') {
        const trimmed = correctAnswer.trim();
        if (trimmed.startsWith('{')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (typeof parsed === 'object' && parsed !== null && 'answer' in parsed) {
                    return String(parsed.answer ?? "");
                }
            } catch {
                // Not valid JSON, fall through
            }
        }
        return trimmed;
    }

    return String(correctAnswer);
}

/**
 * Extract the user's answer string from any user_answer format.
 * Handles: { user_answer: "B" }, "B", '{"user_answer":"B"}', null/undefined
 */
export function extractUserAnswer(userAnswer: unknown): string | undefined {
    if (userAnswer === null || userAnswer === undefined) {
        return undefined;
    }

    // Object with .user_answer property (primary format from Redux slices)
    if (typeof userAnswer === 'object' && userAnswer !== null) {
        if ('user_answer' in userAnswer) {
            const val = (userAnswer as { user_answer?: unknown }).user_answer;
            return val !== null && val !== undefined ? String(val) : undefined;
        }
        if ('answer' in userAnswer) {
            const val = (userAnswer as { answer?: unknown }).answer;
            return val !== null && val !== undefined ? String(val) : undefined;
        }
    }

    // String — might be JSON or plain
    if (typeof userAnswer === 'string') {
        const trimmed = userAnswer.trim();
        if (trimmed.startsWith('{')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (typeof parsed === 'object' && parsed !== null) {
                    if ('user_answer' in parsed) return String(parsed.user_answer ?? "");
                    if ('answer' in parsed) return String(parsed.answer ?? "");
                }
            } catch {
                // Not valid JSON
            }
        }
        return trimmed || undefined;
    }

    return String(userAnswer);
}
