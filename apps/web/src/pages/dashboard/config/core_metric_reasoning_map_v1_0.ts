export const metricMappingJson = {
	"version": "v1.0",
	"generated_at": "05/01/2026",
	"mapping_philosophy": "ReasoningStep-driven, batch-processed, deterministic",
	"metrics": {
		"inference_accuracy": {
			"metric_key": "inference_accuracy",
			"reasoning_steps": [
				{
					"node_id": "b1a9eb29-76f8-528b-a165-ce27a2a1dea0",
					"label": "Make inferences from text",
					"justification": "This step directly measures the ability to draw conclusions from the text."
				},
				{
					"node_id": "ada398ac-fe85-5bad-83f7-121469a68484",
					"label": "Infer implications",
					"justification": "This step directly assesses the ability to draw conclusions from the text."
				},
				{
					"node_id": "1846cc92-395f-51e0-917a-50d17d855f75",
					"label": "Identify contradictions in claims",
					"justification": "This step evaluates the ability to recognize inconsistencies, which is crucial for inference accuracy."
				},
				{
					"node_id": "c1fe88b9-4a9b-5010-aea9-8e53ff7db559",
					"label": "Analyze authorial intent",
					"justification": "Understanding the author's intent is crucial for drawing accurate inferences."
				},
				{
					"node_id": "bc77172f-a88e-5730-8467-1e4d8b02db4c",
					"label": "Differentiate between implicit and explicit information",
					"justification": "This step is crucial for identifying unstated assumptions, which is a key aspect of inference accuracy."
				},
				{
					"node_id": "12eb0310-8601-541a-9874-ee78b3510e30",
					"label": "Identify implicit arguments",
					"justification": "This step directly assesses the ability to recognize unstated assumptions and implicit conclusions."
				}
			]
		},
		"argument_structure_analysis": {
			"metric_key": "argument_structure_analysis",
			"reasoning_steps": [
				{
					"node_id": "852eb0a6-df97-51c1-924a-a483cddb22a2",
					"label": "Evaluate argument structure",
					"justification": "This step focuses on analyzing the components of an argument, essential for this metric."
				},
				{
					"node_id": "20bbf2c4-66c6-5c7c-a335-a8933b0f10ed",
					"label": "Capture central thesis of argument",
					"justification": "This step is crucial for understanding the main argument and its structure."
				},
				{
					"node_id": "37b48cfc-05ce-5bc1-8105-b366ab9c7d7d",
					"label": "Identify counterarguments",
					"justification": "Identifying counterarguments is key to understanding the overall argument structure."
				},
				{
					"node_id": "b3d4ee0f-d355-5405-be1e-8ebe6d8f1c2f",
					"label": "Recognize supporting and non-supporting reasoning",
					"justification": "This step helps in identifying premises and conclusions, key components of argument structure."
				},
				{
					"node_id": "39dda624-da71-5a10-aaae-f8474a31dbd8",
					"label": "Establish logical connections between ideas",
					"justification": "This step is essential for analyzing logical dependencies within arguments."
				},
				{
					"node_id": "9c15bf7c-3471-50b1-8045-ea1fe346f1c8",
					"label": "Link cause and effect relationships",
					"justification": "This step helps in identifying premises and conclusions within arguments."
				}
			]
		},
		"trap_avoidance_rate": {
			"metric_key": "trap_avoidance_rate",
			"reasoning_steps": [
				{
					"node_id": "7d389d20-5aac-539f-b448-16291bb9f382",
					"label": "Eliminate irrelevant options",
					"justification": "This step assesses the ability to avoid traps by eliminating incorrect choices."
				},
				{
					"node_id": "a7cad292-86c2-50dc-94fc-27a1a9bd5c7d",
					"label": "Eliminate incorrect options",
					"justification": "This step is directly related to recognizing and avoiding common traps."
				},
				{
					"node_id": "8c0a8719-5140-5742-b2b6-3a1ed0c0e56a",
					"label": "Interpret logical fallacies",
					"justification": "This step helps in recognizing common traps in reasoning."
				},
				{
					"node_id": "e6d9c248-4696-5f5d-8ac0-ca6f8f949fd5",
					"label": "Identify contradictions in statements",
					"justification": "This step is important for avoiding traps that involve misleading statements."
				},
				{
					"node_id": "d6ce141b-2d07-55d1-83ac-91f8bcc0390e",
					"label": "Identify points of disagreement",
					"justification": "This step is crucial for recognizing common traps in reasoning."
				},
				{
					"node_id": "44a20af9-94d1-5e76-af69-7ac5191ca623",
					"label": "Distinguish between relevant and irrelevant information",
					"justification": "This step helps in recognizing traps by filtering out irrelevant options."
				}
			]
		},
		"elimination_effectiveness": {
			"metric_key": "elimination_effectiveness",
			"reasoning_steps": [
				{
					"node_id": "7d389d20-5aac-539f-b448-16291bb9f382",
					"label": "Eliminate irrelevant options",
					"justification": "This step measures the effectiveness of eliminating options that do not fit."
				},
				{
					"node_id": "a7cad292-86c2-50dc-94fc-27a1a9bd5c7d",
					"label": "Eliminate incorrect options",
					"justification": "This step is essential for evaluating the quality of eliminations."
				},
				{
					"node_id": "cbda3be5-9e58-5265-a935-5be6db4e3087",
					"label": "Evaluate options against passage content",
					"justification": "This step is essential for measuring how effectively incorrect options are eliminated."
				},
				{
					"node_id": "47ca49cc-d690-5546-86eb-03778c11a3c8",
					"label": "Identify supporting evidence",
					"justification": "This step is crucial for determining which options can be eliminated based on evidence."
				},
				{
					"node_id": "0f8d1468-2203-5209-858c-7d66f77a344e",
					"label": "Select based on logical flow",
					"justification": "This step is vital for effectively eliminating incorrect options."
				}
			]
		},
		"strategic_efficiency": {
			"metric_key": "strategic_efficiency",
			"reasoning_steps": [
				{
					"node_id": "a371f64c-7058-5d37-bf62-9ef660ba9d53",
					"label": "Analyze context for implications",
					"justification": "This step evaluates the strategic approach to understanding context."
				},
				{
					"node_id": "b8a0ca8d-1e12-5960-bee0-db2bd54dfc22",
					"label": "Recognize logical flow of ideas",
					"justification": "This step evaluates the sequencing of strategies applied."
				},
				{
					"node_id": "bb2430d7-9d45-503b-80d9-504795337b26",
					"label": "Evaluate argument strength",
					"justification": "This step assesses the effectiveness of strategies in argument evaluation."
				},
				{
					"node_id": "e294906f-70c8-5dd8-9c11-c9b2329ff532",
					"label": "Establish logical sequencing",
					"justification": "This step is crucial for evaluating the sequencing of strategies."
				},
				{
					"node_id": "1c79023a-e574-5004-a884-4c3d48796907",
					"label": "Identify main idea",
					"justification": "This step helps in aligning strategies with the main intent of the question."
				},
				{
					"node_id": "990476cd-5e7b-5dd7-ad98-093e9ec223fc",
					"label": "Evaluate tone and intent",
					"justification": "This step is important for aligning strategies with the intent of the question."
				}
			]
		},
		"detail_vs_structure_balance": {
			"metric_key": "detail_vs_structure_balance",
			"reasoning_steps": [
				{
					"node_id": "f378e9e1-cb82-50a9-8c87-dd845e11ee28",
					"label": "Distinguish main ideas from supporting details",
					"justification": "This step is crucial for balancing detail and structure."
				},
				{
					"node_id": "6a1798e7-ca9d-5446-b47d-2a4b73ae381f",
					"label": "Evaluate supporting details",
					"justification": "This step assesses the evaluation of details in relation to the main structure."
				},
				{
					"node_id": "3b8f968b-485b-5d4e-a5db-cb8338413422",
					"label": "Recognize supporting details",
					"justification": "This step assesses the ability to evaluate supporting details in relation to the main idea."
				},
				{
					"node_id": "96b5c5c1-10d8-55b1-9842-9ac3aff9cad2",
					"label": "Identify main idea or theme",
					"justification": "This step is essential for balancing attention between details and overall structure."
				},
				{
					"node_id": "61b66d21-c5e7-5164-bb52-f1ac733fec0e",
					"label": "Identify coherence and thematic continuity",
					"justification": "This step directly relates to maintaining a balance between local details and global structure."
				},
				{
					"node_id": "2b661003-4da2-5ec8-af1d-aae6a1b8965d",
					"label": "Ensure coherence in paragraph structure",
					"justification": "This step is essential for maintaining a balance between details and overall structure."
				}
			]
		},
		"tone_and_intent_sensitivity": {
			"metric_key": "tone_and_intent_sensitivity",
			"reasoning_steps": [
				{
					"node_id": "ecc04943-b864-549a-a339-db89327ed354",
					"label": "Identify author's intention",
					"justification": "This step is essential for understanding the author's tone and intent."
				},
				{
					"node_id": "2cefed95-463b-5435-8a1a-e0d62dcb5435",
					"label": "Analyze author's tone",
					"justification": "This step directly assesses sensitivity to tone."
				},
				{
					"node_id": "bf11528e-5c6b-5f8f-a86c-112169bcf5db",
					"label": "Interpret figurative language",
					"justification": "This step is important for understanding tone and intent."
				},
				{
					"node_id": "1aad401f-dfeb-5ee7-99f2-ab194514a9f3",
					"label": "Understand tone and attitude",
					"justification": "This step directly measures sensitivity to author tone and intent."
				},
				{
					"node_id": "29c20ec1-1304-5fa4-a75a-2535bec04729",
					"label": "Capture author's skepticism",
					"justification": "This step is specialized for understanding the author's tone and intent."
				},
				{
					"node_id": "f02ab272-d93f-5788-bdb7-b2579e22c009",
					"label": "Evaluate tone and intent",
					"justification": "This step directly measures sensitivity to author tone and intent."
				}
			]
		},
		"evidence_evaluation": {
			"metric_key": "evidence_evaluation",
			"reasoning_steps": [
				{
					"node_id": "cc340409-d917-58bd-9241-3ab3dd6d9b55",
					"label": "Interpret textual evidence",
					"justification": "This step is critical for assessing the strength of evidence."
				},
				{
					"node_id": "fed56f45-eaeb-50c5-bb5d-2dc6a15b61ee",
					"label": "Evaluate relevance of supporting evidence",
					"justification": "This step is essential for assessing the strength of evidence."
				},
				{
					"node_id": "28183523-02ae-5acc-8c97-03b0fe59e2d8",
					"label": "Evaluate truth values of claims",
					"justification": "This step assesses the strength of evidence supporting claims."
				},
				{
					"node_id": "6d65f381-5aa5-59c2-93e6-b3b15deba255",
					"label": "Analyze cause and effect relationships",
					"justification": "This step helps in evaluating the relevance and sufficiency of evidence."
				},
				{
					"node_id": "b6839b10-c300-5a86-ad8b-298efa998b12",
					"label": "Evaluate support for claims",
					"justification": "This step directly assesses the strength of evidence."
				},
				{
					"node_id": "a063c28b-aec3-5b91-b5ae-cbd9675a3406",
					"label": "Evaluate factual accuracy",
					"justification": "Evaluating factual accuracy is crucial for assessing the sufficiency of evidence."
				}
			]
		},
		"time_pressure_stability": {
			"metric_key": "time_pressure_stability",
			"reasoning_steps": [
				{
					"node_id": "3ad26ec8-8d0d-5fca-a203-1e01e6c59ea6",
					"label": "Identify contradictions",
					"justification": "This step assesses reasoning under pressure by identifying inconsistencies."
				},
				{
					"node_id": "b8a0ca8d-1e12-5960-bee0-db2bd54dfc22",
					"label": "Recognize logical flow of ideas",
					"justification": "This step assesses reasoning under time pressure."
				},
				{
					"node_id": "f43b0c7e-cd70-5497-8f71-39378d964243",
					"label": "Identify relevant information",
					"justification": "This step is important for maintaining accuracy under time pressure."
				},
				{
					"node_id": "fc823653-c35c-5175-84c9-996d1278c8b2",
					"label": "Summarize content accurately",
					"justification": "This step aids in quick comprehension, which is critical as time pressure increases."
				}
			]
		},
		"reading_speed_wpm": {
			"metric_key": "reading_speed_wpm",
			"reasoning_steps": []
		}
	}
}
