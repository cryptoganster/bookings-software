import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '../client';

describe('API Client', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should be configured with correct baseURL', () => {
    expect(apiClient.defaults.baseURL).toBe('http://localhost:3000/api');
  });

  it('should have correct default headers', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should have a timeout configured', () => {
    expect(apiClient.defaults.timeout).toBe(10000);
  });

  it('should add Authorization header when token exists in localStorage', async () => {
    // Setup: Add token to localStorage
    const mockToken = 'test-jwt-token';
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { token: mockToken }
    }));

    // Create a request config
    const config = {
      url: '/test',
      method: 'get',
      headers: {}
    };

    // Trigger request interceptor
    const interceptedConfig = apiClient.interceptors.request.handlers[0].fulfilled(config as any);

    // Verify Authorization header was added
    expect(interceptedConfig.headers.Authorization).toBe(`Bearer ${mockToken}`);
  });

  it('should not add Authorization header when no token exists', async () => {
    // Create a request config
    const config = {
      url: '/test',
      method: 'get',
      headers: {}
    };

    // Trigger request interceptor
    const interceptedConfig = apiClient.interceptors.request.handlers[0].fulfilled(config as any);

    // Verify Authorization header was not added
    expect(interceptedConfig.headers.Authorization).toBeUndefined();
  });
});
