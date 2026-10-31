import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

const isProduction = config.nodeEnv === 'production';
const isNeon = config.databaseUrl && config.databaseUrl.includes('neon.tech');
export const isPlaceholderDb = !config.databaseUrl || config.databaseUrl.includes('ep-placeholder');

// Configure SSL for remote PostgreSQL (Neon requires SSL)
const poolConfig = {
  connectionString: config.databaseUrl,
  ssl: (isProduction || isNeon || config.databaseUrl.includes('sslmode=require'))
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.warn('[Database Pool Notice]: Client connection reset', err.message);
});

/**
 * Execute parameterized query with automatic client checkout
 * @param {string} text - SQL statement with $1, $2 placeholders
 * @param {Array} params - Array of parameters
 * @returns {Promise<pg.QueryResult>}
 */
export const query = async (text, params) => {
  if (isPlaceholderDb) {
    throw new Error('Database is currently configured with placeholder credentials');
  }

  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv === 'development' && duration > 100) {
      console.log(`[SQL Query] (${duration}ms) ${text.slice(0, 100)}...`);
    }
    return res;
  } catch (error) {
    console.warn(`[SQL Notice]: ${error.message}`);
    throw error;
  }
};

/**
 * Execute transactional operations safely
 * @param {Function} callback - Function receiving client instance
 */
export const withTransaction = async (callback) => {
  if (isPlaceholderDb) {
    throw new Error('Database is currently configured with placeholder credentials');
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.warn('Rollback failed:', rollbackErr.message);
      }
    }
    throw err;
  } finally {
    if (client) {
      client.release();
    }
  }
};

/**
 * Helper to test database connectivity
 */
export const testDatabaseConnection = async () => {
  if (isPlaceholderDb) {
    console.warn('[Database Notice]: DATABASE_URL is currently using placeholder credentials.');
    console.warn('-> Please update server/.env with your active Neon PostgreSQL connection string to run live queries.');
    return { connected: false, reason: 'Placeholder credentials in use' };
  }

  try {
    const res = await pool.query('SELECT NOW() AS current_time, current_database() AS db_name');
    console.log(`[Database Connected]: Remote PostgreSQL connected successfully. DB: ${res.rows[0].db_name} at ${res.rows[0].current_time}`);
    return { connected: true, timestamp: res.rows[0].current_time };
  } catch (error) {
    console.error('[Database Connection Failed]:', error.message);
    return { connected: false, error: error.message };
  }
};
