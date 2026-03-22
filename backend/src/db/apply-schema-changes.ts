import * as dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

const dbUrl = process.env.DATABASE_URL!;

async function applyMigration() {
	const client = new Client({
		connectionString: dbUrl,
	});

	try {
		await client.connect();
		console.log("Connected to database");

		console.log("Applying schema changes...");

		// Add cancelled value to payment_status enum if not exists
		try {
			await client.query(
				`ALTER TYPE "public"."payment_status" ADD VALUE 'cancelled'`,
			);
			console.log("✓ Added cancelled to payment_status enum");
		} catch (e: any) {
			if (e.code === "23505" || e.message.includes("already exists")) {
				console.log("✓ cancelled value already exists in payment_status enum");
			} else {
				throw e;
			}
		}

		// Update student_payments default status
		await client.query(
			`ALTER TABLE "student_payments" ALTER COLUMN "status" SET DEFAULT 'pending'`,
		);
		console.log("✓ Updated student_payments default status to pending");

		// Add price_per_month to course_levels
		try {
			await client.query(
				`ALTER TABLE "course_levels" ADD COLUMN "price_per_month" numeric(10, 2) DEFAULT '0' NOT NULL`,
			);
			console.log("✓ Added price_per_month to course_levels");
		} catch (e: any) {
			if (e.message.includes("already exists")) {
				console.log("✓ price_per_month column already exists");
			} else {
				throw e;
			}
		}

		// Add auto_generated to student_payments
		try {
			await client.query(
				`ALTER TABLE "student_payments" ADD COLUMN "auto_generated" boolean DEFAULT false NOT NULL`,
			);
			console.log("✓ Added auto_generated to student_payments");
		} catch (e: any) {
			if (e.message.includes("already exists")) {
				console.log("✓ auto_generated column already exists");
			} else {
				throw e;
			}
		}

		// Add cycle_number to student_payments
		try {
			await client.query(
				`ALTER TABLE "student_payments" ADD COLUMN "cycle_number" integer DEFAULT 1`,
			);
			console.log("✓ Added cycle_number to student_payments");
		} catch (e: any) {
			if (e.message.includes("already exists")) {
				console.log("✓ cycle_number column already exists");
			} else {
				throw e;
			}
		}

		// Add status to teacher_payments
		try {
			await client.query(
				`ALTER TABLE "teacher_payments" ADD COLUMN "status" "payment_status" DEFAULT 'pending' NOT NULL`,
			);
			console.log("✓ Added status to teacher_payments");
		} catch (e: any) {
			if (e.message.includes("already exists")) {
				console.log("✓ status column already exists");
			} else {
				throw e;
			}
		}

		// Add auto_generated to teacher_payments
		try {
			await client.query(
				`ALTER TABLE "teacher_payments" ADD COLUMN "auto_generated" boolean DEFAULT false NOT NULL`,
			);
			console.log("✓ Added auto_generated to teacher_payments");
		} catch (e: any) {
			if (e.message.includes("already exists")) {
				console.log(
					"✓ auto_generated column already exists in teacher_payments",
				);
			} else {
				throw e;
			}
		}

		// Add cycle_number to teacher_payments
		try {
			await client.query(
				`ALTER TABLE "teacher_payments" ADD COLUMN "cycle_number" integer DEFAULT 1`,
			);
			console.log("✓ Added cycle_number to teacher_payments");
		} catch (e: any) {
			if (e.message.includes("already exists")) {
				console.log("✓ cycle_number column already exists in teacher_payments");
			} else {
				throw e;
			}
		}

		console.log("\n✅ All schema changes applied successfully!");
	} catch (error) {
		console.error("Error applying migration:", error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

applyMigration();
