import { DataManager } from "./dataManager";
import { Question } from "../schemas/types";

/**
 * Entity Builder - Clean utilities for creating and managing entities
 * 
 * This module provides clean, simple functions to build entities
 * without worrying about ID management or data consistency.
 */

/**
 * Create a passage entity in the data manager
 */
export function createPassage(
    dataManager: DataManager,
    params: {
        content: string;
        genre: string;
        articleId: string;
        articleSource: string;
    }
): string {
    // Calculate word count
    const wordCount = params.content.split(/\s+/).length;

    // Determine difficulty based on word count
    let difficulty: "easy" | "medium" | "hard";
    if (wordCount < 400) {
        difficulty = "easy";
    } else if (wordCount < 600) {
        difficulty = "medium";
    } else {
        difficulty = "hard";
    }

    // Register passage and return ID
    return dataManager.registerPassage({
        content: params.content,
        wordCount,
        difficulty,
        genre: params.genre,
        articleId: params.articleId,
        articleSource: params.articleSource,
    });
}

/**
 * Create RC questions from LLM output and register them
 */
export function createRCQuestions(
    dataManager: DataManager,
    passageId: string,
    llmQuestions: any[]
): string[] {
    const questionIds: string[] = [];

    for (const q of llmQuestions) {
        const questionId = dataManager.registerRCQuestion({
            passageId,
            questionText: q.question_text,
            questionType: q.question_type || "rc_question",
            options: q.options,
            difficulty: q.difficulty || "medium",
            tags: q.tags || [],
        });

        questionIds.push(questionId);
    }

    return questionIds;
}

/**
 * Create VA questions from LLM output and register them
 */
export function createVAQuestions(
    dataManager: DataManager,
    llmQuestions: any[]
): string[] {
    const questionIds: string[] = [];

    for (const q of llmQuestions) {
        const questionId = dataManager.registerVAQuestion({
            questionText: q.question_text,
            questionType: q.question_type,
            options: q.options,
            jumbledSentences: q.jumbled_sentences,
            difficulty: q.difficulty || "medium",
            tags: q.tags || [],
        });

        questionIds.push(questionId);
    }

    return questionIds;
}

/**
 * Update questions with answers
 */
export function updateQuestionsWithAnswers(
    dataManager: DataManager,
    questionsWithAnswers: Array<{ id: string; correct_answer: { answer: string } }>
): void {
    for (const q of questionsWithAnswers) {
        dataManager.updateQuestion(q.id, {
            correctAnswer: q.correct_answer,
        });
    }
}

/**
 * Update questions with rationales
 */
export function updateQuestionsWithRationales(
    dataManager: DataManager,
    questionsWithRationales: Array<{ id: string; rationale: string }>
): void {
    for (const q of questionsWithRationales) {
        dataManager.updateQuestion(q.id, {
            rationale: q.rationale,
        });
    }
}

/**
 * Update questions with tags
 */
export function updateQuestionsWithTags(
    dataManager: DataManager,
    questionsWithTags: Array<{ id: string; tags: string[] }>
): void {
    for (const q of questionsWithTags) {
        dataManager.updateQuestion(q.id, {
            tags: q.tags,
        });
    }
}

/**
 * Helper to convert DataManager questions to format expected by downstream functions
 */
export function getQuestionsForProcessing(
    dataManager: DataManager,
    filter?: { passageId?: string; questionType?: Question['question_type'] }
): Question[] {
    const allQuestions = dataManager.getQuestionsForDB();

    if (!filter) {
        return allQuestions;
    }

    return allQuestions.filter(q => {
        if (filter.passageId && q.passage_id !== filter.passageId) {
            return false;
        }
        if (filter.questionType && q.question_type !== filter.questionType) {
            return false;
        }
        return true;
    });
}
