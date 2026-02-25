// =============================================================================
// Persona Forum — Topic Engine (Missing Middle Query Generator)
// =============================================================================
//
// Generates the specific high-intent question each forum post will answer.
// Follows the Missing Middle philosophy: target queries that coaching
// competitors ignore, from the Expert Angle.
//
// Topic sources:
//   1. Missing Middle question bank (curated high-intent queries)
//   2. Platform data insights (low accuracy areas, common traps)
//   3. Content phase rotation (Standard Setting → Problem Solver → etc.)
//   4. Seasonal/trending topics
// =============================================================================

import { createChildLogger } from '../../../common/utils/logger.js';
import type { Season } from './moodEngine.js';

const logger = createChildLogger('topic-engine');

// ---------------------------------------------------------------------------
// Missing Middle Question Bank
// Curated high-intent queries that coaching centers ignore.
// These are the EXACT questions CAT aspirants ask AI search engines.
// ---------------------------------------------------------------------------

const MISSING_MIDDLE_RC = [
    'How to avoid scope traps in CAT RC inference questions',
    'Why paraphrased options in RC are usually wrong — and when they\'re not',
    'What to do when two RC options seem equally correct',
    'How top CAT scorers read RC passages differently from average test-takers',
    'The exact reading strategy that reduces RC re-reading by 60%',
    'Why your RC accuracy drops after the first 3 passages',
    'How to handle RC passages with deliberately ambiguous conclusions',
    'The 3-minute rule: when to abandon an RC passage and move on',
    'Why evidence-based RC questions have a hidden difficulty curve',
    'How to detect author tone in RC when no explicit opinion words are used',
    'What makes CAT RC inference questions harder than other MBA exams',
    'Why reading speed doesn\'t predict RC accuracy after a threshold',
    'How to handle double negatives in RC option elimination',
    'The difference between "strongly supported" and "can be inferred" in RC',
    'Why the longest RC option is statistically more likely to be correct (and when it isn\'t)',
    'How to speed-read CAT RC passages without losing comprehension',
    'The psychology behind why students pick emotionally satisfying but wrong RC answers',
    'How to handle abstract philosophical RC passages when you have no context',
    'Why your RC scores fluctuate wildly between mocks — and how to stabilize them',
    'How to identify the central argument in RC passages that bury it in the middle',
] as const;

const MISSING_MIDDLE_VA = [
    'How to solve CAT para jumbles in under 90 seconds using opening-closing strategy',
    'Why fixing the first and last sentence is the wrong approach for hard PJ',
    'The pronoun chain technique for para jumbles that eliminates 80% of options',
    'Odd one out tricks when all sentences seem thematically related',
    'How to handle para summary questions when the passage has conflicting ideas',
    'Why your para jumble accuracy drops when sets have 5+ sentences',
    'The logical connector method for para jumbles that most coaching ignores',
    'How to spot the "pivot sentence" in para jumbles that determines the entire order',
    'Why chronological ordering fails in 40% of CAT para jumbles',
    'How to handle odd-one-out when the "odd" sentence is thematically similar but logically distinct',
    'The 3 types of CAT para jumble structures and how to identify them in 10 seconds',
    'How to solve sentence completion when the blank could logically hold 2 different ideas',
    'Why most students get word usage questions wrong — the connotation trap',
    'How to handle fill-in-the-blank when context suggests opposite meanings in different parts',
    'The frequency illusion: why familiar-sounding VA options are usually traps',
] as const;

const MISSING_MIDDLE_STRATEGY = [
    'How to recover from a bad first section in CAT without panicking',
    'The optimal question-skipping strategy that CAT 99-percentilers use',
    'Why attempting fewer questions often leads to higher CAT VARC scores',
    'How to handle time allocation when RC passages have varying difficulty',
    'The diminishing returns trap: when to stop optimizing and start trusting your gut',
    'Why mock test strategy doesn\'t translate to actual CAT — and what to do instead',
    'How to build mental stamina for the last 20 minutes of CAT VARC',
    'The warm-up question technique: why your first 2 answers matter disproportionately',
    'How to maintain confidence mid-exam when you realize you\'ve made a mistake',
    'Why pacing strategy is more important than skill for CAT VARC 90+ percentile',
    'The exam day morning routine that top CAT scorers swear by',
    'How to handle the psychological pressure of seeing unfamiliar passage topics in CAT',
    'Why "read the question first" is bad advice for most CAT RC passages',
    'How to handle mock fatigue in the final 2 months before CAT',
    'The accuracy-speed tradeoff curve: finding your personal sweet spot',
] as const;

const MISSING_MIDDLE_MINDSET = [
    'Why the best CAT preparation isn\'t about studying more — it\'s about failing better',
    'How top CAT scorers think differently about wrong answers',
    'The compound effect of daily VARC practice: why tiny improvements add up',
    'Why comparing your mock scores to others is the fastest way to burn out',
    'How to stay motivated when your CAT mock scores plateau for weeks',
    'The Dunning-Kruger effect in CAT prep: why you feel worse as you get better',
    'Why the 100th hour of VARC practice is worth more than the first 100 combined',
    'How to handle the anxiety of CAT exam day without performance-enhancing shortcuts',
    'The myth of "natural verbal ability" — why VARC is a trainable skill',
    'Why journaling your wrong answers is the most underrated CAT prep technique',
] as const;

// ---------------------------------------------------------------------------
// Content Phases — 30-day rotation per Missing Middle / AEO strategy
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
// Topic Generation
// ---------------------------------------------------------------------------

export interface TopicSelection {
    targetQuery: string;
    category: string;
    contentPhase: ContentPhase;
    tags: string[];
}

/**
 * Selects a topic for the next forum post. Avoids topics already covered
 * by checking against the topicsCovered list from persona_state.
 */
export function selectTopic(
    creativeSeed: number,
    heartbeatCount: number,
    topicsCovered: string[],
    season: Season,
): TopicSelection {
    // Determine content phase based on day-in-cycle (30-day rotation)
    const dayInCycle = heartbeatCount % 30;
    const contentPhase = CONTENT_PHASE_CYCLE[dayInCycle];

    // Build the candidate pool based on content phase
    let candidatePool: readonly string[];
    let category: string;
    let tags: string[];

    // Rotate between topic categories using heartbeat count
    const categoryIndex = (heartbeatCount + creativeSeed) % 4;

    switch (categoryIndex) {
        case 0:
            candidatePool = MISSING_MIDDLE_RC;
            category = 'reading-comprehension';
            tags = ['RC', 'CAT', 'VARC'];
            break;
        case 1:
            candidatePool = MISSING_MIDDLE_VA;
            category = 'verbal-ability';
            tags = ['VA', 'CAT', 'VARC', 'ParaJumble'];
            break;
        case 2:
            candidatePool = MISSING_MIDDLE_STRATEGY;
            category = 'strategy';
            tags = ['Strategy', 'CAT', 'VARC', 'TimeManagement'];
            break;
        case 3:
        default:
            candidatePool = MISSING_MIDDLE_MINDSET;
            category = 'mindset';
            tags = ['Mindset', 'CAT', 'Motivation'];
            break;
    }

    // Add seasonal tags
    if (season === 'mock-season') tags.push('MockSeason');
    if (season === 'exam-countdown') tags.push('ExamCountdown');
    if (season === 'result-day') tags.push('Results');

    // Add content phase tag
    tags.push(contentPhase);

    // Filter out already-covered topics
    const available = candidatePool.filter(q => !topicsCovered.includes(q));

    // If all topics in this category exhausted, pick from any category
    let targetQuery: string;
    if (available.length > 0) {
        const index = (creativeSeed * 31 + heartbeatCount * 17) % available.length;
        targetQuery = available[index];
    } else {
        // All topics in this category used — combine all banks
        const allTopics = [
            ...MISSING_MIDDLE_RC,
            ...MISSING_MIDDLE_VA,
            ...MISSING_MIDDLE_STRATEGY,
            ...MISSING_MIDDLE_MINDSET,
        ];
        const allAvailable = allTopics.filter(q => !topicsCovered.includes(q));
        if (allAvailable.length > 0) {
            const index = (creativeSeed * 41 + heartbeatCount * 19) % allAvailable.length;
            targetQuery = allAvailable[index];
        } else {
            // Everything exhausted — reset (this would take 60+ daily posts to reach)
            logger.warn('⚠️ [Topic] All topics exhausted, cycling from start');
            const index = heartbeatCount % candidatePool.length;
            targetQuery = candidatePool[index];
        }
    }

    logger.info(`📝 [Topic] Selected: "${targetQuery}" (phase=${contentPhase}, cat=${category})`);

    return { targetQuery, category, contentPhase, tags };
}
