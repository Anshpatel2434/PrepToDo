/**
 * Example usage of the Customized Mocks Worker
 *
 * This file demonstrates how to call runCustomizedMock with various configurations.
 */

import { runCustomizedMock } from "./runCustomizedMock";

/**
 * Example 1: Basic Custom Mock
 * Creates a simple custom mock with default settings
 */
async function example1_BasicCustomMock() {
    const result = await runCustomizedMock({
        user_id: "user-uuid-here",
        mock_name: "My First Custom Mock",
        num_passages: 1,
        total_questions: 10,
    });

    console.log("Result:", result);
}

/**
 * Example 2: Multi-Passage Mock
 * Creates a custom mock with 3 passages
 */
async function example2_MultiPassageMock() {
    const result = await runCustomizedMock({
        user_id: "user-uuid-here",
        mock_name: "Advanced Practice Mock",
        num_passages: 3,
        total_questions: 20,
        target_genres: ["Philosophy", "Economics", "History"],
        difficulty_target: "medium",
    });

    console.log("Result:", result);
}

/**
 * Example 3: Personalized Mock Targeting Weak Areas
 * Creates a mock focused on user's weak areas
 */
async function example3_PersonalizedMock() {
    const result = await runCustomizedMock({
        user_id: "user-uuid-here",
        mock_name: "Weak Areas Focus Mock",
        num_passages: 2,
        total_questions: 15,
        difficulty_target: "hard",

        // Personalization based on user analytics
        weak_areas_to_address: ["inference", "tone_analysis", "para_jumble"],

        // Question distribution focusing on weak areas
        question_type_distribution: {
            rc_questions: 6,
            para_summary: 2,
            para_completion: 2,
            para_jumble: 3,
            odd_one_out: 2,
        },

        // Target specific reasoning skills
        target_metrics: ["critical_thinking", "inference", "logical_reasoning"],

        // Time limit for the entire mock
        time_limit_minutes: 30,

        // User analytics for deeper personalization
        user_analytics: {
            accuracy_percentage: 65,
            genre_performance: {
                "Philosophy": { accuracy: 58, attempts: 50 },
                "History": { accuracy: 72, attempts: 45 },
            },
            question_type_performance: {
                "inference": { accuracy: 55, attempts: 30 },
                "tone_analysis": { accuracy: 60, attempts: 20 },
            },
            weak_topics: ["inference", "para_jumble"],
            weak_question_types: ["para_jumble", "tone"],
        },
    });

    console.log("Result:", result);
}

/**
 * Example 4: Timed Mock Test
 * Creates a mock with time limits for exam practice
 */
async function example4_TimedMock() {
    const result = await runCustomizedMock({
        user_id: "user-uuid-here",
        mock_name: "Timed Practice Test",
        num_passages: 2,
        total_questions: 15,

        // Overall time limit for mock
        time_limit_minutes: 20,

        // Per-question time limit (optional)
        per_question_time_limit: 60, // 60 seconds per question

        difficulty_target: "medium",
        target_genres: ["Literature", "Science"],
    });

    console.log("Result:", result);
}

/**
 * Example 5: High Difficulty Mock
 * Creates a challenging mock for advanced practice
 */
async function example5_HighDifficultyMock() {
    const result = await runCustomizedMock({
        user_id: "user-uuid-here",
        mock_name: "Challenge Mock - Hard",
        num_passages: 2,
        total_questions: 12,

        difficulty_target: "hard",

        question_type_distribution: {
            rc_questions: 8,
            para_summary: 1,
            para_completion: 1,
            para_jumble: 1,
            odd_one_out: 1,
        },

        target_metrics: [
            "critical_thinking",
            "inference",
            "evaluation",
            "logical_reasoning",
        ],

        target_genres: ["Philosophy", "Economics"],
    });

    console.log("Result:", result);
}

// Uncomment to run examples
// example1_BasicCustomMock();
// example2_MultiPassageMock();
// example3_PersonalizedMock();
// example4_TimedMock();
// example5_HighDifficultyMock();
