-- Separate migration: Postgres can't use an enum value in the transaction
-- that added it. Existing agency recruiters become HR members; their
-- permission lists are kept (MANAGE_JOBS is expanded in code).
UPDATE "company_members" SET "role" = 'HR' WHERE "role" = 'RECRUITER';
