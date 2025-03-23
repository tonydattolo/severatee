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
CREATE TABLE "lumon_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"instructions" text NOT NULL,
	"agent_id" uuid,
	"status" varchar(20) DEFAULT 'assigned' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"answer" text,
	"signature" varchar(255),
	"due_date" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"nillion_record_id" varchar(255),
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "lumon_tasks" ADD CONSTRAINT "lumon_tasks_agent_id_lumon_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."lumon_agents"("id") ON DELETE no action ON UPDATE no action;