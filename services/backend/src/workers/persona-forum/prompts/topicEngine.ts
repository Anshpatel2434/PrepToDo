// =============================================================================
// Persona Forum — Topic Engine v2 (Infinite Seed Theme Combinator)
// =============================================================================
//
// Instead of 80 fixed topic strings that exhaust quickly, this engine
// combines THEMES × ANGLES × MODIFIERS to produce 4,500+ unique seed
// prompts. The LLM interprets each seed creatively, so effective variety
// is infinite.
//
// The seed prompt is a LAUNCHING PAD, not a constraint.
// =============================================================================

import { createChildLogger } from '../../../common/utils/logger.js';
import type { Season } from './moodEngine.js';

const logger = createChildLogger('topic-engine');

// ---------------------------------------------------------------------------
// THEMES — What area of CAT VARC are we touching?
// ---------------------------------------------------------------------------
const THEMES = [
    // RC Core
    'RC accuracy patterns',
    'RC inference questions',
    'RC speed vs comprehension',
    'RC passage types and genres',
    'RC answer-changing behavior',
    'RC difficulty curve',
    'RC option elimination',
    'RC trick questions and traps',
    // VA Core
    'Para jumble solving speed',
    'Para jumble logical connectors',
    'Odd one out patterns',
    'Para summary compression',
    'Sentence completion traps',
    'Vocabulary usage in context',
    // Strategy
    'Pacing and time allocation',
    'Question skipping strategy',
    'Section-wise optimization',
    'Mock test strategy',
    'Exam day execution',
    'Mental stamina and endurance',
    // Data & Insights
    'Weekly accuracy trends',
    'Error pattern analysis',
    'Batch performance comparison',
    'Streak and consistency data',
    'Time-per-question analysis',
    'Genre-wise heatmap insights',
    // Platform Interaction
    'AI Insights feature usage',
    'Skill Radar observations',
    'Daily practice impact',
    'Leaderboard drama',
] as const;

// ---------------------------------------------------------------------------
// ANGLES — What emotional/persona angle to take?
// ---------------------------------------------------------------------------
const ANGLES = [
    'late-night-data-discovery',    // 3am, coffee cold, found something wild
    'post-walk-epiphany',           // went for a walk, came back with insight
    'student-callout',              // someone did something amazing/terrible
    'frustrated-vent',              // can\'t believe the data, need to rant
    'proud-batch-moment',           // this group is actually improving
    'feature-plug',                 // reminding students to use platform features
    'gentle-roast',                 // lovingly calling out common mistakes
    'data-bomb-drop',               // casually dropping a mind-blowing stat
    'tough-love-push',              // stop making excuses, do the work
    'community-hype',               // leaderboard wars, streak celebrations
    'tired-but-caring',             // eyes burning, back hurting, but worth it
    'philosophical-musing',         // bigger picture thoughts about learning
    'physical-state-update',        // my body is protesting but the data is calling
    'weekend-reflection',           // looking back at the week\'s performance
    'chaotic-energy',               // unhinged, excited, bouncing between ideas
] as const;

// ---------------------------------------------------------------------------
// MODIFIERS — Add specificity and prevent repetition
// ---------------------------------------------------------------------------
const MODIFIERS = [
    'focusing on inference-type questions',
    'about a student who scored 95%+ today',
    'comparing morning vs evening test takers',
    'about the most-failed question of the week',
    'highlighting a streak that blew your mind',
    'about why the longest option isn\'t always right',
    'referencing trap option hit rates',
    'about Philosophy genre passages specifically',
    'comparing this batch to previous batches',
    'about the correlation between speed and accuracy',
    'highlighting improvement in a specific weak area',
    'about someone who broke a long streak',
    'referencing the accuracy-per-question-type data',
    'about time wastage on specific question types',
    'where you recommend using AI Insights',
    'about a pattern you noticed in the error logs',
    'comparing RC accuracy to VA accuracy',
    'about a counterintuitive finding in the data',
    'calling out people who aren\'t reading rationales',
    'about the power of elimination over selection',
] as const;

// ---------------------------------------------------------------------------
// Content Phases — 30-day rotation
// ---------------------------------------------------------------------------
export type ContentPhase = 'standard-setting' | 'problem-solver' | 'comparison' | 'lifestyle';

const CONTENT_PHASE_CYCLE: ContentPhase[] = [
    'standard-setting', 'standard-setting', 'standard-setting', 'standard-setting',
    'standard-setting', 'standard-setting', 'standard-setting',
    'problem-solver', 'problem-solver', 'problem-solver', 'problem-solver',
    'problem-solver', 'problem-solver', 'problem-solver', 'problem-solver',
    'comparison', 'comparison', 'comparison', 'comparison',
    'comparison', 'comparison', 'comparison', 'comparison',
    'lifestyle', 'lifestyle', 'lifestyle', 'lifestyle',
    'lifestyle', 'lifestyle', 'lifestyle',
];

// ---------------------------------------------------------------------------
// Category detection from theme
// ---------------------------------------------------------------------------
function detectCategory(theme: string): { category: string; tags: string[] } {
    if (theme.startsWith('RC') || theme.includes('passage') || theme.includes('inference')) {
        return { category: 'reading-comprehension', tags: ['RC', 'CAT', 'VARC'] };
    }
    if (theme.startsWith('Para') || theme.includes('Odd one') || theme.includes('Sentence') || theme.includes('Vocab')) {
        return { category: 'verbal-ability', tags: ['VA', 'CAT', 'VARC'] };
    }
    if (theme.includes('Pacing') || theme.includes('strategy') || theme.includes('Mock') || theme.includes('Exam day') || theme.includes('stamina')) {
        return { category: 'strategy', tags: ['Strategy', 'CAT', 'VARC'] };
    }
    if (theme.includes('AI Insights') || theme.includes('Skill Radar') || theme.includes('Daily practice') || theme.includes('Leaderboard')) {
        return { category: 'tutor-vibes', tags: ['TutorUpdate', 'Platform', 'Features'] };
    }
    return { category: 'data-insights', tags: ['DataDrop', 'Analytics', 'BatchUpdate'] };
}

// ---------------------------------------------------------------------------
// Topic Generation — Infinite Combinator
// ---------------------------------------------------------------------------
export interface TopicSelection {
    targetQuery: string;       // The seed prompt for the LLM
    seoQuery: string;          // The invisible SEO phrase for meta tags
    category: string;
    contentPhase: ContentPhase;
    tags: string[];
}

/**
 * Generates an infinite variety of topic seeds by combining
 * THEMES × ANGLES × MODIFIERS using deterministic but non-repeating selection.
 * Total unique combos: 30 × 15 × 20 = 9,000
 */
export function selectTopic(
    creativeSeed: number,
    heartbeatCount: number,
    topicsCovered: string[],
    season: Season,
): TopicSelection {
    const dayInCycle = heartbeatCount % 30;
    const contentPhase = CONTENT_PHASE_CYCLE[dayInCycle];

    // Use different prime multipliers for each dimension to avoid correlation
    const themeIdx = (creativeSeed * 7 + heartbeatCount * 13) % THEMES.length;
    const angleIdx = (creativeSeed * 11 + heartbeatCount * 23) % ANGLES.length;
    const modifierIdx = (creativeSeed * 17 + heartbeatCount * 31) % MODIFIERS.length;

    const theme = THEMES[themeIdx];
    const angle = ANGLES[angleIdx];
    const modifier = MODIFIERS[modifierIdx];

    // Build the seed prompt — this is what the LLM sees as a launching pad
    const targetQuery = `${theme} — ${angle} — ${modifier}`;

    // Build SEO query — invisible to users, used for meta tags and thread slugs
    const seoQuery = theme.replace(/'/g, '').toLowerCase();

    // Detect category from theme
    const { category, tags } = detectCategory(theme);

    // Add seasonal tags
    if (season === 'mock-season') tags.push('MockSeason');
    if (season === 'exam-countdown') tags.push('ExamCountdown');
    if (season === 'result-day') tags.push('Results');
    tags.push(contentPhase);

    // Check if this exact combo was covered before
    const comboKey = `${themeIdx}-${angleIdx}-${modifierIdx}`;
    if (topicsCovered.includes(comboKey)) {
        // Shift to next combo
        const altThemeIdx = (themeIdx + 1) % THEMES.length;
        const altAngleIdx = (angleIdx + 1) % ANGLES.length;
        const altTargetQuery = `${THEMES[altThemeIdx]} — ${ANGLES[altAngleIdx]} — ${modifier}`;
        logger.info(`📝 [Topic] Combo already covered, shifted to: "${altTargetQuery}" (phase=${contentPhase}, cat=${category})`);
        return {
            targetQuery: altTargetQuery,
            seoQuery: THEMES[altThemeIdx].replace(/'/g, '').toLowerCase(),
            category,
            contentPhase,
            tags,
        };
    }

    logger.info(`📝 [Topic] Selected: "${targetQuery}" (phase=${contentPhase}, cat=${category})`);

    return { targetQuery, seoQuery, category, contentPhase, tags };
}
