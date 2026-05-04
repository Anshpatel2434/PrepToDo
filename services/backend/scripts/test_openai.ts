import { generateWordDefinition } from '../src/workers/dictionary/generateWordDefinition.js';

async function main() {
    try {
        console.log("Testing word generation for 'ushered'...");
        const res = await generateWordDefinition('ushered');
        console.log("Success:", res);
    } catch (e: any) {
        console.error("Error caught:", e.message || e);
    }
    process.exit(0);
}
main();
