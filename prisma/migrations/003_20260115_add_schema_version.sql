-- 003_20260115_add_schema_version.sql
-- Added SchemaVersion table for migration tracking

CREATE TABLE "SchemaVersion" (
    "id" SERIAL NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchemaVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SchemaVersion_version_key" ON "SchemaVersion"("version");
