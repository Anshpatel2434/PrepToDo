import "dotenv/config";
import { runConceptTeaching } from "./ai-orchestration/teaching-concept/runConceptTeaching";

async function main() {
	console.log("🧠 PrepToDo Services Booting...");

	const concept =
		"I think I struggle with understanding political passages, how do I solve that ? ";

	// const explanation = await runConceptTeaching(concept);

	// console.log("\n📘 FINAL EXPLANATION:\n");
	// console.log(explanation);
}

main().catch((err) => {
	console.error("❌ Services crashed:", err);
	process.exit(1);
});
