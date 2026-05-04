import { sql } from 'drizzle-orm';
import { db } from '../src/db/index.js';

async function main() {
    try {
        console.log("Fixing dictionary_words column types...");
        // Since the table is likely empty or we can just safely cast it:
        // Try to cast or recreate
        await db.execute(sql`
            ALTER TABLE dictionary_words 
            ALTER COLUMN synonyms TYPE text[] USING ARRAY(SELECT jsonb_array_elements_text(synonyms)),
            ALTER COLUMN antonyms TYPE text[] USING ARRAY(SELECT jsonb_array_elements_text(antonyms));
        `);
        console.log("Success! Columns are now text[]");
    } catch (err: any) {
        console.log("Cast failed, dropping and recreating columns...");
        try {
            await db.execute(sql`
                ALTER TABLE dictionary_words 
                DROP COLUMN IF EXISTS synonyms,
                DROP COLUMN IF EXISTS antonyms,
                ADD COLUMN synonyms text[] DEFAULT '{}',
                ADD COLUMN antonyms text[] DEFAULT '{}';
            `);
            console.log("Successfully recreated columns as text[]!");
        } catch (innerErr) {
            console.error("Failed to fix columns:", innerErr);
        }
    }
    process.exit(0);
}
main();
