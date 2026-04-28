
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
config({ path: resolve(__dirname, `../../.env.${NODE_ENV}`) });

export const PORT: number = Number(process.env.PORT) || 3000;
export const MONGO_URI = process.env.MONGO_URI || ''
export const EMAIL = process.env.EMAIL || ''
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || ''
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Social Media App'
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
export const REDIS_URL = process.env.REDIS_URL || ''
export const REDIS_USERNAME = process.env.REDIS_USERNAME || ''
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || ''
export const REDIS_HOST = process.env.REDIS_HOST || ''
export const REDIS_PORT = Number(process.env.REDIS_PORT) || 0
export const JWT_SECRET = process.env.JWT_SECRET || ''
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d'
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''
