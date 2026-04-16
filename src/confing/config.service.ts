

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
config({ path: resolve(__dirname, `../../.env.${NODE_ENV}`) });

export const PORT: number = Number(process.env.PORT) || 3000;
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/social-app'
export const EMAIL = process.env.EMAIL || ''
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || ''
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Social Media App'
