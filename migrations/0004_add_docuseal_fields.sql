-- Add new fields to signature_envelopes for DocuSeal template and submission tracking
ALTER TABLE "signature_envelopes" ADD COLUMN IF NOT EXISTS "docuseal_template_id" text;
ALTER TABLE "signature_envelopes" ADD COLUMN IF NOT EXISTS "docuseal_submission_id" text;
ALTER TABLE "signature_envelopes" ADD COLUMN IF NOT EXISTS "docuseal_edit_url" text;