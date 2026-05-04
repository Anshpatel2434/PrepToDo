import { sql } from 'drizzle-orm';
import { db } from '../src/db/index.js';

async function main() {
    try {
        console.log("Checking dictionary_words column types:");
        const wordsCols = await db.execute(sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'dictionary_words';`);
        console.table(wordsCols.rows);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
main();
