/**
 * Test: Register Feature Index Exports
 * Verifica que todos los exports públicos estén disponibles
 */

import { describe, it, expect } from "vitest";
import * as RegisterFeature from "../index";

describe("Register Feature - Public API", () => {
  it("should export UI components", () => {
    expect(RegisterFeature.RegisterForm).toBeDefined();
    expect(RegisterFeature.PasswordStrengthIndicator).toBeDefined();
  });

  it("should export hooks", () => {
    expect(RegisterFeature.useRegister).toBeDefined();
  });

  it("should export utilities", () => {
    expect(RegisterFeature.calculatePasswordStrength).toBeDefined();
  });
});
