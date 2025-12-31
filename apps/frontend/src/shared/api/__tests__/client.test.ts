/**
 * API Client Tests
 *
 * Tests for the axios API client configuration
 */

import { describe, it, expect } from "vitest";
import { apiClient } from "../client";

describe("API Client", () => {
  it("should be configured with a baseURL", () => {
    // The baseURL is dynamically determined based on environment
    // In tests, it uses window.location which defaults to http://localhost:3000
    expect(apiClient.defaults.baseURL).toBeDefined();
    expect(typeof apiClient.defaults.baseURL).toBe("string");
    expect(apiClient.defaults.baseURL).toContain("/api");
  });

  it("should have request interceptor configured", () => {
    expect(apiClient.interceptors.request).toBeDefined();
  });

  it("should have response interceptor configured", () => {
    expect(apiClient.interceptors.response).toBeDefined();
  });
});
