import { v4 as uuidv4 } from 'uuid';
import { Exam, Passage, Question, Article } from "../schemas/types";

/**
 * Central Data Manager for Customized Mock Generation
 * 
 * This class manages all entities (Exam, Passages, Questions) and their IDs
 * to ensure consistency and prevent ID mismatches throughout the workflow.
 */
export class DataManager {
    private examId: string;
    private passages: Map<string, PassageEntity> = new Map();
    private questions: Map<string, QuestionEntity> = new Map();
    private articleIds: string[] = [];

    constructor(existingExamId?: string) {
        this.examId = existingExamId || uuidv4();
    }

    /**
     * Get the exam ID
     */
    getExamId(): string {
        return this.examId;
    }

    /**
     * Register a passage and return its ID
     */
    registerPassage(params: {
        content: string;
        wordCount: number;
        difficulty: "easy" | "medium" | "hard";
        genre: string;
        articleId: string;
        articleSource: string;
    }): string {
        const passageId = uuidv4();
        const now = new Date().toISOString();

        this.passages.set(passageId, {
            id: passageId,
            content: params.content,
            wordCount: params.wordCount,
            difficulty: params.difficulty,
            genre: params.genre,
            articleId: params.articleId,
            articleSource: params.articleSource,
            createdAt: now,
            updatedAt: now,
        });

        // Track article ID
        if (!this.articleIds.includes(params.articleId)) {
            this.articleIds.push(params.articleId);
        }

        return passageId;
    }

    /**
     * Register an RC question (linked to a passage)
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
        if (!this.passages.has(params.passageId)) {
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
     * Get all passages as database-ready format
     */
    getPassagesForDB(examName: string): Passage[] {
        const passages: Passage[] = [];
        const passageEntries = Array.from(this.passages.entries());

        passageEntries.forEach(([passageId, passageEntity], index) => {
            passages.push({
                id: passageId,
                title: `Passage ${index + 1}`,
                content: passageEntity.content,
                word_count: passageEntity.wordCount,
                genre: passageEntity.genre,
                difficulty: passageEntity.difficulty,
                source: passageEntity.articleSource,
                paper_id: this.examId,
                is_daily_pick: false,
                is_featured: false,
                is_archived: false,
                created_at: passageEntity.createdAt,
                updated_at: passageEntity.updatedAt,
            });
        });

        return passages;
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
                jumbled_sentences: questionEntity.jumbledSentences || null,
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
    getExamForDB(params: {
        mockName: string;
        userId: string;
        timeLimitMinutes?: number;
    }): Exam {
        const now = new Date().toISOString();
        const currentYear = new Date().getFullYear();

        return {
            id: this.examId,
            name: params.mockName || "Customized Test",
            year: currentYear,
            exam_type: "CAT",
            slot: "Custom",
            is_official: false,
            created_at: now,
            used_articles_id: this.articleIds,
            generated_by_user_id: params.userId,
            time_limit_minutes: params.timeLimitMinutes,
            updated_at: now,
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
            passageCount: this.passages.size,
            totalQuestions: this.questions.size,
            rcQuestions: rcQuestions.length,
            vaQuestions: vaQuestions.length,
            articleIds: this.articleIds,
        };
    }
}

/**
 * Internal entity types for data management
 */
interface PassageEntity {
    id: string;
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
