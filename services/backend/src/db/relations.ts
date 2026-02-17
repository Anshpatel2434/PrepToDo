import { relations } from 'drizzle-orm';
import {
    users,
    authSessions,
    authPasswordResetTokens,
    userProfiles,
    practiceSessions,
    questionAttempts,
    examPapers,
    questions,
    adminUserActivityLog,
    passages,
    articles,
    graphEdges,
    graphNodes,
} from './tables.js';

// =============================================================================
// Relations
// =============================================================================
export const usersRelations = relations(users, ({ many, one }) => ({
    sessions: many(authSessions),
    passwordResetTokens: many(authPasswordResetTokens),
    profile: one(userProfiles, {
        fields: [users.id],
        references: [userProfiles.id],
    }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
    user: one(users, {
        fields: [authSessions.user_id],
        references: [users.id],
    }),
}));

export const authPasswordResetTokensRelations = relations(authPasswordResetTokens, ({ one }) => ({
    user: one(users, {
        fields: [authPasswordResetTokens.user_id],
        references: [users.id],
    }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
    user: one(users, {
        fields: [userProfiles.id],
        references: [users.id],
    }),
}));

// Added relations for new tables
export const practiceSessionsRelations = relations(practiceSessions, ({ one, many }) => ({
    user: one(userProfiles, {
        fields: [practiceSessions.user_id],
        references: [userProfiles.id],
    }),
    attempts: many(questionAttempts),
    paper: one(examPapers, {
        fields: [practiceSessions.paper_id],
        references: [examPapers.id],
    }),
}));

export const questionAttemptsRelations = relations(questionAttempts, ({ one }) => ({
    session: one(practiceSessions, {
        fields: [questionAttempts.session_id],
        references: [practiceSessions.id],
    }),
    question: one(questions, {
        fields: [questionAttempts.question_id],
        references: [questions.id],
    }),
    user: one(userProfiles, {
        fields: [questionAttempts.user_id],
        references: [userProfiles.id],
    }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
    passage: one(passages, {
        fields: [questions.passage_id],
        references: [passages.id],
    }),
    attempts: many(questionAttempts),
}));

export const adminUserActivityLogRelations = relations(adminUserActivityLog, ({ one }) => ({
    user: one(users, {
        fields: [adminUserActivityLog.user_id],
        references: [users.id],
    }),
}));

export const passagesRelations = relations(passages, ({ one, many }) => ({
    questions: many(questions),
    article: one(articles, {
        fields: [passages.article_id],
        references: [articles.id],
    }),
}));

export const graphEdgesRelations = relations(graphEdges, ({ one }) => ({
    sourceNode: one(graphNodes, {
        fields: [graphEdges.source_node_id],
        references: [graphNodes.id],
        relationName: 'sourceNode',
    }),
    targetNode: one(graphNodes, {
        fields: [graphEdges.target_node_id],
        references: [graphNodes.id],
        relationName: 'targetNode',
    }),
}));
