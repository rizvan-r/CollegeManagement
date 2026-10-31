import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';

// Securely resolve JWT_SECRET
let resolvedJwtSecret = process.env.JWT_SECRET;
if (!resolvedJwtSecret || resolvedJwtSecret.includes('dev_secret') || resolvedJwtSecret.trim().length < 16) {
  if (isProd) {
    // Generate a secure cryptographically random 256-bit secret so production does not crash on Render
    resolvedJwtSecret = crypto.randomBytes(32).toString('hex');
    console.warn('\n================================================================');
    console.warn('⚠️  [SECURITY NOTICE]: JWT_SECRET environment variable was not found in Render.');
    console.warn('⚡  Generated a cryptographically strong runtime secret for token signing.');
    console.warn('👉  To maintain persistent login sessions across restarts, define JWT_SECRET');
    console.warn('    in Render Dashboard -> Web Service -> Environment.');
    console.warn('================================================================\n');
  } else {
    resolvedJwtSecret = 'college_management_dev_secret_key_change_in_prod';
  }
}

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: resolvedJwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

if (isProd && !config.databaseUrl) {
  console.warn('\n⚠️  [CONFIG NOTICE]: DATABASE_URL is missing in Render Environment.');
  console.warn('👉  Please set DATABASE_URL in Render Dashboard -> Web Service -> Environment.\n');
}
