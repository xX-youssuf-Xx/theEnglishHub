import * as dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

const dbUrl = process.env.DATABASE_URL!;

async function optimizeDatabase() {
	const client = new Client({
		connectionString: dbUrl,
	});

	try {
		await client.connect();
		console.log("Connected to database");

		// Check if index exists on users.username
		const indexCheck = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'users' AND indexname LIKE '%username%'
    `);

		if (indexCheck.rows.length === 0) {
			console.log("Creating index on users.username...");
			await client.query(`CREATE INDEX idx_users_username ON users(username)`);
			console.log("✓ Created index on users.username");
		} else {
			console.log("✓ Index on users.username already exists");
		}

		// Check if index exists on permissions.user_id
		const permIndexCheck = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'permissions' AND indexname LIKE '%user%'
    `);

		if (permIndexCheck.rows.length === 0) {
			console.log("Creating index on permissions.user_id...");
			await client.query(
				`CREATE INDEX idx_permissions_user_id ON permissions(user_id)`,
			);
			console.log("✓ Created index on permissions.user_id");
		} else {
			console.log("✓ Index on permissions.user_id already exists");
		}

		// Analyze tables for query optimizer
		console.log("Analyzing tables...");
		await client.query(`ANALYZE users`);
		await client.query(`ANALYZE permissions`);
		console.log("✓ Tables analyzed");

		// Check connection pool settings
		const poolResult = await client.query(`SHOW max_connections`);
		console.log(`✓ Max connections: ${poolResult.rows[0].max_connections}`);

		console.log("\n✅ Database optimization complete!");
	} catch (error) {
		console.error("Error optimizing database:", error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

optimizeDatabase();
