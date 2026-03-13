ALTER TYPE "public"."payment_status" ADD VALUE 'cancelled';--> statement-breakpoint
ALTER TABLE "student_payments" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "course_levels" ADD COLUMN "price_per_month" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "student_payments" ADD COLUMN "auto_generated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "student_payments" ADD COLUMN "cycle_number" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "teacher_payments" ADD COLUMN "status" "payment_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_payments" ADD COLUMN "auto_generated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_payments" ADD COLUMN "cycle_number" integer DEFAULT 1;