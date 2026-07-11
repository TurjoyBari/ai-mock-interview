-- Add extended interview report fields to Feedback
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "weakTopics" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "strongTopics" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "mistakesMade" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "recommendedStudyTopics" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "recurringPatterns" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "questionsAnsweredWell" JSONB;
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "questionsAnsweredPoorly" JSONB;
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "improvementRoadmap" JSONB;
