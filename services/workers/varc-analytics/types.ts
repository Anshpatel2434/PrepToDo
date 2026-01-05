// VARC Analytics - Type Definitions

export interface AttemptDatum {
  attempt_id: string;
  question_id: string;
  passage_id: string | null;

  question_type: string;
  genre: string | null;

  correct: boolean;
  time_spent_seconds: number;
  confidence_level: number | null;

  eliminated_options: string[] | null;

  // Critical: reasoning step node IDs from question.tags
  reasoning_node_ids: string[];

  // For LLM diagnostics (Phase C)
  user_answer: any;
  question_text?: string;
  options?: any;
  correct_answer?: any;
}

export interface DimensionStats {
  attempts: number;
  correct: number;
  accuracy: number;
  avg_time: number;
  score_0_100: number;
}

export interface SurfaceStats {
  core_metric: Map<string, DimensionStats>;
  genre: Map<string, DimensionStats>;
  question_type: Map<string, DimensionStats>;
  reasoning_step: Map<string, DimensionStats>;
}

export interface MetricMapping {
  metricToNodes: Map<string, Set<string>>;
  nodeToMetrics: Map<string, Set<string>>;
}

export interface DiagnosticResult {
  attempt_id: string;
  dominant_reasoning_failures: Array<{
    reasoning_node_id: string;
    failure_description: string;
  }>;
  error_pattern_keys: string[];
  trap_analysis?: string;
}

export interface DiagnosticsOutput {
  diagnostics: DiagnosticResult[];
}

export interface PhaseAResult {
  alreadyAnalysed: boolean;
  session: any;
  dataset: AttemptDatum[];
  sessionMetadata?: {
    session_id: string;
    user_id: string;
    completed_at: string;
    session_type: string;
  };
}

export interface AnalyticsResult {
  success: boolean;
  session_id?: string;
  user_id?: string;
  stats?: {
    total_attempts: number;
    correct_attempts: number;
    dimensions_updated: {
      core_metrics: number;
      genres: number;
      question_types: number;
    };
  };
  message?: string;
}
