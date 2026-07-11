-- Add post-interview coaching JSON to answers
ALTER TABLE "Answer" ADD COLUMN IF NOT EXISTS "coaching" JSONB;
