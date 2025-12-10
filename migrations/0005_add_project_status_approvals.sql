-- Add project status approval tables
CREATE TABLE IF NOT EXISTS "project_status_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"requested_by" uuid NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "project_approvers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"mode" text DEFAULT 'SEQUENTIAL' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "project_status_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"approver_id" uuid NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"comment" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign keys
DO $$ BEGIN
 ALTER TABLE "project_status_requests" ADD CONSTRAINT "project_status_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_status_requests" ADD CONSTRAINT "project_status_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "users"("id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_approvers" ADD CONSTRAINT "project_approvers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_approvers" ADD CONSTRAINT "project_approvers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_status_approvals" ADD CONSTRAINT "project_status_approvals_request_id_project_status_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "project_status_requests"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_status_approvals" ADD CONSTRAINT "project_status_approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "users"("id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;