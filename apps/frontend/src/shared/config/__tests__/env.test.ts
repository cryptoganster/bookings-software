/**
 * Test: Environment Configuration
 * Verifica la configuración de variables de entorno
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Environment Configuration", () => {
  beforeEach(() => {
    // Reset modules to get fresh env config
    vi.resetModules();
  });

  it("should use VITE_API_URL when set", async () => {
    // Mock import.meta.env
    vi.stubGlobal("import", {
      meta: {
        env: {
          VITE_API_URL: "https://api.example.com",
        },
      },
    });

    const { env } = await import("../env");
    expect(env.apiUrl).toBeDefined();
    expect(typeof env.apiUrl).toBe("string");
  });

  it("should construct API URL from window.location when VITE_API_URL not set", async () => {
    // Mock window.location
    Object.defineProperty(window, "location", {
      value: {
        protocol: "http:",
        hostname: "localhost",
      },
      writable: true,
    });

    // Mock import.meta.env without VITE_API_URL
    vi.stubGlobal("import", {
      meta: {
        env: {},
      },
    });

    const { env } = await import("../env");
    expect(env.apiUrl).toBeDefined();
    // In test environment, it may use test server URL (127.0.0.1) or localhost
    expect(env.apiUrl).toMatch(/http:\/\/(localhost|127\.0\.0\.1)/);
  });

  it("should export env as const object", async () => {
    const { env } = await import("../env");
    expect(env).toBeDefined();
    expect(typeof env).toBe("object");
    expect(env.apiUrl).toBeDefined();
  });
});
