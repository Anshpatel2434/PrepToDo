import "dotenv/config";
import { runDailyContent } from "./workers/daily-content/runDailyContent";
import { runAnalytics } from "./workers/analytics/runAnalytics";

async function main() {
	console.log("🧠 PrepToDo Services Booting...");

	const concept =
		"I think I struggle with understanding political passages, how do I solve that ? ";

	await runAnalytics({ user_id: "1962e072-bcc0-48f4-8376-6c968d406cbe" });

	// await runDailyContent()

	// console.log("\n📘 FINAL EXPLANATION:\n");
	// console.log(explanation);
}

main().catch((err) => {
	console.error("❌ Services crashed:", err);
	process.exit(1);
});