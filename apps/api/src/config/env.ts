import dotenv from 'dotenv'
import type { StringValue } from "ms";

dotenv.config();

export const env = {
   port: process.env.PORT || 4000,
   nodeEnv: process.env.NODE_ENV || 'development',
   jwtSecret: process.env.JWT_SECRET || '',
   jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d' as StringValue,
   databaseUrl: process.env.DATABASE_URL || '',
};