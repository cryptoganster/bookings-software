/**
 * Test: Cancel Appointment Feature Index Exports
 * Verifica que todos los exports públicos estén disponibles
 */

import { describe, it, expect } from "vitest";
import * as CancelFeature from "../index";

describe("Cancel Appointment Feature - Public API", () => {
  it("should export useCancelAppointment hook", () => {
    expect(CancelFeature.useCancelAppointment).toBeDefined();
  });

  it("should export CancelAppointmentButton component", () => {
    expect(CancelFeature.CancelAppointmentButton).toBeDefined();
  });
});
