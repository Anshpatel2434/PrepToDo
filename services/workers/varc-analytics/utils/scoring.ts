// VARC Analytics - Scoring & Math Functions

// Constants (DO NOT CHANGE without understanding impact)
export const ALPHA = 0.2;
export const CONFIDENCE_THRESHOLD = 9;
export const TREND_DELTA_THRESHOLD = 3;

/**
 * Confidence calculation using sqrt curve
 * Returns value between 0 and 1
 */
export function calculateConfidence(attempts: number): number {
  return Math.min(1.0, Math.sqrt(attempts / CONFIDENCE_THRESHOLD));
}

/**
 * Proficiency smoothing using exponential weighted average
 * Formula: newPS = oldPS * (1 - α*confidence) + surfaceScore * (α*confidence)
 */
export function calculateNewProficiency(
  oldProficiency: number,
  surfaceScore: number,
  confidence: number
): number {
  const learningWeight = ALPHA * confidence;
  const newProficiency =
    oldProficiency * (1 - learningWeight) +
    surfaceScore * learningWeight;

  // Clamp to [0, 100] and round
  return Math.max(0, Math.min(100, Math.round(newProficiency)));
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
