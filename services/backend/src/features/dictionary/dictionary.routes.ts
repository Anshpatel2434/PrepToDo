import { Router } from 'express';
import { requireAuth } from '../auth/middleware/auth.middleware.js';
import { lookupWord, getUserDictionary, removeFromDictionary } from './dictionary.controller.js';

export const dictionaryRouter = Router();

// Dictionary routes
dictionaryRouter.post('/lookup', requireAuth, lookupWord);
dictionaryRouter.get('/', requireAuth, getUserDictionary);
dictionaryRouter.delete('/:wordId', requireAuth, removeFromDictionary);
