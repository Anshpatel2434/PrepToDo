import { Request, Response } from 'express';
import { db } from '../../db/index.js';
import { dictionaryWords, userDictionary } from '../../db/schema.js';
import { eq, and, sql, desc, gte } from 'drizzle-orm';
import { generateWordDefinition } from '../../workers/dictionary/generateWordDefinition.js';
import { createChildLogger } from '../../common/utils/logger.js';
import { CostTracker } from '../../common/utils/CostTracker.js';
import { Errors, successResponse } from '../../common/utils/errors.js';

const logger = createChildLogger('dictionary-controller');

// ============================================================================
// Lookup Word
// ============================================================================
export const lookupWord = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) throw Errors.unauthorized();

        const { word, passage_id, source_context } = req.body;

        if (!word || typeof word !== 'string') {
            throw Errors.validationError({ word: 'Word is required and must be a string' });
        }

        const normalizedWord = word.toLowerCase().trim();
        logger.info({ userId, word: normalizedWord }, 'Lookup word request');

        // 1. Check if word exists in global cache
        const existingWord = await db.query.dictionaryWords.findFirst({
            where: eq(dictionaryWords.word, normalizedWord),
        });

        if (existingWord) {
            // Add to user's dictionary if not already there
            await db.insert(userDictionary)
                .values({
                    user_id: userId,
                    word_id: existingWord.id,
                    source_context: source_context || null,
                    source_passage_id: passage_id || null,
                })
                .onConflictDoNothing(); // userWordUnique constraint protects us

            return res.status(200).json(successResponse({
                word_data: existingWord,
                cached: true,
                limit_reached: false
            }));
        }

        const { check_only } = req.body;
        if (check_only) {
            return res.status(200).json(successResponse({
                word_data: null,
                cached: false,
                not_found: true, // We use this flag to indicate not found in cache for the frontend
            }));
        }

        // 2. Word not in cache -> Check user's daily limit
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Count how many words this user added today that were ALSO created today in dictionaryWords
        // This approximates "how many AI generations did this user trigger today"
        const result = await db.select({ ai_count: sql<number>`count(*)::int` })
            .from(userDictionary)
            .innerJoin(dictionaryWords, eq(userDictionary.word_id, dictionaryWords.id))
            .where(
                and(
                    eq(userDictionary.user_id, userId),
                    gte(userDictionary.created_at, todayStart),
                    gte(dictionaryWords.created_at, todayStart)
                )
            );

        const aiCountToday = result[0]?.ai_count || 0;

        if (aiCountToday >= 20) {
            return res.status(200).json(successResponse({
                limit_reached: true,
                message: "You've discovered 20 new words today, come back tomorrow!"
            }));
        }

        // 3. Generate via AI
        const costTracker = new CostTracker();
        const definition = await generateWordDefinition(normalizedWord, source_context, costTracker);

        if (definition.not_found) {
            return res.status(404).json(successResponse({
                word_data: null,
                not_found: true,
                message: "Word not found or not recognized."
            }));
        }

        // 4. Save to DB
        // Insert into global dictionary
        const [newWord] = await db.insert(dictionaryWords)
            .values({
                word: definition.word.toLowerCase(),
                pronunciation: definition.pronunciation,
                meanings: definition.meanings,
                origin: definition.origin,
                relate_with: definition.relate_with,
                mnemonic: definition.mnemonic,
                breakdown: definition.breakdown,
                synonyms: definition.synonyms,
                antonyms: definition.antonyms,
            })
            .returning();

        // Add to user's dictionary
        await db.insert(userDictionary)
            .values({
                user_id: userId,
                word_id: newWord.id,
                source_context: source_context || null,
                source_passage_id: passage_id || null,
            })
            .onConflictDoNothing();

        // 5. Persist Cost asynchronously
        costTracker.persistToDb('dictionary', userId).catch(err => {
            logger.error({ err }, 'Failed to persist dictionary AI cost');
        });

        return res.status(200).json(successResponse({
            word_data: newWord,
            cached: false,
            limit_reached: false
        }));

    } catch (error) {
        logger.error({ error }, 'Error in lookupWord');
        if (error instanceof Error && error.name === 'ApiError') throw error;
        throw Errors.internalError();
    }
};

// ============================================================================
// Get User's Dictionary
// ============================================================================
export const getUserDictionary = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) throw Errors.unauthorized();

        const { search, sort, order } = req.query;

        // Base condition
        const conditions = [eq(userDictionary.user_id, userId)];

        // Add search
        if (search && typeof search === 'string') {
            conditions.push(sql`lower(${dictionaryWords.word}) LIKE lower(${`%${search}%`})`);
        }

        let query = db.select({
            id: userDictionary.id,
            word_id: dictionaryWords.id,
            word: dictionaryWords.word,
            pronunciation: dictionaryWords.pronunciation,
            meanings: dictionaryWords.meanings,
            origin: dictionaryWords.origin,
            relate_with: dictionaryWords.relate_with,
            mnemonic: dictionaryWords.mnemonic,
            breakdown: dictionaryWords.breakdown,
            synonyms: dictionaryWords.synonyms,
            antonyms: dictionaryWords.antonyms,
            source_context: userDictionary.source_context,
            source_passage_id: userDictionary.source_passage_id,
            created_at: userDictionary.created_at,
        })
            .from(userDictionary)
            .innerJoin(dictionaryWords, eq(userDictionary.word_id, dictionaryWords.id))
            .where(and(...conditions))
            .$dynamic();

        // Add sorting
        const orderByClause = [];
        if (sort === 'alphabetical') {
            orderByClause.push(order === 'desc' ? desc(dictionaryWords.word) : sql`${dictionaryWords.word} ASC`);
        } else {
            // Default: sort by date added
            orderByClause.push(order === 'asc' ? sql`${userDictionary.created_at} ASC` : desc(userDictionary.created_at));
        }
        
        query = query.orderBy(...orderByClause);

        const words = await query;

        return res.status(200).json(successResponse(words));

    } catch (error) {
        logger.error({ error }, 'Error in getUserDictionary');
        throw Errors.internalError();
    }
};

// ============================================================================
// Remove Word from Dictionary
// ============================================================================
export const removeFromDictionary = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) throw Errors.unauthorized();

        const wordId = req.params.wordId as string;

        if (!wordId) {
            throw Errors.validationError({ wordId: 'Word ID is required' });
        }

        await db.delete(userDictionary)
            .where(
                and(
                    eq(userDictionary.user_id, userId),
                    eq(userDictionary.word_id, wordId)
                )
            );

        return res.status(200).json(successResponse({ success: true }));

    } catch (error) {
        logger.error({ error }, 'Error in removeFromDictionary');
        throw Errors.internalError();
    }
};
