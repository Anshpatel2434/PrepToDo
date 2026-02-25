/**
 * =============================================================================
 * FUTURE SCOPES — Intelligent Reasoning System Integration Points
 * =============================================================================
 *
 * This document lists planned integration points where the Factory's offline
 * enrichment pipeline (ReasoningStep extraction, ErrorPattern edges, graph-driven
 * reasoning) will be woven into runtime content generation.
 *
 * These are NOT yet implemented. They are listed here for architectural continuity
 * so future development phases can reference them.
 *
 * =============================================================================
 */

# Future Integration Points

## 1. Graph-Enhanced Rationale Generation (Phase 3)

**Current State:** `generateBatchRCRationales.ts` and `generateBatchVARationales.ts` use
`ReasoningGraphContext` (nodes + edges) as a hidden rubric for rationale generation.

**Future Enhancement:** Once `extractReasoningSummaries.ts` populates new `ReasoningStep` nodes,
the rationale generator will also receive abstract reasoning patterns from *previously generated
high-quality rationales*. This creates a self-improving cycle:

```
Generated Rationale → extractReasoningSummaries → ReasoningStep node → graph edge
    ↓                                                                        ↓
Next rationale generation ← buildTeachingContext ← expandConceptGraph ← reasoning context
```

**Integration File:** `workers/daily-content/retrieval/rcQuestionsHandling/generateBatchRCRationales.ts`
**Change Required:** Extend the `REASONING GRAPH` block in the prompt to include new `ReasoningStep`
nodes alongside `ReasoningStep` nodes.

---

## 2. AI Insights with Reasoning Context (Phase 3)

**Current State:** `generateSingleInsight.ts` generates AI insights for individual question attempts
using the analytics pipeline (phases A-F) output.

**Future Enhancement:** When generating AI insights, inject the relevant `ErrorPattern` edges
from the graph. If a student consistently fails questions tagged with `inference_accuracy`, the
insight should reference the specific `ErrorPattern` nodes (e.g., "Scope Trap", "Over-generalization")
that are linked via `misleads_into` edges to the `ReasoningStep` nodes.

**Integration File:** `workers/analytics/generateSingleInsight.ts`
**Change Required:** Query `graph_edges` for `ErrorPattern --misleads_into--> ReasoningStep` edges
where the ReasoningStep maps to the student's weak `metric_keys`. Include these in the insight prompt.

---

## 3. Forum Persona Concept Teaching (Phase 4)

**Current State:** `teaching-concept/runConceptTeaching.ts` uses vector similarity to find theory
chunks, expands the concept graph, and generates a narrative explanation.

**Future Enhancement:** The Teaching pipeline will be used for the Forum Persona system:
- AI tutor personas will use `buildTeachingContext` to explain concepts in thread replies
- Each persona's `mood_variable` (from the Forum Architecture doc) will modulate the Teacher's
  output tone (e.g., a frustrated persona emphasizes common errors via ErrorPattern edges)
- The `S-I-O` (Setup-Instruction-Output) framework will structure every persona response

**Integration File:** `ai-orchestration/teaching-concept/synthesis/narrateConcept.ts`
**Change Required:** Add persona configuration parameter with mood/style modifiers.

---

## 4. Adaptive Difficulty via Graph Density (Phase 4)

**Current State:** `phaseB_computeProficiencyMetrics.ts` computes user proficiency scores.
`recommended_difficulty` is a simple string in `user_proficiency_signals`.

**Future Enhancement:** Use graph edge density as a signal for adaptive difficulty:
- Count how many `ReasoningStep` nodes a student has mastered (via successful attempts on
  questions tagged with those steps)
- If a student has strong edges to all `ReasoningStep` nodes for a metric, increase difficulty
- If `ErrorPattern --avoids--> ReasoningStep` edges exist for the student's weak areas,
  surface those specific patterns in easier questions first

**Integration File:** `workers/analytics/phases/phaseD_updateProficiency.ts`
**Change Required:** Query graph edges during proficiency calculation to weight difficulty.

---

## 5. Content Gap Detection (Phase 4)

**Current State:** The article ingestion pipeline fetches articles by genre.
Genre selection uses cooldown-based rotation in `fetchGenreForToday()`.

**Future Enhancement:** Use orphaned `graph_nodes` (nodes with zero incoming edges) to detect
content gaps. If a `ReasoningStep` node has no extracted enrichment linked to it, that reasoning
skill has never been effectively taught through rationales. The content pipeline should
prioritize generating questions that exercise those orphaned reasoning steps.

**Integration File:** `workers/daily-content/retrieval/fetchGenre.ts`
**Change Required:** Query orphaned nodes alongside genre cooldown to influence topic selection.
`;

<parameter name="Complexity">5
