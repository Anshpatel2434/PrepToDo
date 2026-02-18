// =============================================================================
// Daily Content Worker - Data Manager
// =============================================================================
// Central Data Manager for Daily Content Generation
// Manages all entities (Exam, Passage, Questions) and their IDs

import { v4 as uuidv4 } from 'uuid';
import { Exam, Passage, Question } from "../types";

/**
 * Central Data Manager for Daily Content Generation
 * 
 * This class manages all entities (Exam, Passage, Questions) and their IDs
 * to ensure consistency and prevent ID mismatches throughout the workflow.
 */
export class DataManager {
    private examId: string;
    private passage: PassageEntity | null = null;
    private questions: Map<string, QuestionEntity> = new Map();
    private articleId: string = "";
    private genreName: string = "";

    constructor() {
        this.examId = uuidv4();
    }

    /**
     * Get the exam ID
     */
    getExamId(): string {
        return this.examId;
    }

    /**
     * Register the daily passage and return its ID
     */
    registerPassage(params: {
        title: string;
        content: string;
        wordCount: number;
        difficulty: "easy" | "medium" | "hard";
        genre: string;
        articleId: string;
        articleSource: string;
    }): string {
        const passageId = uuidv4();
        const now = new Date().toISOString();

        this.passage = {
            id: passageId,
            title: params.title,
            content: params.content,
            wordCount: params.wordCount,
            difficulty: params.difficulty,
            genre: params.genre,
            articleId: params.articleId,
            articleSource: params.articleSource,
            createdAt: now,
            updatedAt: now,
        };

        // Track article ID and genre
        this.articleId = params.articleId;
        this.genreName = params.genre;

        return passageId;
    }

    /**
     * Register an RC question (linked to the passage)
     */
    registerRCQuestion(params: {
        passageId: string;
        questionText: string;
        questionType: Question['question_type'];
        options: Question['options'];
        difficulty: Question['difficulty'];
        tags: string[];
        correctAnswer: { answer: string };
    }): string {
        if (!this.passage || this.passage.id !== params.passageId) {
            throw new Error(`Cannot register RC question: Passage ${params.passageId} not found`);
        }

        const questionId = uuidv4();
        const now = new Date().toISOString();

        this.questions.set(questionId, {
            id: questionId,
            passageId: params.passageId,
            paperId: this.examId,
            questionText: params.questionText,
            questionType: params.questionType,
            options: params.options,
            jumbledSentences: { "1": "", "2": "", "3": "", "4": "", "5": "" },
            correctAnswer: params.correctAnswer,
            rationale: "",
            difficulty: params.difficulty,
            tags: params.tags,
            createdAt: now,
            updatedAt: now,
        });

        return questionId;
    }

    /**
     * Register a VA question (standalone, no passage)
     */
    registerVAQuestion(params: {
        questionText: string;
        questionType: Question['question_type'];
        options?: Question['options'];
        jumbledSentences?: Question['jumbled_sentences'];
        difficulty: Question['difficulty'];
        tags: string[];
        correctAnswer: { answer: string };
    }): string {
        const questionId = uuidv4();
        const now = new Date().toISOString();

        this.questions.set(questionId, {
            id: questionId,
            passageId: null,
            paperId: this.examId,
            questionText: params.questionText,
            questionType: params.questionType,
            options: params.options || { "A": "", "B": "", "C": "", "D": "" },
            jumbledSentences: params.jumbledSentences || { "1": "", "2": "", "3": "", "4": "", "5": "" },
            correctAnswer: params.correctAnswer,
            rationale: "",
            difficulty: params.difficulty,
            tags: params.tags,
            createdAt: now,
            updatedAt: now,
        });

        return questionId;
    }

    /**
     * Update question with answer and rationale
     */
    updateQuestion(questionId: string, updates: {
        correctAnswer?: { answer: string };
        rationale?: string;
        tags?: string[];
    }): void {
        const question = this.questions.get(questionId);
        if (!question) {
            throw new Error(`Cannot update question: Question ${questionId} not found`);
        }

        if (updates.correctAnswer) {
            question.correctAnswer = updates.correctAnswer;
        }
        if (updates.rationale) {
            question.rationale = updates.rationale;
        }
        if (updates.tags) {
            question.tags = updates.tags;
        }

        question.updatedAt = new Date().toISOString();
    }

    /**
     * Get passage as database-ready format
     */
    getPassageForDB(): Passage {
        if (!this.passage) {
            throw new Error("No passage registered");
        }

        return {
            id: this.passage.id,
            title: this.passage.title,
            content: this.passage.content,
            word_count: this.passage.wordCount,
            genre: this.passage.genre,
            difficulty: this.passage.difficulty,
            source: this.passage.articleSource,
            paper_id: this.examId,
            is_daily_pick: true,
            is_featured: false,
            is_archived: false,
            created_at: this.passage.createdAt,
            updated_at: this.passage.updatedAt,
        };
    }

    /**
     * Get all questions as database-ready format
     */
    getQuestionsForDB(): Question[] {
        const questions: Question[] = [];
        const questionEntries = Array.from(this.questions.entries());

        questionEntries.forEach(([questionId, questionEntity]) => {
            questions.push({
                id: questionId,
                passage_id: questionEntity.passageId,
                paper_id: questionEntity.paperId,
                question_text: questionEntity.questionText,
                question_type: questionEntity.questionType,
                options: questionEntity.options,
                jumbled_sentences: questionEntity.jumbledSentences,
                correct_answer: questionEntity.correctAnswer,
                rationale: questionEntity.rationale,
                difficulty: questionEntity.difficulty,
                tags: questionEntity.tags,
                created_at: questionEntity.createdAt,
                updated_at: questionEntity.updatedAt,
            });
        });

        return questions;
    }

    /**
     * Get exam data as database-ready format
     */
    getExamForDB(): Exam {
        const now = new Date().toISOString();
        const currentYear = new Date().getFullYear();

        return {
            id: this.examId,
            name: "Daily Practice",
            year: currentYear,
            exam_type: "CAT",
            slot: null,
            is_official: false,
            created_at: now,
            used_articles_id: [this.articleId],
        };
    }

    /**
     * Get statistics
     */
    getStats() {
        const rcQuestions = Array.from(this.questions.values()).filter(q => q.passageId !== null);
        const vaQuestions = Array.from(this.questions.values()).filter(q => q.passageId === null);

        return {
            examId: this.examId,
            passageId: this.passage?.id || null,
            totalQuestions: this.questions.size,
            rcQuestions: rcQuestions.length,
            vaQuestions: vaQuestions.length,
            articleId: this.articleId,
            genre: this.genreName,
        };
    }

    /**
     * Get passage content (helper for workflow)
     */
    getPassageContent(): string {
        if (!this.passage) {
            throw new Error("No passage registered");
        }
        return this.passage.content;
    }

    /**
     * Get passage ID (helper for workflow)
     */
    getPassageId(): string {
        if (!this.passage) {
            throw new Error("No passage registered");
        }
        return this.passage.id;
    }
}

/**
 * Internal entity types for data management
 */
interface PassageEntity {
    id: string;
    title: string;
    content: string;
    wordCount: number;
    difficulty: "easy" | "medium" | "hard";
    genre: string;
    articleId: string;
    articleSource: string;
    createdAt: string;
    updatedAt: string;
}

interface QuestionEntity {
    id: string;
    passageId: string | null;
    paperId: string;
    questionText: string;
    questionType: Question['question_type'];
    options: Question['options'];
    jumbledSentences: Question['jumbled_sentences'];
    correctAnswer: { answer: string };
    rationale: string;
    difficulty: Question['difficulty'];
    tags: string[];
    createdAt: string;
    updatedAt: string;
}
