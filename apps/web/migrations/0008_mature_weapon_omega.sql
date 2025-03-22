CREATE TABLE "lumon_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"wallet_address" varchar(42),
	"description" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"metadata" jsonb,
	CONSTRAINT "lumon_agents_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "lumon_task_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"nillion_record_id" varchar(255) NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "lumon_task_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"instructions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lumon_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_type_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'assigned' NOT NULL,
	"due_date" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"nillion_record_id" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "lumon_task_submissions" ADD CONSTRAINT "lumon_task_submissions_task_id_lumon_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."lumon_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lumon_tasks" ADD CONSTRAINT "lumon_tasks_task_type_id_lumon_task_types_id_fk" FOREIGN KEY ("task_type_id") REFERENCES "public"."lumon_task_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lumon_tasks" ADD CONSTRAINT "lumon_tasks_agent_id_lumon_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."lumon_agents"("id") ON DELETE no action ON UPDATE no action;