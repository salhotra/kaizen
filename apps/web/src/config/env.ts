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
  openai: {
    apiKey: string;
    apiBaseUrl: string;
  };
}

/**
 * Validates that a required environment variable exists and is not empty
 */
function getRequiredEnvVar(key: string): string {
  const value = import.meta.env[key];

  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        'Please check your .env file and ensure all required variables are set.\n' +
        'See .env.example for reference.'
    );
  }

  return value;
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
    openai: {
      apiKey: getRequiredEnvVar('VITE_OPENAI_API_KEY'),
      apiBaseUrl: getOptionalEnvVar('VITE_OPENAI_API_BASE_URL', 'https://api.openai.com/v1'),
    },
  };
}

/**
 * Validated environment configuration
 * Access via: env.openai.apiKey
 */
export const env = loadEnvironmentConfig();

/**
 * Type declarations for Vite environment variables
 */
declare global {
  interface ImportMetaEnv {
    readonly VITE_OPENAI_API_KEY: string;
    readonly VITE_OPENAI_API_BASE_URL?: string;
    [key: string]: string | undefined;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
