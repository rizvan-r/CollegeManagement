import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'college_management_dev_secret_key_change_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

// Security validation: Prevent running in production with insecure defaults
if (config.nodeEnv === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('dev_secret')) {
    throw new Error('[FATAL SECURITY ERROR]: Production deployment requires a secure, unpredictable JWT_SECRET environment variable.');
  }
  if (!config.databaseUrl) {
    throw new Error('[FATAL CONFIG ERROR]: Production deployment requires DATABASE_URL.');
  }
}
