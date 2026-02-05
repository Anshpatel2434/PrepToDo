CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"url" text NOT NULL,
	"source_name" text,
	"author" text,
	"published_at" timestamp,
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
	"semantic_ideas_and_persona" text,
	CONSTRAINT "articles_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "auth_password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "auth_pending_signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"otp_hash" varchar(255) NOT NULL,
	"attempts" varchar(10) DEFAULT '0',
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" varchar(255) NOT NULL,
	"user_agent" text,
	"ip" varchar(45),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
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
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "core_metrics" (
	"key" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"version" text DEFAULT 'v1.0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"mapping_logic" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_papers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"daily_usage_count" integer DEFAULT 0,
	"custom_exam_usage_count" integer DEFAULT 0,
	"last_used_daily_at" timestamp with time zone,
	"last_used_custom_exam_at" timestamp with time zone,
	"cooldown_days" integer DEFAULT 2,
	"avg_difficulty_score" text,
	"preferred_question_types" text[],
	"is_active" boolean DEFAULT true,
	"is_high_priority" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "genres_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "graph_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_node_id" uuid NOT NULL,
	"target_node_id" uuid NOT NULL,
	"relationship" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "graph_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"type" varchar(50),
	"description" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "passages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200),
	"content" text NOT NULL,
	"word_count" integer NOT NULL,
	"genre" varchar(50) NOT NULL,
	"difficulty" varchar(20) NOT NULL,
	"source" varchar(100),
	"generation_model" varchar(50),
	"generation_prompt_version" varchar(20),
	"generation_cost_cents" integer,
	"quality_score" text,
	"times_used" integer DEFAULT 0,
	"avg_completion_time_seconds" integer,
	"avg_accuracy" text,
	"is_daily_pick" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"paper_id" uuid,
	"article_id" uuid
);
--> statement-breakpoint
CREATE TABLE "practice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"score_percentage" text,
	"points_earned" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'in_progress',
	"current_question_index" integer DEFAULT 0,
	"session_data" text,
	"is_group_session" boolean DEFAULT false,
	"group_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"paper_id" uuid,
	"is_analysed" boolean DEFAULT false,
	"analytics" text
);
--> statement-breakpoint
CREATE TABLE "question_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"passage_id" uuid,
	"user_answer" text,
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
	"ai_grading_score" text,
	"ai_feedback" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "question_types" (
	"key" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"passage_id" uuid,
	"question_text" text NOT NULL,
	"question_type" varchar(30) NOT NULL,
	"options" text,
	"correct_answer" text NOT NULL,
	"jumbled_sentences" text,
	"rationale" text NOT NULL,
	"rationale_model" varchar(50),
	"hints" text,
	"difficulty" varchar(20),
	"tags" text[],
	"quality_score" text,
	"times_answered" integer DEFAULT 0,
	"times_correct" integer DEFAULT 0,
	"avg_time_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"paper_id" uuid
);
--> statement-breakpoint
CREATE TABLE "user_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"minutes_practiced" integer DEFAULT 0,
	"questions_attempted" integer DEFAULT 0,
	"questions_correct" integer DEFAULT 0,
	"accuracy_percentage" integer DEFAULT 0,
	"is_active_day" boolean DEFAULT false,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"points_earned_today" integer DEFAULT 0,
	"total_points" integer DEFAULT 0,
	"genre_performance" text,
	"difficulty_performance" text,
	"question_type_performance" text,
	"new_words_learned" integer DEFAULT 0,
	"words_reviewed" integer DEFAULT 0,
	"last_active_date" varchar(20),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_analytics_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_metric_proficiency" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"dimension_type" text NOT NULL,
	"dimension_key" text NOT NULL,
	"proficiency_score" integer NOT NULL,
	"confidence_score" varchar(10) NOT NULL,
	"total_attempts" integer DEFAULT 0,
	"correct_attempts" integer DEFAULT 0,
	"last_session_id" uuid,
	"trend" text,
	"speed_vs_accuracy_data" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_metric_proficiency_dimension_type_check" CHECK ("user_metric_proficiency"."dimension_type" IN ('core_metric', 'genre', 'question_type', 'reasoning_step', 'error_pattern', 'difficulty'))
);
--> statement-breakpoint
CREATE TABLE "user_proficiency_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"overall_percentile" integer,
	"estimated_cat_percentile" integer,
	"genre_strengths" text,
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
	CONSTRAINT "user_proficiency_signals_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"display_name" varchar(100),
	"avatar_url" text,
	"subscription_tier" varchar(20) DEFAULT 'free',
	"subscription_expires_at" timestamp with time zone,
	"daily_goal_minutes" integer DEFAULT 30,
	"preferred_difficulty" varchar(20) DEFAULT 'medium',
	"theme" varchar(20) DEFAULT 'light',
	"data_consent_given" boolean DEFAULT false,
	"show_on_leaderboard" boolean DEFAULT true,
	"last_active_at" timestamp with time zone DEFAULT now(),
	"email" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_profiles_username_unique" UNIQUE("username"),
	CONSTRAINT "user_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "auth_password_reset_tokens" ADD CONSTRAINT "auth_password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_papers" ADD CONSTRAINT "exam_papers_generated_by_user_id_users_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_source_node_id_graph_nodes_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "public"."graph_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_target_node_id_graph_nodes_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "public"."graph_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passages" ADD CONSTRAINT "passages_paper_id_exam_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."exam_papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passages" ADD CONSTRAINT "passages_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_paper_id_exam_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."exam_papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_session_id_practice_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_passage_id_passages_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_passage_id_passages_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_paper_id_exam_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."exam_papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_analytics" ADD CONSTRAINT "user_analytics_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_metric_proficiency" ADD CONSTRAINT "user_metric_proficiency_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_proficiency_signals" ADD CONSTRAINT "user_proficiency_signals_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;