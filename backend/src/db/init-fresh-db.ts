import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

const dbUrl = process.env.DATABASE_URL!;

async function runInitialMigration() {
	const client = new Client({
		connectionString: dbUrl,
	});

	try {
		await client.connect();
		console.log("Connected to database");
		console.log("Running initial migration...\n");

		// Read the full migration file
		const migrationPath = path.join(
			__dirname,
			"migrations",
			"0000_wandering_molecule_man.sql",
		);
		const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

		// Split by statement-breakpoint and execute each statement
		const statements = migrationSQL
			.split("--> statement-breakpoint")
			.map((s) => s.trim())
			.filter((s) => s);

		let successCount = 0;
		let failCount = 0;

		for (const statement of statements) {
			if (statement) {
				try {
					await client.query(statement);
					successCount++;
					// Log first 50 chars of statement for progress
					console.log(
						`✓ Executed: ${statement.substring(0, 60).replace(/\n/g, " ")}...`,
					);
				} catch (error: any) {
					// If type already exists, that's okay
					if (
						error.code === "42710" ||
						error.message.includes("already exists")
					) {
						console.log(
							`⚠ Already exists: ${statement.substring(0, 60).replace(/\n/g, " ")}...`,
						);
						successCount++;
					} else {
						failCount++;
						console.error(
							`✗ Failed: ${statement.substring(0, 60).replace(/\n/g, " ")}...`,
						);
						console.error(`  Error: ${error.message}`);
					}
				}
			}
		}

		console.log(`\n✅ Migration complete!`);
		console.log(`   Success: ${successCount}`);
		console.log(`   Failed: ${failCount}`);

		if (failCount === 0) {
			console.log("\n🎉 Database schema created successfully!");
			console.log("Next step: Run the seed script to add initial data");
			console.log("   bun run src/db/seed.ts");
		}
	} catch (error) {
		console.error("Error running migration:", error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

runInitialMigration();
