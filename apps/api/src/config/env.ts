/**
 * Environment Configuration
 *
 * This module provides type-safe access to environment variables with runtime validation.
 * Validates all required environment variables at startup and fails fast if any are missing.
 *
 * Usage:
 *   import { env } from './config/env.js';
 *   console.log(env.PORT); // Type-safe access
 */

import { z } from 'zod';

// Load .env file in development
if (process.env.NODE_ENV !== 'production') {
  const { config } = await import('dotenv');
  config();
}

/**
 * Environment variable schema with validation rules
 */
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().default(8081),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Database
  DATABASE_URL: z.url('DATABASE_URL must be a valid URL'),

  // CORS
  FRONTEND_URL: z.url('FRONTEND_URL must be a valid URL'),

  // Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long for security'),
});

/**
 * Validated environment configuration
 * Throws an error at startup if validation fails
 */
function loadEnvironment() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
}

/**
 * Validated and type-safe environment configuration
 */
export const env = loadEnvironment();

/**
 * Type definition for environment variables
 */
export type Env = z.infer<typeof envSchema>;
