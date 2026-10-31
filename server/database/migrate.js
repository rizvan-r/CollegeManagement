import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, testDatabaseConnection } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('--- Starting Database Migration ---');
  const dbStatus = await testDatabaseConnection();
  if (!dbStatus.connected) {
    console.error('Cannot run migration: Remote database not connected.');
    process.exit(1);
  }

  const migrationFilePath = path.resolve(__dirname, '../../database/migrations/001_initial_schema.sql');
  console.log(`Reading migration file: ${migrationFilePath}`);

  try {
    const sql = fs.readFileSync(migrationFilePath, 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      console.log('Applying schema migrations...');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(' Schema migration completed successfully!');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Migration transaction failed:', err.message);
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to apply migration:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
