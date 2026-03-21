ALTER TABLE "student_enrollments"
DROP CONSTRAINT IF EXISTS "student_enrollments_student_id_status_unique";

DROP INDEX IF EXISTS "student_enrollments_one_active_idx";

CREATE UNIQUE INDEX "student_enrollments_one_active_idx"
ON "student_enrollments" ("student_id")
WHERE "status" = 'active';
