import { sql } from 'drizzle-orm';
import { db } from '../src/db/index.js';

async function main() {
    try {
        console.log("Adding generation_model to dictionary_words...");
        await db.execute(sql`ALTER TABLE dictionary_words ADD COLUMN IF NOT EXISTS generation_model text DEFAULT 'gpt-4o-mini';`);
        console.log("Success!");
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
main();
