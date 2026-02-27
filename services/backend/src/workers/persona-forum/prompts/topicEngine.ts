// =============================================================================
// Persona Forum — Topic Engine v3 (Scenario-First Story Seeds)
// =============================================================================
//
// The core insight: abstract topics ("RC accuracy patterns") give the LLM
// permission to be generic. Specific SCENARIOS ("someone who's been failing
// inference questions for 2 weeks just hit 85% — you find out at midnight")
// force the LLM to write a micro-story with a real emotional core.
//
// v3 changes:
// - THEMES replaced with SCENARIOS: concrete story setups, not topic labels
// - ANGLES refined to emotional TRIGGERS — the feeling that drives the post
// - MODIFIERS sharpened to add sensory/physical texture
// - Combined: ~4,500 story seed combos, each one a launching pad for a
//   specific micro-story, not a topic summary
//
// =============================================================================

import { createChildLogger } from '../../../common/utils/logger.js';
import type { Season } from './moodEngine.js';

const logger = createChildLogger('topic-engine');

// ---------------------------------------------------------------------------
// SCENARIOS — Specific story setups, not topic categories
// The LLM reads this as "what just happened that I want to post about"
// ---------------------------------------------------------------------------
const SCENARIOS = [
    // Student moments
    'a student who has been at 40% on inference questions for 2+ weeks just jumped to 80%+ today',
    'someone spent 4+ minutes on a single RC question and still got it wrong',
    'a student eliminated the correct option twice on the same question',
    'someone\'s score dropped 20 points from yesterday with no obvious reason',
    'a student has been practising every day for 30+ days and nobody\'s talking about it',
    'someone just broke their longest streak and it\'s visible in the data',
    'the top scorer today had a 38% day last week — nobody would have predicted this',
    'a student is racing through RC at 30 seconds per passage and scoring surprisingly high',
    'someone attempted every single question in the session without skipping once',
    'a student\'s accuracy on philosophy RC passages is 2x their accuracy on everything else',

    // Pattern discoveries (things you noticed in the data)
    'the same trap option pattern has appeared in 3 out of the last 5 RC sets',
    'morning batch accuracy is 12 points higher than evening batch this week',
    'inference questions are being answered faster than factual ones — but with worse accuracy',
    'the most failed question today took everyone below-average time — people thought they knew it',
    'one specific question type has a 72% wrong-answer rate this week, higher than any other',
    'parajumble accuracy drops 15% when questions appear after RC — attention fatigue is real',
    'students who read the passage twice are outperforming skim-readers by 18 points',
    'the trap option hit rate spikes every time the passage is over 500 words',
    'there\'s a 45-minute window in the evening where accuracy inexplicably tanks batch-wide',
    'vocabulary-in-context questions have a higher accuracy than direct inference — counterintuitive',

    // Strategy insights (things the data is proving or disproving)
    'the data finally confirms: students who eliminate before selecting score 11 points higher',
    'question-skipping strategy is working — students who skip and return are outperforming non-skippers',
    'the longest RC option is wrong 73% of the time in this batch. we have confirmed it.',
    'students are spending 40% more time on questions they get wrong than questions they get right',
    'mock test scores are predicting actual performance more accurately than sectional scores',
    'the students improving fastest this month all have one thing in common in their practice data',
    'time per question has dropped 8 seconds on average in the past 10 days — and accuracy held',
    're-attempts on the same question are up 30% this week and accuracy on re-attempts is worse',

    // Platform/practice behavior
    'the students who read answer rationales are outperforming those who don\'t by 22 points',
    'practice session length sweet spot is 45-60 minutes — accuracy drops hard after 75 minutes',
    'students who start with VA before RC have better RC accuracy — warm-up effect is real',
    'daily practice beats weekend cramming in this batch\'s data by a significant margin',
    'the AI Insights feature usage just crossed a milestone — and the results are visible',
    'streak data shows the 14-day mark is where most students either lock in or drop off',
] as const;

// ---------------------------------------------------------------------------
// TRIGGERS — The emotional reason you're posting about this right now
// What feeling is driving this post?
// ---------------------------------------------------------------------------
const TRIGGERS = [
    'you found this at 11pm while doing a routine check and now you can\'t stop thinking about it',
    'you\'ve seen this pattern before and you need to warn them before it happens again',
    'this is the third time this month you\'ve seen this and you\'re starting to suspect something',
    'you expected the opposite of what the data shows and you\'re still processing it',
    'someone deserves to be recognized for this and you can\'t not say something',
    'this is genuinely good news and you want to share it while it\'s still exciting',
    'this is bothering you and you need to put it somewhere',
    'you just got back from a break and this was the first thing you checked',
    'you almost missed this — it\'s buried in the data but it changes how you see the week',
    'you\'ve been sitting with this for two hours and you need an outside opinion',
    'this is the kind of thing that makes the data actually matter to you',
    'this is funny and also slightly concerning and you can\'t separate the two feelings',
    'you showed this to someone else first and their reaction confirmed it was worth sharing',
    'you weren\'t going to post tonight but this changed your mind',
    'you\'ve been watching this develop for a week and it\'s finally at the point where you can say something',
] as const;

// ---------------------------------------------------------------------------
// TEXTURE — Physical/contextual detail that makes the post feel lived-in
// Anchors the post in a specific real moment
// ---------------------------------------------------------------------------
const TEXTURE = [
    'it\'s late and your eyes are burning but you had to share this before you forgot',
    'you\'ve been staring at this on a small screen for the past hour',
    'you were about to close the laptop when this appeared',
    'you went for a walk earlier and kept thinking about this the whole time',
    'it\'s been a weird week and this data either fixes it or makes it weirder',
    'you\'ve had the same analysis tab open for three hours and this is the thing',
    'your back is killing you from sitting but you\'re not moving until you\'ve posted this',
    'you checked the data right after waking up and this was waiting for you',
    'you texted this observation to yourself at 2am and you\'re posting it now',
    'you almost didn\'t notice this — it\'s a small thing but it\'s been sitting with you',
    'it\'s raining outside and somehow that made the data feel more interesting',
    'you need chai but you\'re not getting up until you\'ve shared this',
    'you\'re posting from your phone because you wanted to get this out immediately',
    'you\'ve been talking about this topic for weeks and the data is finally saying something concrete',
    'it\'s a slow day which is why you had time to go deep on this specific thing',
    'you ran this past someone before posting and they said "you have to share this"',
    'you\'ve been saving this observation for the right moment and this is the moment',
    'you genuinely didn\'t know what you were going to find when you opened the data tonight',
] as const;

// ---------------------------------------------------------------------------
// Content Phases — 30-day rotation (unchanged from v2)
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
// Category detection from scenario content
// ---------------------------------------------------------------------------
function detectCategory(scenario: string): { category: string; tags: string[] } {
    if (scenario.includes('RC') || scenario.includes('passage') || scenario.includes('inference') || scenario.includes('reading')) {
        return { category: 'reading-comprehension', tags: ['RC', 'CAT', 'VARC'] };
    }
    if (scenario.includes('parajumble') || scenario.includes('vocabulary') || scenario.includes('VA') || scenario.includes('sentence')) {
        return { category: 'verbal-ability', tags: ['VA', 'CAT', 'VARC'] };
    }
    if (scenario.includes('mock') || scenario.includes('strategy') || scenario.includes('time') || scenario.includes('skip') || scenario.includes('attempt')) {
        return { category: 'strategy', tags: ['Strategy', 'CAT', 'VARC'] };
    }
    if (scenario.includes('streak') || scenario.includes('AI Insights') || scenario.includes('platform') || scenario.includes('practice session') || scenario.includes('daily practice')) {
        return { category: 'tutor-vibes', tags: ['TutorUpdate', 'Platform', 'BatchUpdate'] };
    }
    return { category: 'data-insights', tags: ['DataDrop', 'Analytics', 'BatchUpdate'] };
}

// ---------------------------------------------------------------------------
// Topic Generation
// ---------------------------------------------------------------------------
export interface TopicSelection {
    targetQuery: string;       // The scenario seed for the LLM
    seoQuery: string;          // SEO phrase for meta tags
    category: string;
    contentPhase: ContentPhase;
    tags: string[];
}

/**
 * Generates story seed prompts by combining SCENARIOS × TRIGGERS × TEXTURE.
 * Total unique combos: 34 × 15 × 18 = ~9,180
 * Each one is a specific scenario + emotional trigger + physical anchor.
 * This gives the LLM a MOMENT to react to, not a TOPIC to explain.
 */
export function selectTopic(
    creativeSeed: number,
    heartbeatCount: number,
    topicsCovered: string[],
    season: Season,
): TopicSelection {
    const dayInCycle = heartbeatCount % 30;
    const contentPhase = CONTENT_PHASE_CYCLE[dayInCycle];

    // Different prime multipliers for each dimension to avoid correlation
    const scenarioIdx = (creativeSeed * 7 + heartbeatCount * 13) % SCENARIOS.length;
    const triggerIdx = (creativeSeed * 11 + heartbeatCount * 23) % TRIGGERS.length;
    const textureIdx = (creativeSeed * 17 + heartbeatCount * 31) % TEXTURE.length;

    const scenario = SCENARIOS[scenarioIdx];
    const trigger = TRIGGERS[triggerIdx];
    const texture = TEXTURE[textureIdx];

    // Build the story seed — a specific scenario + the emotional reason you're sharing it
    const targetQuery = `${scenario} / ${trigger} / ${texture}`;

    // SEO query is clean topic label for meta tags
    const seoQuery = scenario.split(' ').slice(0, 6).join(' ').toLowerCase().replace(/[',]/g, '');

    const { category, tags } = detectCategory(scenario);

    // Seasonal tags
    if (season === 'mock-season') tags.push('MockSeason');
    if (season === 'exam-countdown') tags.push('ExamCountdown');
    if (season === 'result-day') tags.push('Results');
    tags.push(contentPhase);

    // Check for repeats
    const comboKey = `${scenarioIdx}-${triggerIdx}-${textureIdx}`;
    if (topicsCovered.includes(comboKey)) {
        const altScenarioIdx = (scenarioIdx + 1) % SCENARIOS.length;
        const altTriggerIdx = (triggerIdx + 2) % TRIGGERS.length;
        const altTargetQuery = `${SCENARIOS[altScenarioIdx]} / ${TRIGGERS[altTriggerIdx]} / ${texture}`;
        logger.info(`📝 [Topic] Combo already covered, shifted. New: "${SCENARIOS[altScenarioIdx].slice(0, 50)}..."`);
        return {
            targetQuery: altTargetQuery,
            seoQuery: SCENARIOS[altScenarioIdx].split(' ').slice(0, 6).join(' ').toLowerCase().replace(/[',]/g, ''),
            category,
            contentPhase,
            tags,
        };
    }

    logger.info(`📝 [Topic] Scenario: "${scenario.slice(0, 60)}..." (phase=${contentPhase}, cat=${category})`);

    return { targetQuery, seoQuery, category, contentPhase, tags };
}