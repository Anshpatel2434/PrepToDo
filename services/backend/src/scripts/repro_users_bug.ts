
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { desc } from 'drizzle-orm';

async function main() {
    try {
        console.log('Running users query...');
        // Match the query in admin-users.controller.ts getUsers
        const usersList = await db.query.users.findMany({
            limit: 10,
            offset: 0,
            orderBy: [desc(users.created_at)],
            columns: {
                id: true,
                email: true,
                role: true,
                created_at: true,
                last_sign_in_at: true
            },
            with: {
                profile: {
                    columns: { display_name: true }
                }
            }
        });
        console.log('Query success:', JSON.stringify(usersList, null, 2));
    } catch (error) {
        console.error('Query failed:', error);
    }
}

main();
