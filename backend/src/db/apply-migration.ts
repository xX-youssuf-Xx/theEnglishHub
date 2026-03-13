import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const dbUrl = process.env.DATABASE_URL!;

async function applyMigration() {
  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '0000_wandering_molecule_man.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Applying migration...');
    
    // Split by statement-breakpoint and execute each statement
    const statements = migrationSQL.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);
    
    for (const statement of statements) {
      if (statement) {
        try {
          await client.query(statement);
          console.log('✓ Applied statement');
        } catch (error) {
          console.error('✗ Failed statement:', statement.substring(0, 100) + '...');
          throw error;
        }
      }
    }

    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
