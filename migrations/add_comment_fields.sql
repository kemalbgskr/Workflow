-- Add new fields to comments table
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS attachment_path TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT;

-- Make documentId nullable since we now support project comments
ALTER TABLE comments ALTER COLUMN document_id DROP NOT NULL;