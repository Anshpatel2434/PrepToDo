CREATE SCHEMA "public";
CREATE SCHEMA "auth";
CREATE SCHEMA "drizzle";
CREATE TYPE "auth"."aal_level" AS ENUM('aal1', 'aal2', 'aal3');
CREATE TYPE "auth"."code_challenge_method" AS ENUM('s256', 'plain');
CREATE TYPE "auth"."factor_status" AS ENUM('unverified', 'verified');
CREATE TYPE "auth"."factor_type" AS ENUM('totp', 'webauthn', 'phone');
CREATE TYPE "auth"."oauth_authorization_status" AS ENUM('pending', 'approved', 'denied', 'expired');
CREATE TYPE "auth"."oauth_client_type" AS ENUM('public', 'confidential');
CREATE TYPE "auth"."oauth_registration_type" AS ENUM('dynamic', 'manual');
CREATE TYPE "auth"."oauth_response_type" AS ENUM('code');
CREATE TYPE "auth"."one_time_token_type" AS ENUM('confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token');
CREATE TABLE "admin_ai_cost_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"worker_type" text NOT NULL,
	"function_name" text NOT NULL,
	"model_name" text DEFAULT 'gpt-4o-mini' NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric(14, 9) DEFAULT '0' NOT NULL,
	"user_id" uuid,
	"exam_id" uuid,
	"session_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "admin_platform_metrics_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"date" date NOT NULL CONSTRAINT "admin_platform_metrics_daily_date_key" UNIQUE,
	"total_users" integer DEFAULT 0,
	"new_users_today" integer DEFAULT 0,
	"active_users_today" integer DEFAULT 0,
	"total_sessions" integer DEFAULT 0,
	"sessions_today" integer DEFAULT 0,
	"total_questions_attempted" integer DEFAULT 0,
	"questions_attempted_today" integer DEFAULT 0,
	"total_passages_generated" integer DEFAULT 0,
	"passages_generated_today" integer DEFAULT 0,
	"total_exams_generated" integer DEFAULT 0,
	"exams_generated_today" integer DEFAULT 0,
	"ai_cost_today_usd" numeric(14, 9) DEFAULT '0',
	"ai_cost_cumulative_usd" numeric(14, 9) DEFAULT '0',
	"avg_session_duration_seconds" integer DEFAULT 0,
	"avg_accuracy_percentage" numeric(5, 2),
	"revenue_today_cents" integer DEFAULT 0,
	"revenue_cumulative_cents" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "admin_user_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" text,
	"url" text NOT NULL CONSTRAINT "articles_url_key" UNIQUE,
	"source_name" text,
	"author" text,
	"published_at" date,
	"genre" text NOT NULL,
	"topic_tags" text[],
	"used_in_daily" boolean DEFAULT false,
	"used_in_custom_exam" boolean DEFAULT false,
	"daily_usage_count" integer DEFAULT 0,
	"custom_exam_usage_count" integer DEFAULT 0,
	"last_used_at" timestamp with time zone,
	"semantic_hash" text,
	"extraction_model" text,
	"extraction_version" text,
	"is_safe_source" boolean DEFAULT true,
	"is_archived" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"semantic_ideas_and_persona" jsonb
);
CREATE TABLE "auth_password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "auth_pending_signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" varchar(255) NOT NULL,
	"otp_hash" varchar(255) NOT NULL,
	"attempts" varchar(10) DEFAULT '0',
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"otp_send_count" integer DEFAULT 1,
	"banned_until" timestamp with time zone
);
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"refresh_token_hash" varchar(255) NOT NULL,
	"user_agent" text,
	"ip" varchar(45),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "core_metrics" (
	"key" text PRIMARY KEY,
	"description" text NOT NULL,
	"version" text DEFAULT 'v1.0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"mapping_logic" text NOT NULL
);
CREATE TABLE "embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"embedding" vector(1536) NOT NULL,
	"embedding_model" text DEFAULT 'text-embedding-3-small',
	"theory_id" uuid,
	"passage_id" uuid,
	"question_id" uuid,
	"content_preview" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "one_target_only" CHECK (CHECK ((((((theory_id IS NOT NULL))::integer + ((passage_id IS NOT NULL))::integer) + ((question_id IS NOT NULL))::integer) = 1)))
);
CREATE TABLE "exam_generation_state" (
	"exam_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"status" text NOT NULL,
	"current_step" integer DEFAULT 1,
	"total_steps" integer DEFAULT 7,
	"articles_data" jsonb,
	"passages_ids" text[],
	"rc_question_ids" text[],
	"va_question_ids" text[],
	"reference_passages_content" text[],
	"reference_data_rc" jsonb,
	"reference_data_va" jsonb,
	"user_id" uuid,
	"params" jsonb NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"genre" text,
	CONSTRAINT "exam_generation_state_status_check" CHECK (CHECK ((status = ANY (ARRAY['initializing'::text, 'generating_passages'::text, 'generating_rc_questions'::text, 'generating_va_questions'::text, 'selecting_answers'::text, 'generating_rc_rationales'::text, 'generating_va_rationales'::text, 'completed'::text, 'failed'::text]))))
);
CREATE TABLE "exam_papers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"year" integer,
	"exam_type" text DEFAULT 'CAT',
	"slot" text,
	"is_official" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"used_articles_id" uuid[],
	"generated_by_user_id" uuid,
	"time_limit_minutes" integer,
	"generation_status" text DEFAULT 'completed',
	"updated_at" timestamp with time zone,
	CONSTRAINT "exam_papers_generation_status_check" CHECK (CHECK ((generation_status = ANY (ARRAY['initializing'::text, 'generating'::text, 'completed'::text, 'failed'::text]))))
);
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL CONSTRAINT "genres_name_key" UNIQUE,
	"description" text,
	"daily_usage_count" integer DEFAULT 0,
	"custom_exam_usage_count" integer DEFAULT 0,
	"total_usage_count" integer GENERATED ALWAYS AS ((daily_usage_count + custom_exam_usage_count)) STORED,
	"last_used_daily_at" timestamp with time zone,
	"last_used_custom_exam_at" timestamp with time zone,
	"cooldown_days" integer DEFAULT 2,
	"avg_difficulty_score" numeric,
	"preferred_question_types" text[],
	"is_active" boolean DEFAULT true,
	"is_high_priority" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "graph_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"source_node_id" uuid,
	"target_node_id" uuid,
	"relationship" text
);
CREATE TABLE "graph_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"label" text CONSTRAINT "graph_nodes_label_key" UNIQUE,
	"type" text
);
CREATE TABLE "passages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" varchar(200),
	"content" text NOT NULL,
	"word_count" integer NOT NULL,
	"genre" varchar(50) NOT NULL,
	"difficulty" varchar(20) NOT NULL,
	"source" varchar(100),
	"generation_model" varchar(50),
	"generation_prompt_version" varchar(20),
	"generation_cost_usd" numeric(14, 9),
	"quality_score" numeric(3, 2),
	"times_used" integer DEFAULT 0,
	"avg_completion_time_seconds" integer,
	"avg_accuracy" numeric(5, 2),
	"is_daily_pick" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"paper_id" uuid,
	"article_id" uuid,
	CONSTRAINT "passages_difficulty_check" CHECK (CHECK (((difficulty)::text = ANY (ARRAY[('easy'::character varying)::text, ('medium'::character varying)::text, ('hard'::character varying)::text]))))
);
CREATE TABLE "practice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"session_type" varchar(30) NOT NULL,
	"mode" varchar(20),
	"passage_ids" uuid[],
	"question_ids" uuid[],
	"target_difficulty" varchar(20),
	"target_genres" text[],
	"target_question_types" text[],
	"time_limit_seconds" integer,
	"time_spent_seconds" integer DEFAULT 0,
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"paused_at" timestamp with time zone,
	"pause_duration_seconds" integer DEFAULT 0,
	"total_questions" integer DEFAULT 0,
	"correct_answers" integer DEFAULT 0,
	"score_percentage" numeric(5, 2),
	"points_earned" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'in_progress',
	"current_question_index" integer DEFAULT 0,
	"session_data" jsonb,
	"is_group_session" boolean DEFAULT false,
	"group_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"paper_id" uuid,
	"is_analysed" boolean DEFAULT false,
	"analytics" jsonb,
	CONSTRAINT "practice_sessions_mode_check" CHECK (CHECK (((mode)::text = ANY (ARRAY[('tutor'::character varying)::text, ('test'::character varying)::text, ('adaptive'::character varying)::text])))),
	CONSTRAINT "practice_sessions_session_type_check" CHECK (CHECK (((session_type)::text = ANY (ARRAY[('practice'::character varying)::text, ('timed_test'::character varying)::text, ('daily_challenge_rc'::character varying)::text, ('daily_challenge_va'::character varying)::text, ('mock_exam'::character varying)::text, ('vocab_review'::character varying)::text, ('microlearning'::character varying)::text, ('drill'::character varying)::text, ('group_practice'::character varying)::text])))),
	CONSTRAINT "practice_sessions_status_check" CHECK (CHECK (((status)::text = ANY (ARRAY[('in_progress'::character varying)::text, ('completed'::character varying)::text, ('abandoned'::character varying)::text, ('paused'::character varying)::text]))))
);
ALTER TABLE "practice_sessions" ENABLE ROW LEVEL SECURITY;
CREATE TABLE "question_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL UNIQUE,
	"session_id" uuid NOT NULL UNIQUE,
	"question_id" uuid NOT NULL UNIQUE,
	"passage_id" uuid,
	"user_answer" jsonb,
	"is_correct" boolean NOT NULL,
	"time_spent_seconds" integer NOT NULL,
	"confidence_level" integer,
	"marked_for_review" boolean DEFAULT false,
	"eliminated_options" text[],
	"hint_used" boolean DEFAULT false,
	"hints_viewed" integer DEFAULT 0,
	"rationale_viewed" boolean DEFAULT false,
	"rationale_helpful" boolean,
	"user_notes" text,
	"ai_grading_score" numeric(5, 2),
	"ai_feedback" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_user_session_question" UNIQUE("user_id","session_id","question_id"),
	CONSTRAINT "question_attempts_confidence_level_check" CHECK (CHECK (((confidence_level >= 1) AND (confidence_level <= 5))))
);
ALTER TABLE "question_attempts" ENABLE ROW LEVEL SECURITY;
CREATE TABLE "question_types" (
	"key" text PRIMARY KEY,
	"description" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"passage_id" uuid,
	"question_text" text NOT NULL,
	"question_type" varchar(30) NOT NULL,
	"options" jsonb,
	"correct_answer" jsonb NOT NULL,
	"jumbled_sentences" jsonb,
	"rationale" text NOT NULL,
	"rationale_model" varchar(50),
	"hints" jsonb,
	"difficulty" varchar(20),
	"tags" text[],
	"quality_score" numeric(3, 2),
	"times_answered" integer DEFAULT 0,
	"times_correct" integer DEFAULT 0,
	"avg_time_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"paper_id" uuid,
	CONSTRAINT "questions_difficulty_check" CHECK (CHECK (((difficulty)::text = ANY (ARRAY[('easy'::character varying)::text, ('medium'::character varying)::text, ('hard'::character varying)::text, ('expert'::character varying)::text])))),
	CONSTRAINT "questions_question_type_check" CHECK (CHECK (((question_type)::text = ANY (ARRAY[('rc_question'::character varying)::text, ('true_false'::character varying)::text, ('inference'::character varying)::text, ('tone'::character varying)::text, ('purpose'::character varying)::text, ('detail'::character varying)::text, ('para_jumble'::character varying)::text, ('para_summary'::character varying)::text, ('para_completion'::character varying)::text, ('critical_reasoning'::character varying)::text, ('vocab_in_context'::character varying)::text, ('odd_one_out'::character varying)::text]))))
);
CREATE TABLE "theory_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"topic" text NOT NULL,
	"sub_topic" text NOT NULL,
	"concept_title" text NOT NULL,
	"content" text NOT NULL,
	"source_pdf" text,
	"page_number" integer,
	"example_text" text,
	"created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "user_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL CONSTRAINT "user_analytics_user_id_key" UNIQUE,
	"minutes_practiced" integer DEFAULT 0,
	"questions_attempted" integer DEFAULT 0,
	"questions_correct" integer DEFAULT 0,
	"accuracy_percentage" numeric(5, 2),
	"is_active_day" boolean DEFAULT false,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"points_earned_today" integer DEFAULT 0,
	"total_points" integer DEFAULT 0,
	"genre_performance" jsonb,
	"difficulty_performance" jsonb,
	"question_type_performance" jsonb,
	"new_words_learned" integer DEFAULT 0,
	"words_reviewed" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"last_active_date" date
);
ALTER TABLE "user_analytics" ENABLE ROW LEVEL SECURITY;
CREATE TABLE "user_metric_proficiency" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL UNIQUE,
	"dimension_type" text NOT NULL UNIQUE,
	"dimension_key" text NOT NULL UNIQUE,
	"proficiency_score" integer NOT NULL,
	"confidence_score" numeric NOT NULL,
	"total_attempts" integer DEFAULT 0 NOT NULL,
	"correct_attempts" integer DEFAULT 0 NOT NULL,
	"last_session_id" uuid,
	"trend" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"speed_vs_accuracy_data" jsonb,
	CONSTRAINT "user_metric_proficiency_unique" UNIQUE("user_id","dimension_type","dimension_key"),
	CONSTRAINT "user_metric_proficiency_confidence_score_check" CHECK (CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric)))),
	CONSTRAINT "user_metric_proficiency_dimension_type_check" CHECK (CHECK ((dimension_type = ANY (ARRAY['core_metric'::text, 'genre'::text, 'question_type'::text, 'reasoning_step'::text, 'error_pattern'::text, 'difficulty'::text])))),
	CONSTRAINT "user_metric_proficiency_proficiency_score_check" CHECK (CHECK (((proficiency_score >= 0) AND (proficiency_score <= 100)))),
	CONSTRAINT "user_metric_proficiency_trend_check" CHECK (CHECK ((trend = ANY (ARRAY['improving'::text, 'declining'::text, 'stagnant'::text]))))
);
CREATE TABLE "user_proficiency_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL CONSTRAINT "user_proficiency_signals_user_id_key" UNIQUE,
	"overall_percentile" integer,
	"estimated_cat_percentile" integer,
	"genre_strengths" jsonb,
	"inference_skill" integer,
	"tone_analysis_skill" integer,
	"main_idea_skill" integer,
	"detail_comprehension_skill" integer,
	"recommended_difficulty" varchar(20),
	"weak_topics" text[],
	"weak_question_types" text[],
	"calculated_at" timestamp with time zone DEFAULT now(),
	"data_points_count" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_proficiency_signals_detail_comprehension_skill_check" CHECK (CHECK (((detail_comprehension_skill >= 0) AND (detail_comprehension_skill <= 100)))),
	CONSTRAINT "user_proficiency_signals_estimated_cat_percentile_check" CHECK (CHECK (((estimated_cat_percentile >= 0) AND (estimated_cat_percentile <= 100)))),
	CONSTRAINT "user_proficiency_signals_inference_skill_check" CHECK (CHECK (((inference_skill >= 0) AND (inference_skill <= 100)))),
	CONSTRAINT "user_proficiency_signals_main_idea_skill_check" CHECK (CHECK (((main_idea_skill >= 0) AND (main_idea_skill <= 100)))),
	CONSTRAINT "user_proficiency_signals_overall_percentile_check" CHECK (CHECK (((overall_percentile >= 0) AND (overall_percentile <= 100)))),
	CONSTRAINT "user_proficiency_signals_tone_analysis_skill_check" CHECK (CHECK (((tone_analysis_skill >= 0) AND (tone_analysis_skill <= 100))))
);
ALTER TABLE "user_proficiency_signals" ENABLE ROW LEVEL SECURITY;
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY,
	"username" varchar(50) NOT NULL CONSTRAINT "user_profiles_username_key" UNIQUE,
	"display_name" varchar(100),
	"avatar_url" text,
	"subscription_tier" varchar(20) DEFAULT 'free',
	"subscription_expires_at" timestamp with time zone,
	"daily_goal_minutes" integer DEFAULT 30,
	"preferred_difficulty" varchar(20) DEFAULT 'medium',
	"theme" varchar(20) DEFAULT 'light',
	"data_consent_given" boolean DEFAULT false,
	"show_on_leaderboard" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"last_active_at" timestamp with time zone DEFAULT now(),
	"email" text CONSTRAINT "user_profiles_email_key" UNIQUE,
	CONSTRAINT "user_profiles_preferred_difficulty_check" CHECK (CHECK (((preferred_difficulty)::text = ANY (ARRAY[('easy'::character varying)::text, ('medium'::character varying)::text, ('hard'::character varying)::text, ('adaptive'::character varying)::text])))),
	CONSTRAINT "user_profiles_subscription_tier_check" CHECK (CHECK (((subscription_tier)::text = ANY (ARRAY[('free'::character varying)::text, ('pro'::character varying)::text, ('premium'::character varying)::text])))),
	CONSTRAINT "user_profiles_theme_check" CHECK (CHECK (((theme)::text = ANY (ARRAY[('light'::character varying)::text, ('dark'::character varying)::text, ('auto'::character varying)::text]))))
);
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" varchar(255) NOT NULL CONSTRAINT "users_email_key" UNIQUE,
	"encrypted_password" varchar(255),
	"email_confirmed_at" timestamp with time zone,
	"last_sign_in_at" timestamp with time zone,
	"provider" varchar(50) DEFAULT 'email',
	"google_id" varchar(255),
	"raw_app_meta_data" text,
	"raw_user_meta_data" text,
	"is_sso_user" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"role" varchar(20) DEFAULT 'user',
	"ai_insights_remaining" integer DEFAULT 20,
	"customized_mocks_remaining" integer DEFAULT 2
);
CREATE TABLE "drizzle"."__drizzle_migrations" (
	"id" serial PRIMARY KEY,
	"hash" text NOT NULL,
	"created_at" bigint
);
ALTER TABLE "admin_ai_cost_log" ADD CONSTRAINT "admin_ai_cost_log_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exam_papers"("id") ON DELETE SET NULL;
ALTER TABLE "admin_ai_cost_log" ADD CONSTRAINT "admin_ai_cost_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "practice_sessions"("id") ON DELETE SET NULL;
ALTER TABLE "admin_ai_cost_log" ADD CONSTRAINT "admin_ai_cost_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "admin_user_activity_log" ADD CONSTRAINT "admin_user_activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "auth_password_reset_tokens" ADD CONSTRAINT "auth_password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "passages"("id") ON DELETE CASCADE;
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE;
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_theory_id_fkey" FOREIGN KEY ("theory_id") REFERENCES "theory_chunks"("id") ON DELETE CASCADE;
ALTER TABLE "exam_generation_state" ADD CONSTRAINT "exam_generation_state_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exam_papers"("id") ON DELETE CASCADE;
ALTER TABLE "exam_generation_state" ADD CONSTRAINT "exam_generation_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "exam_papers" ADD CONSTRAINT "exam_papers_generated_by_user_id_fkey" FOREIGN KEY ("generated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_source_node_id_fkey" FOREIGN KEY ("source_node_id") REFERENCES "graph_nodes"("id");
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_target_node_id_fkey" FOREIGN KEY ("target_node_id") REFERENCES "graph_nodes"("id");
ALTER TABLE "passages" ADD CONSTRAINT "passages_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id");
ALTER TABLE "passages" ADD CONSTRAINT "passages_paper_id_fkey" FOREIGN KEY ("paper_id") REFERENCES "exam_papers"("id") ON DELETE CASCADE;
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_paper_id_fkey" FOREIGN KEY ("paper_id") REFERENCES "exam_papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "passages"("id") ON DELETE CASCADE;
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE;
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "practice_sessions"("id") ON DELETE CASCADE;
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_paper_id_fkey" FOREIGN KEY ("paper_id") REFERENCES "exam_papers"("id") ON DELETE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "passages"("id") ON DELETE CASCADE;
ALTER TABLE "user_analytics" ADD CONSTRAINT "user_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_metric_proficiency" ADD CONSTRAINT "user_metric_proficiency_user_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE;
ALTER TABLE "user_metric_proficiency" ADD CONSTRAINT "user_metric_proficiency_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_proficiency_signals" ADD CONSTRAINT "user_proficiency_signals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE;
CREATE UNIQUE INDEX "admin_ai_cost_log_pkey" ON "admin_ai_cost_log" ("id");
CREATE INDEX "idx_cost_log_created" ON "admin_ai_cost_log" ("created_at");
CREATE INDEX "idx_cost_log_model" ON "admin_ai_cost_log" ("model_name");
CREATE INDEX "idx_cost_log_user" ON "admin_ai_cost_log" ("user_id");
CREATE INDEX "idx_cost_log_worker" ON "admin_ai_cost_log" ("worker_type");
CREATE UNIQUE INDEX "admin_platform_metrics_daily_date_key" ON "admin_platform_metrics_daily" ("date");
CREATE UNIQUE INDEX "admin_platform_metrics_daily_pkey" ON "admin_platform_metrics_daily" ("id");
CREATE INDEX "idx_platform_metrics_date" ON "admin_platform_metrics_daily" ("date");
CREATE UNIQUE INDEX "admin_user_activity_log_pkey" ON "admin_user_activity_log" ("id");
CREATE INDEX "idx_activity_created" ON "admin_user_activity_log" ("created_at");
CREATE INDEX "idx_activity_type" ON "admin_user_activity_log" ("event_type");
CREATE INDEX "idx_activity_user" ON "admin_user_activity_log" ("user_id");
CREATE UNIQUE INDEX "articles_pkey" ON "articles" ("id");
CREATE UNIQUE INDEX "articles_url_key" ON "articles" ("url");
CREATE INDEX "idx_articles_genre" ON "articles" ("genre");
CREATE INDEX "idx_articles_used_custom" ON "articles" ("used_in_custom_exam");
CREATE INDEX "idx_articles_used_daily" ON "articles" ("used_in_daily");
CREATE UNIQUE INDEX "auth_password_reset_tokens_pkey" ON "auth_password_reset_tokens" ("id");
CREATE UNIQUE INDEX "auth_pending_signups_pkey" ON "auth_pending_signups" ("id");
CREATE INDEX "idx_auth_pending_signups_banned_until" ON "auth_pending_signups" ("banned_until");
CREATE INDEX "idx_auth_pending_signups_email" ON "auth_pending_signups" ("email");
CREATE UNIQUE INDEX "auth_sessions_pkey" ON "auth_sessions" ("id");
CREATE UNIQUE INDEX "core_metrics_pkey" ON "core_metrics" ("key");
CREATE INDEX "embeddings_embedding_idx" ON "embeddings" USING hnsw ("embedding");
CREATE INDEX "embeddings_passage_id_idx" ON "embeddings" ("passage_id");
CREATE UNIQUE INDEX "embeddings_pkey" ON "embeddings" ("id");
CREATE INDEX "embeddings_question_id_idx" ON "embeddings" ("question_id");
CREATE INDEX "embeddings_theory_id_idx" ON "embeddings" ("theory_id");
CREATE UNIQUE INDEX "exam_generation_state_pkey" ON "exam_generation_state" ("exam_id");
CREATE INDEX "idx_exam_generation_state_created_at" ON "exam_generation_state" ("created_at");
CREATE INDEX "idx_exam_generation_state_status" ON "exam_generation_state" ("status");
CREATE INDEX "idx_exam_generation_state_user_id" ON "exam_generation_state" ("user_id");
CREATE UNIQUE INDEX "exam_papers_pkey" ON "exam_papers" ("id");
CREATE UNIQUE INDEX "genres_name_key" ON "genres" ("name");
CREATE UNIQUE INDEX "genres_pkey" ON "genres" ("id");
CREATE INDEX "idx_genres_active" ON "genres" ("is_active");
CREATE INDEX "idx_genres_last_used_daily" ON "genres" ("last_used_daily_at");
CREATE UNIQUE INDEX "graph_edges_pkey" ON "graph_edges" ("id");
CREATE INDEX "graph_edges_relationship_idx" ON "graph_edges" ("relationship");
CREATE INDEX "graph_edges_source_idx" ON "graph_edges" ("source_node_id");
CREATE INDEX "graph_edges_target_idx" ON "graph_edges" ("target_node_id");
CREATE UNIQUE INDEX "graph_nodes_label_key" ON "graph_nodes" ("label");
CREATE UNIQUE INDEX "graph_nodes_pkey" ON "graph_nodes" ("id");
CREATE INDEX "graph_nodes_type_idx" ON "graph_nodes" ("type");
CREATE INDEX "idx_passages_daily_pick" ON "passages" ("is_daily_pick","created_at");
CREATE INDEX "idx_passages_difficulty" ON "passages" ("difficulty");
CREATE INDEX "idx_passages_genre" ON "passages" ("genre");
CREATE INDEX "idx_passages_times_used" ON "passages" ("times_used");
CREATE INDEX "passages_paper_id_idx" ON "passages" ("paper_id");
CREATE UNIQUE INDEX "passages_pkey" ON "passages" ("id");
CREATE INDEX "idx_practice_sessions_completed" ON "practice_sessions" ("user_id","completed_at");
CREATE INDEX "idx_practice_sessions_status" ON "practice_sessions" ("user_id","status");
CREATE INDEX "idx_practice_sessions_type" ON "practice_sessions" ("session_type","created_at");
CREATE INDEX "idx_practice_sessions_user" ON "practice_sessions" ("user_id");
CREATE UNIQUE INDEX "practice_sessions_pkey" ON "practice_sessions" ("id");
CREATE INDEX "idx_attempts_correctness" ON "question_attempts" ("user_id","is_correct","created_at");
CREATE INDEX "idx_attempts_question" ON "question_attempts" ("question_id");
CREATE INDEX "idx_attempts_session" ON "question_attempts" ("session_id");
CREATE INDEX "idx_attempts_user" ON "question_attempts" ("user_id");
CREATE UNIQUE INDEX "question_attempts_pkey" ON "question_attempts" ("id");
CREATE UNIQUE INDEX "unique_user_session_question" ON "question_attempts" ("user_id","session_id","question_id");
CREATE UNIQUE INDEX "question_types_pkey" ON "question_types" ("key");
CREATE INDEX "idx_questions_difficulty" ON "questions" ("difficulty");
CREATE INDEX "idx_questions_passage" ON "questions" ("passage_id");
CREATE INDEX "idx_questions_tags" ON "questions" USING gin ("tags");
CREATE INDEX "idx_questions_type" ON "questions" ("question_type");
CREATE INDEX "questions_passage_id_idx" ON "questions" ("passage_id");
CREATE UNIQUE INDEX "questions_pkey" ON "questions" ("id");
CREATE INDEX "questions_question_type_idx" ON "questions" ("question_type");
CREATE UNIQUE INDEX "theory_chunks_pkey" ON "theory_chunks" ("id");
CREATE INDEX "theory_chunks_sub_topic_idx" ON "theory_chunks" ("sub_topic");
CREATE INDEX "theory_chunks_topic_idx" ON "theory_chunks" ("topic");
CREATE UNIQUE INDEX "user_analytics_pkey" ON "user_analytics" ("id");
CREATE UNIQUE INDEX "user_analytics_user_id_key" ON "user_analytics" ("user_id");
CREATE INDEX "idx_metric_dimension" ON "user_metric_proficiency" ("dimension_type","dimension_key");
CREATE INDEX "idx_metric_user" ON "user_metric_proficiency" ("user_id");
CREATE UNIQUE INDEX "user_metric_proficiency_pkey" ON "user_metric_proficiency" ("id");
CREATE UNIQUE INDEX "user_metric_proficiency_unique" ON "user_metric_proficiency" ("user_id","dimension_type","dimension_key");
CREATE INDEX "idx_proficiency_user" ON "user_proficiency_signals" ("user_id");
CREATE UNIQUE INDEX "user_proficiency_signals_pkey" ON "user_proficiency_signals" ("id");
CREATE UNIQUE INDEX "user_proficiency_signals_user_id_key" ON "user_proficiency_signals" ("user_id");
CREATE INDEX "idx_user_profiles_subscription" ON "user_profiles" ("subscription_tier","subscription_expires_at");
CREATE INDEX "idx_user_profiles_username" ON "user_profiles" ("username");
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles" ("email");
CREATE UNIQUE INDEX "user_profiles_pkey" ON "user_profiles" ("id");
CREATE UNIQUE INDEX "user_profiles_username_key" ON "user_profiles" ("username");
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");
CREATE UNIQUE INDEX "users_pkey" ON "users" ("id");
CREATE UNIQUE INDEX "__drizzle_migrations_pkey" ON "drizzle"."__drizzle_migrations" ("id");