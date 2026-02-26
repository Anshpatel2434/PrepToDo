// =============================================================================
// Test Script: Generate a single forum post via the heartbeat engine
// Usage: npm run test:forum-post
// =============================================================================
import { runPersonaHeartbeat } from './workers/persona-forum/runPersonaHeartbeat.js';
import { createChildLogger } from './common/utils/logger.js';

const logger = createChildLogger('test-forum-post');

async function main() {
    logger.info('🧪 Generating a test forum post...');

    try {
        const result = await runPersonaHeartbeat();

        if (result.success) {
            logger.info({ postId: result.postId }, '✅ Test post created successfully!');
            console.log('\n========================================');
            console.log('✅ Post generated successfully');
            console.log(`   Post ID: ${result.postId}`);
            console.log('   View at: /forum (once frontend is running)');
            console.log('========================================\n');
        } else {
            logger.error({ error: result.error }, '❌ Post generation failed');
            console.error('\n❌ Failed:', result.error);
        }
    } catch (err) {
        logger.error({ err }, '❌ Script crashed');
        console.error('\n❌ Error:', err);
        process.exit(1);
    }

    process.exit(0);
}

main();
