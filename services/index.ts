import "dotenv/config";
import { runDailyContent } from "./workers/daily-content/runDailyContent";

async function main() {
	console.log("🧠 PrepToDo Services Booting...");

	const concept =
		"I think I struggle with understanding political passages, how do I solve that ? ";

	await runDailyContent()

	// console.log("\n📘 FINAL EXPLANATION:\n");
	// console.log(explanation);
}

main().catch((err) => {
	console.error("❌ Services crashed:", err);
	process.exit(1);
});