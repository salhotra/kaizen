/**
 * Example: How to use environment configuration
 *
 * This file demonstrates the proper way to access environment variables
 * in the application. DO NOT copy this file - it's just for reference.
 */
/** biome-ignore-all lint/suspicious/noConsole: This is an example file, not real code */

import { env } from './env';

// ✅ CORRECT: Use the centralized env config
export function makeOpenAIRequest() {
  const apiKey = env.openai.apiKey;
  const baseUrl = env.openai.apiBaseUrl;

  console.log(`Making request to ${baseUrl}`);
  console.log(`Using API key: ${apiKey.slice(0, 10)}...`);

  // Your API logic here
}

// ❌ INCORRECT: Don't access import.meta.env directly
export function badExample() {
  // This bypasses validation and type safety!
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  // This could be undefined and cause runtime errors!
  console.log(apiKey);
}

// ✅ CORRECT: Environment config is validated at startup
// If required variables are missing, the app will fail fast with a helpful error
// This means you can safely use env.openai.apiKey without null checks
export function safeUsage() {
  // No need for: if (!env.openai.apiKey) { throw ... }
  // It's already validated!
  return fetch(`${env.openai.apiBaseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openai.apiKey}`,
    },
  });
}
