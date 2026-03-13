import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  min: 1,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000,
  query_timeout: 10000,
  application_name: 'learning_center_api',
  ssl: false,
});

let isPoolReady = false;

pool.on('error', (err) => {
  console.error('Database pool error:', err);
  isPoolReady = false;
});

pool.on('connect', () => {
  console.log('Database: new connection');
});

const warmupPool = async () => {
  try {
    console.log('Connecting to database...');
    const start = Date.now();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log(`Database connected in ${Date.now() - start}ms`);
    isPoolReady = true;
  } catch (error) {
    console.error('Database connection failed:', error);
    isPoolReady = false;
  }
};

warmupPool();

// Keep connections alive with periodic ping
setInterval(async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
  } catch (error) {
    console.error('Keep-alive query failed:', error);
  }
}, 30000); // Every 30 seconds

export const db = drizzle(pool, { schema });
export { isPoolReady };
export type Database = typeof db;
