import "dotenv/config";
import { runDailyContent } from "./workers/daily-content/runDailyContent";
import { runAnalytics } from "./workers/analytics/runAnalytics";

async function main() {
	console.log("🧠 PrepToDo Services Booting...");

	const concept =
		"I think I struggle with understanding political passages, how do I solve that ? ";

	// await runAnalytics({ session_id: "a3b9d57c-8a1f-475a-86ed-658cc5f4d9ef", user_id: "1962e072-bcc0-48f4-8376-6c968d406cbe" });
	// await runAnalytics({ session_id: "f5634c58-85af-4eb9-a870-8b6fb8754507", user_id: "1962e072-bcc0-48f4-8376-6c968d406cbe" });
	// await runAnalytics({ session_id: "1da8c971-ad46-47aa-83f5-15d055ae69e1", user_id: "1962e072-bcc0-48f4-8376-6c968d406cbe" });
	// await runAnalytics({ session_id: "54367517-f2db-4b3e-85c3-e3f5f29290ad", user_id: "1962e072-bcc0-48f4-8376-6c968d406cbe" });

	// await runDailyContent()

	// console.log("\n📘 FINAL EXPLANATION:\n");
	// console.log(explanation);
}

main().catch((err) => {
	console.error("❌ Services crashed:", err);
	process.exit(1);
});