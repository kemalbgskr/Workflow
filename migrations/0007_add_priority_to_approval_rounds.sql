-- Add priority column to approval_rounds table
ALTER TABLE "approval_rounds" ADD COLUMN "priority" text DEFAULT 'MEDIUM' NOT NULL;