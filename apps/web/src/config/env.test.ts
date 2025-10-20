import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('Environment Configuration', () => {
  beforeEach(() => {
    // Reset modules to allow re-importing with new env values
    vi.resetModules();
  });

  test('should load required environment variables', async () => {
    // Set test env vars using vi.stubEnv
    vi.stubEnv('VITE_OPENAI_API_KEY', 'test-api-key-123');

    // Dynamic import to get fresh module with new env
    const { env } = await import('./env');

    expect(env.openai.apiKey).toBe('test-api-key-123');

    vi.unstubAllEnvs();
  });

  test('should use default API base URL when not provided', async () => {
    vi.stubEnv('VITE_OPENAI_API_KEY', 'test-api-key-123');

    const { env } = await import('./env');

    expect(env.openai.apiBaseUrl).toBe('https://api.openai.com/v1');

    vi.unstubAllEnvs();
  });

  test('should use custom API base URL when provided', async () => {
    vi.stubEnv('VITE_OPENAI_API_KEY', 'test-api-key-123');
    vi.stubEnv('VITE_OPENAI_API_BASE_URL', 'https://custom-api.example.com/v1');

    const { env } = await import('./env');

    expect(env.openai.apiBaseUrl).toBe('https://custom-api.example.com/v1');

    vi.unstubAllEnvs();
  });

  test('should throw error when required API key is missing', async () => {
    vi.stubEnv('VITE_OPENAI_API_KEY', '');

    await expect(async () => {
      await import('./env');
    }).rejects.toThrow(/Missing required environment variable: VITE_OPENAI_API_KEY/);

    vi.unstubAllEnvs();
  });

  test('should throw error when API key is whitespace only', async () => {
    vi.stubEnv('VITE_OPENAI_API_KEY', '   ');

    await expect(async () => {
      await import('./env');
    }).rejects.toThrow(/Missing required environment variable: VITE_OPENAI_API_KEY/);

    vi.unstubAllEnvs();
  });

  test('should throw error when API key is undefined', async () => {
    vi.stubEnv('VITE_OPENAI_API_KEY', undefined);

    await expect(async () => {
      await import('./env');
    }).rejects.toThrow(/Missing required environment variable: VITE_OPENAI_API_KEY/);

    vi.unstubAllEnvs();
  });
});
