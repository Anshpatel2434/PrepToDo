import { sql } from 'drizzle-orm';
import { db } from '../src/db/index.js';

async function main() {
    try {
        console.log("Checking dictionary_words columns:");
        const wordsCols = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'dictionary_words';`);
        console.log(wordsCols.rows.map(r => r.column_name));

        console.log("Checking user_dictionary columns:");
        const userCols = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'user_dictionary';`);
        console.log(userCols.rows.map(r => r.column_name));
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
main();
