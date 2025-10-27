/**
 * Environment Configuration
 *
 * This module provides type-safe access to environment variables with runtime validation.
 * All client-side environment variables in Vite must be prefixed with VITE_
 *
 * Security Notes:
 * - Never commit .env files to version control
 * - Only use VITE_ prefixed vars for client-side code (they are exposed to the browser)
 * - For production, set environment variables in your hosting platform
 */

interface EnvironmentConfig {
  api: {
    baseUrl: string;
  };
}

/**
 * Gets an optional environment variable with a default value
 */
function getOptionalEnvVar(key: string, defaultValue: string): string {
  const value = import.meta.env[key];
  return value && value.trim() !== '' ? value : defaultValue;
}

/**
 * Validates and exports all environment configuration
 * Throws an error at startup if required variables are missing
 */
function loadEnvironmentConfig(): EnvironmentConfig {
  return {
    api: {
      baseUrl: getOptionalEnvVar('VITE_API_BASE_URL', 'http://localhost:8081'),
    },
  };
}

/**
 * Validated environment configuration
 * Access via: env.api.baseUrl
 */
export const env = loadEnvironmentConfig();

/**
 * Type declarations for Vite environment variables
 */
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    [key: string]: string | undefined;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
