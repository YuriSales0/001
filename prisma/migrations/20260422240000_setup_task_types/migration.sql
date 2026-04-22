-- New TaskType values for property setup responsibility tracking
ALTER TYPE "TaskType" ADD VALUE IF NOT EXISTS 'SETUP_AI_CONTEXT';
ALTER TYPE "TaskType" ADD VALUE IF NOT EXISTS 'SETUP_FIELD_INSPECTION';
