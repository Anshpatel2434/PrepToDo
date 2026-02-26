// =============================================================================
// Persona Forum — Mood Engine
// =============================================================================
//
// Generates combinatorial mood profiles for the AI tutor persona.
// Mood dimensions define HOW the tutor feels. Behavior CATEGORIES (not
// specific templates) tell the LLM what KIND of embodied behavior to include.
// SOUL.md provides the creative freedom — this engine just steers direction.
//
// 8 × 8 × 7 × 8 × 6 = 21,504 unique mood combos before topic variation.
// =============================================================================

import { createChildLogger } from '../../../common/utils/logger.js';

const logger = createChildLogger('mood-engine');

// ---------------------------------------------------------------------------
// Mood Dimensions — independently selected for combinatorial variety
// ---------------------------------------------------------------------------

export const ENERGY = [
    'buzzing', 'calm', 'reflective', 'explosive', 'meditative',
    'caffeinated', 'sleepy', 'wired',
] as const;

export const STANCE = [
    'celebrating', 'challenging', 'confessing', 'warning', 'wondering',
    'debating', 'ranting', 'proud',
] as const;

export const EXPERTISE = [
    'deep-dive', 'quick-tip', 'myth-busting', 'strategy-reveal',
    'trap-alert', 'data-nerd', 'hot-take',
] as const;

export const NARRATIVE = [
    'storytelling', 'listicle', 'comparison', 'confession',
    'debate', 'prediction', 'review', 'diary',
] as const;

export const LENS = [
    'student-pov', 'examiner-pov', 'data-pov',
    'historical', 'cross-section', 'counter-intuitive',
] as const;

// ---------------------------------------------------------------------------
// Behavior Categories — NOT fixed templates, just CATEGORIES
// The LLM reads SOUL.md and generates its own creative expressions.
// These categories steer what TYPE of embodied behavior to include.
// ---------------------------------------------------------------------------

export const BEHAVIOR_CATEGORIES = [
    'physical-state',       // body references: tired, hungry, eyes hurt, need water, etc.
    'life-update',          // travel plans, food, weekend, weather, random life stuff
    'community-shoutout',   // anonymous student wins, streaks, collective energy
    'emotional-confession', // honest feelings about data, the batch, the work
    'meta-humor',           // self-deprecating, questioning own sanity, work-life jokes
    'gentle-roast',         // lovingly calling out common student mistakes
    'hype-moment',          // pure excitement about data, improvement, patterns
    'real-talk',            // vulnerable, honest, caring — the human moment
] as const;

// ---------------------------------------------------------------------------
// Seasonal Context — time-aware variety
// ---------------------------------------------------------------------------

export type Season = 'mock-season' | 'exam-countdown' | 'result-day' | 'new-batch' | 'regular';

export function detectSeason(now: Date): Season {
    const month = now.getMonth() + 1; // 1-indexed
    const day = now.getDate();

    // CAT exam is typically in late November
    if (month === 11 && day >= 15) return 'exam-countdown';
    if (month === 12 && day <= 5) return 'exam-countdown';

    // Results typically come in January
    if (month === 1) return 'result-day';

    // Mock season: September-October
    if (month >= 9 && month <= 10) return 'mock-season';

    // New batch enrollments: March-April
    if (month >= 3 && month <= 4) return 'new-batch';

    return 'regular';
}

// ---------------------------------------------------------------------------
// Mood Profile — composite output
// ---------------------------------------------------------------------------

export interface MoodProfile {
    energy: typeof ENERGY[number];
    stance: typeof STANCE[number];
    expertise: typeof EXPERTISE[number];
    narrative: typeof NARRATIVE[number];
    lens: typeof LENS[number];
    behaviorCategory: typeof BEHAVIOR_CATEGORIES[number];
    season: Season;
    temperature: number;
    moodLabel: string;
}

/**
 * Generates a unique mood profile using the creative seed for deterministic
 * but non-repeating selection across all dimensions.
 */
export function generateMoodProfile(creativeSeed: number, now: Date): MoodProfile {
    // Use the seed to pick from each dimension independently.
    // Different prime multipliers ensure different dimensions don't correlate.
    const pick = <T>(arr: readonly T[], offset: number): T =>
        arr[(creativeSeed * offset + Math.floor(now.getTime() / 86400000)) % arr.length];

    const energy = pick(ENERGY, 7);
    const stance = pick(STANCE, 13);
    const expertise = pick(EXPERTISE, 23);
    const narrative = pick(NARRATIVE, 37);
    const lens = pick(LENS, 53);
    const behaviorCategory = pick(BEHAVIOR_CATEGORIES, 67);

    const season = detectSeason(now);

    // Temperature modulation: creative moods → higher temp, analytical → lower
    const creativeStances = ['confessing', 'wondering', 'ranting', 'debating'];
    const temperature = creativeStances.includes(stance) ? 0.9 : 0.5;

    const moodLabel = `${energy}-${stance}-${expertise}`;

    logger.info(`🎭 [Mood] Generated: ${moodLabel} (behavior=${behaviorCategory}, season=${season}, temp=${temperature})`);

    return {
        energy, stance, expertise, narrative, lens,
        behaviorCategory, season, temperature, moodLabel,
    };
}
