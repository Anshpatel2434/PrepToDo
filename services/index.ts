import "dotenv/config";
import { runDailyContent } from "./workers/daily-content/runDailyContent";
import { runAnalytics } from "./workers/analytics/runAnalytics";
import { runCustomizedMock } from "./workers/customized-mocks/runCustomizedMock";

async function main() {
	console.log("🧠 PrepToDo Services Booting...");

	const concept =
		"I think I struggle with understanding political passages, how do I solve that ? ";

	// await runAnalytics({ user_id: "1962e072-bcc0-48f4-8376-6c968d406cbe" });

	// await runDailyContent()

		const result = await runCustomizedMock({
			user_id: "1962e072-bcc0-48f4-8376-6c968d406cbe",
			mock_name: "Customized Mock",
			num_passages: 4,
			total_questions: 24,
	
			difficulty_target: "medium",
	
			question_type_distribution: {
				rc_questions: 4,
				para_summary: 2,
				para_completion: 2,
				para_jumble: 2,
				odd_one_out: 2,
			},
	
			target_metrics: [
				"inference_accuracy",
				"detail_vs_structure_balance",
				"evidence_evaluation",
				"strategic_efficiency",
			],
	
			target_genres: ["Neuroscience", "Urban Studies", "Economics", "Philosophy"],
			time_limit_minutes: 40,

			weak_areas_to_address: ["inference", "tone_analysis", "para_jumble"],
		});
	
		console.log("Result:", result);

	// console.log("\n📘 FINAL EXPLANATION:\n");
	// console.log(explanation);
}

main().catch((err) => {
	console.error("❌ Services crashed:", err);
	process.exit(1);
});