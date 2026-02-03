import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { config } from '../config/index.js';
import * as schema from './schema.js';

// Create neon client
const sql = neon(config.databaseUrl);

// Create drizzle instance with schema
export const db = drizzle(sql, { schema });

// Export for use in application
export type Database = typeof db;
