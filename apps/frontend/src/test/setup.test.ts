/**
 * Test Setup Verification
 *
 * Simple test to verify that the test environment is configured correctly
 */

import { describe, it, expect } from "vitest";

describe("Test Setup", () => {
  it("should run tests", () => {
    expect(true).toBe(true);
  });

  it("should have access to vitest globals", () => {
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });
});
