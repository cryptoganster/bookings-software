/**
 * API Client Tests
 *
 * Tests for the axios API client configuration
 */

import { describe, it, expect } from "vitest";
import { apiClient } from "../client";

describe("API Client", () => {
  it("should be configured with correct baseURL", () => {
    expect(apiClient.defaults.baseURL).toBe("http://localhost:3000/api");
  });

  it("should have request interceptor configured", () => {
    expect(apiClient.interceptors.request.handlers.length).toBeGreaterThan(0);
  });

  it("should have response interceptor configured", () => {
    expect(apiClient.interceptors.response.handlers.length).toBeGreaterThan(0);
  });
});
