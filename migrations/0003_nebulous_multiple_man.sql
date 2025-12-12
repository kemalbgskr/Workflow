CREATE TABLE "project_approvers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"mode" text DEFAULT 'SEQUENTIAL' NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_status_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"approver_id" uuid NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"comment" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_status_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"requested_by" uuid NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "document_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "approval_rounds" ADD COLUMN "priority" text DEFAULT 'MEDIUM' NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "attachment_path" text;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "attachment_name" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "priority" text DEFAULT 'MEDIUM' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "priority" text DEFAULT 'MEDIUM' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "team_members" text[];--> statement-breakpoint
ALTER TABLE "signature_envelopes" ADD COLUMN "docuseal_template_id" text;--> statement-breakpoint
ALTER TABLE "signature_envelopes" ADD COLUMN "docuseal_submission_id" text;--> statement-breakpoint
ALTER TABLE "signature_envelopes" ADD COLUMN "docuseal_edit_url" text;--> statement-breakpoint
ALTER TABLE "project_approvers" ADD CONSTRAINT "project_approvers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_approvers" ADD CONSTRAINT "project_approvers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_status_approvals" ADD CONSTRAINT "project_status_approvals_request_id_project_status_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."project_status_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_status_approvals" ADD CONSTRAINT "project_status_approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_status_requests" ADD CONSTRAINT "project_status_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_status_requests" ADD CONSTRAINT "project_status_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "updated_at";