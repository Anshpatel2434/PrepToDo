// Quick script to view latest forum posts content
import { db } from './db/index.js';
import { forumPosts } from './db/tables.js';
import { desc } from 'drizzle-orm';

async function main() {
    const posts = await db.select({
        id: forumPosts.id,
        hook: forumPosts.answer_summary,
        content: forumPosts.content,
        mood: forumPosts.mood,
        post_type: forumPosts.post_type,
        target_query: forumPosts.target_query,
    }).from(forumPosts).orderBy(desc(forumPosts.created_at)).limit(3);

    for (const post of posts) {
        console.log('\n' + '='.repeat(80));
        console.log(`📬 Topic: ${post.target_query}`);
        console.log(`🎭 Mood: ${post.mood} | Type: ${post.post_type}`);
        console.log(`🪝 Hook: ${post.hook}`);
        console.log('-'.repeat(80));
        console.log(post.content);
        console.log('='.repeat(80));
    }

    process.exit(0);
}

main();
