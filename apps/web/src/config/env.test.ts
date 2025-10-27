import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('Environment Configuration', () => {
  beforeEach(() => {
    // Reset modules to allow re-importing with new env values
    vi.resetModules();
  });

  test('should use default API base URL when not provided', async () => {
    // No env vars set

    const { env } = await import('./env');

    expect(env.api.baseUrl).toBe('http://localhost:8081');

    vi.unstubAllEnvs();
  });

  test('should use custom API base URL when provided', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.kaizen.example.com');

    const { env } = await import('./env');

    expect(env.api.baseUrl).toBe('https://api.kaizen.example.com');

    vi.unstubAllEnvs();
  });

  test('should handle empty API base URL by using default', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');

    const { env } = await import('./env');

    expect(env.api.baseUrl).toBe('http://localhost:8081');

    vi.unstubAllEnvs();
  });

  test('should handle whitespace-only API base URL by using default', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '   ');

    const { env } = await import('./env');

    expect(env.api.baseUrl).toBe('http://localhost:8081');

    vi.unstubAllEnvs();
  });
});
