// VARC Analytics - Scoring & Math Functions

// Constants
export const CALIBRATION_THRESHOLD = 20; // Number of attempts before switching to trend-based scoring
export const EMA_ALPHA = 0.2; // Learning rate for established users
export const TREND_DELTA_THRESHOLD = 3;

/**
 * Confidence Score Calculation
 * Returns a value between 0 and 1, representing statistical significance of the sample size.
 * Uses a tanh curve for smooth saturation.
 */
export function calculateConfidence(attempts: number): number {
    // 10 attempts = ~0.76 confidence
    // 20 attempts = ~0.96 confidence
    return Math.tanh(attempts / 10);
}

/**
 * Calculates the new proficiency score using a Hybrid Bayesian-EMA approach.
 * 
 * Logic:
 * 1. Calibration Phase (Attempts < Threshold):
 *    Uses raw accuracy for exact transparency.
 *    Formula: (Correct / Total) * 100
 *    This ensures that 4/4 is 100% and 0/1 is 0%.
 * 
 * 2. Growth Phase (Attempts >= Threshold):
 *    Uses Exponential Moving Average (EMA) to track skill evolution over time.
 *    Formula: Old * (1 - α) + NewSessions * α
 *    This ensures that recent improvements (or slumps) update the score, rather than being drowned out by valid history.
 */
export function calculateNewProficiency(
    oldProficiency: number,
    sessionScore: number,
    totalAttempts: number,
    totalCorrect: number
): number {
    let newScore: number;

    if (totalAttempts <= CALIBRATION_THRESHOLD) {
        // [Hybrid Phase 1] Direct Accuracy (Raw History)
        // Calculating total accuracy based on exact history
        // No Bayesian priors or smoothing to ensure user sees raw performance.
        newScore = (totalCorrect / totalAttempts) * 100;
    } else {
        // [Hybrid Phase 2] Adaptive EMA (Trend Tracking)
        // Adjust Alpha based on confidence? For now standard EMA is robust for tracking.
        // We could use a slightly higher Alpha if we detect a "breakthrough", but standard EMA is safe.
        newScore = oldProficiency * (1 - EMA_ALPHA) + sessionScore * EMA_ALPHA;
    }

    // Clamp to [0, 100] and round
    return Math.max(0, Math.min(100, Math.round(newScore)));
}

/**
 * Trend determination based on delta threshold
 * Returns 'improving', 'declining', or 'stagnant'
 */
export function calculateTrend(
    oldProficiency: number,
    newProficiency: number
): 'improving' | 'declining' | 'stagnant' {
    const delta = newProficiency - oldProficiency;

    if (delta > TREND_DELTA_THRESHOLD) return 'improving';
    if (delta < -TREND_DELTA_THRESHOLD) return 'declining';
    return 'stagnant';
}
