export function buildTeachingContext(theoryChunk: any, graphRelations: any[]) {
	console.log("🧩 [Assembly] Building teaching context");

	const context = {
		concept: theoryChunk.concept_title,
		definition: theoryChunk.content,
		example: theoryChunk.example_text,

		skills: graphRelations.filter((r) => r.type === "Skill"),
		strategies: graphRelations.filter((r) => r.type === "Strategy"),
		error_patterns: graphRelations.filter((r) => r.type === "ErrorPattern"),
		reasoning_steps: graphRelations.filter((r) => r.type === "ReasoningStep"),
	};

	console.log("✅ [Assembly] Teaching context ready:", {
		skills: context.skills.length,
		strategies: context.strategies.length,
		errors: context.error_patterns.length,
		steps: context.reasoning_steps.length,
	});

	return context;
}
