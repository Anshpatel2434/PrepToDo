CREATE TABLE "admin_ai_cost_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_type" text NOT NULL,
	"function_name" text NOT NULL,
	"model_name" text DEFAULT 'gpt-4o-mini' NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_cents" numeric(10, 4) DEFAULT '0' NOT NULL,
	"user_id" uuid,
	"exam_id" uuid,
	"session_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_platform_metrics_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
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
	"ai_cost_today_cents" numeric(10, 4) DEFAULT '0',
	"ai_cost_cumulative_cents" numeric(12, 4) DEFAULT '0',
	"avg_session_duration_seconds" integer DEFAULT 0,
	"avg_accuracy_percentage" numeric(5, 2),
	"revenue_today_cents" integer DEFAULT 0,
	"revenue_cumulative_cents" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "admin_platform_metrics_daily_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "admin_user_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exam_generation_state" (
	"exam_id" uuid PRIMARY KEY NOT NULL,
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
	CONSTRAINT "exam_generation_state_status_check" CHECK ("exam_generation_state"."status" IN ('initializing', 'generating_passages', 'generating_rc_questions', 'generating_va_questions', 'selecting_answers', 'generating_rc_rationales', 'generating_va_rationales', 'completed', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "auth_pending_signups" ADD COLUMN "otp_send_count" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "auth_pending_signups" ADD COLUMN "banned_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(20) DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "admin_ai_cost_log" ADD CONSTRAINT "admin_ai_cost_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_ai_cost_log" ADD CONSTRAINT "admin_ai_cost_log_exam_id_exam_papers_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam_papers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_ai_cost_log" ADD CONSTRAINT "admin_ai_cost_log_session_id_practice_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_user_activity_log" ADD CONSTRAINT "admin_user_activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_generation_state" ADD CONSTRAINT "exam_generation_state_exam_id_exam_papers_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam_papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graph_edges" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "graph_nodes" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "graph_nodes" DROP COLUMN "created_at";