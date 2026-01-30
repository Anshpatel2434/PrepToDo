import "dotenv/config";
import { runDailyContent } from "./workers/daily-content/runDailyContent";
import { runAnalytics } from "./workers/analytics/runAnalytics";
import { runCustomizedMock } from "./workers/customized-mocks/runCustomizedMock";
import { handleStep1Init } from "./workers/customized-mocks/functions/step1Init/handler";
import { handleStep2Passages } from "./workers/customized-mocks/functions/step2Passages/handler";
import { handleStep3RcQuestions } from "./workers/customized-mocks/functions/step3RcQuestions/handler";
import { handleStep4VaQuestions } from "./workers/customized-mocks/functions/step4VaQuestions/handler";
import { handleStep5SelectAnswers } from "./workers/customized-mocks/functions/step5SelectAnswers/handler";
import { handleStep6RcRationales } from "./workers/customized-mocks/functions/step6RcRationales/handler";
import { handleStep7VaRationales } from "./workers/customized-mocks/functions/step7VaRationales/handler";
import { supabase } from "./config/supabase";

async function main() {
	console.log("🧠 PrepToDo Services Booting...");

	const concept =
		"I think I struggle with understanding political passages, how do I solve that ? ";

	// await runAnalytics({ user_id: "1962e072-bcc0-48f4-8376-6c968d406cbe" });

	// await runDailyContent()
	
		// const result = await handleStep1Init({
		// 	user_id: "1962e072-bcc0-48f4-8376-6c968d406cbe",
		// 	mock_name: "Customized Mock",
		// 	total_questions: 24,
	
		// 	difficulty_target: "medium",
	
		// 	question_type_distribution: {
		// 		rc_questions: 4,
		// 		para_summary: 2,
		// 		para_completion: 2,
		// 		para_jumble: 2,
		// 		odd_one_out: 2,
		// 	},
	
		// 	target_metrics: [
		// 		"inference_accuracy",
		// 		"detail_vs_structure_balance",
		// 		"evidence_evaluation",
		// 		"strategic_efficiency",
		// 	],
	
		// 	target_genres: ["Neuroscience", "Urban Studies", "Economics", "Philosophy"],
		// 	time_limit_minutes: 40,

		// 	weak_areas_to_address: ["inference", "tone_analysis", "para_jumble"],
		// });
		
	// const result = await handleStep2Passages({ exam_id: "2554a9c5-225d-44ac-99b0-b9847c134b2d"})
	// const result = await handleStep3RcQuestions({ exam_id: "2e64bff5-2fb2-44c3-9842-644f08b743c0"})
	// const result = await handleStep4VaQuestions({ exam_id: "2e64bff5-2fb2-44c3-9842-644f08b743c0"})
	// const result = await handleStep5SelectAnswers({ exam_id: "2e64bff5-2fb2-44c3-9842-644f08b743c0"})
	// const result = await handleStep6RcRationales({ exam_id: "2e64bff5-2fb2-44c3-9842-644f08b743c0"})
	// const result = await handleStep7VaRationales({ exam_id: "2e64bff5-2fb2-44c3-9842-644f08b743c0"})
	const {data, error} = await supabase.functions.invoke("daily-content-init");
	if (error) {
		console.log("error ")
		console.log(error)
	}
	console.log(data)

	// console.log("\n📘 FINAL EXPLANATION:\n");
	// console.log(explanation);
}

main().catch((err) => {
	console.error("❌ Services crashed:", err);
	process.exit(1);
});