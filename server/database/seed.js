import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, testDatabaseConnection } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeeds() {
  console.log('--- Starting Database Seeding ---');
  const dbStatus = await testDatabaseConnection();
  if (!dbStatus.connected) {
    console.error('Cannot run seed: Remote database not connected.');
    process.exit(1);
  }

  const seedFilePath = path.resolve(__dirname, '../../database/seeds/001_initial_seed.sql');
  console.log(`Reading seed file: ${seedFilePath}`);

  try {
    const sql = fs.readFileSync(seedFilePath, 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      console.log('Inserting seed records...');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(' Seed data inserted successfully!');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Seed transaction failed:', err.message);
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to apply seeds:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeeds();
