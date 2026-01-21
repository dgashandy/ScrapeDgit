-- 002_20260108_add_accumulated_query.sql
-- Added accumulatedQuery to ChatSession table

ALTER TABLE "ChatSession" ADD COLUMN "accumulatedQuery" JSONB;
COMMENT ON COLUMN "ChatSession"."accumulatedQuery" IS 'Accumulated ParsedQuery across conversation turns';
