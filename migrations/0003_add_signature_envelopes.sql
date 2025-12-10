-- Add signature_envelopes table for DocuSeal integration
CREATE TABLE IF NOT EXISTS "signature_envelopes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"docuseal_envelope_id" text,
	"docuseal_url" text,
	"status" text DEFAULT 'CREATED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);

-- Add foreign key constraint
ALTER TABLE "signature_envelopes" ADD CONSTRAINT "signature_envelopes_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE cascade;

-- Add webhook_events table for DocuSeal webhooks
CREATE TABLE IF NOT EXISTS "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'docuseal' NOT NULL,
	"event_type" text NOT NULL,
	"payload_json" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);