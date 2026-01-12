/**
 * Test: Appointment Details Feature Index Exports
 * Verifica que todos los exports públicos estén disponibles
 */

import { describe, it, expect } from "vitest";
import * as DetailsFeature from "../index";

describe("Appointment Details Feature - Public API", () => {
  it("should export AppointmentDetailsModal component", () => {
    expect(DetailsFeature.AppointmentDetailsModal).toBeDefined();
  });
});
