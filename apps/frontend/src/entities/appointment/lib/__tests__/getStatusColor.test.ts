import { describe, it, expect } from "vitest";
import { getStatusColor, getStatusLabel } from "../getStatusColor";
import type { AppointmentStatus } from "../../model/types";

describe("getStatusColor", () => {
  describe("getStatusColor", () => {
    it("should return green for CONFIRMED status", () => {
      const result = getStatusColor("CONFIRMED");
      expect(result).toBe("green");
    });

    it("should return red for CANCELLED status", () => {
      const result = getStatusColor("CANCELLED");
      expect(result).toBe("red");
    });

    it("should return blue for COMPLETED status", () => {
      const result = getStatusColor("COMPLETED");
      expect(result).toBe("blue");
    });

    it("should handle all valid appointment statuses", () => {
      const statuses: AppointmentStatus[] = [
        "CONFIRMED",
        "CANCELLED",
        "COMPLETED",
      ];

      statuses.forEach((status) => {
        const result = getStatusColor(status);
        expect(result).toBeTruthy();
        expect(typeof result).toBe("string");
      });
    });
  });

  describe("getStatusLabel", () => {
    it("should return Confirmada for CONFIRMED status", () => {
      const result = getStatusLabel("CONFIRMED");
      expect(result).toBe("Confirmada");
    });

    it("should return Cancelada for CANCELLED status", () => {
      const result = getStatusLabel("CANCELLED");
      expect(result).toBe("Cancelada");
    });

    it("should return Completada for COMPLETED status", () => {
      const result = getStatusLabel("COMPLETED");
      expect(result).toBe("Completada");
    });

    it("should return Spanish labels for all statuses", () => {
      const statuses: AppointmentStatus[] = [
        "CONFIRMED",
        "CANCELLED",
        "COMPLETED",
      ];

      statuses.forEach((status) => {
        const result = getStatusLabel(status);
        expect(result).toBeTruthy();
        expect(typeof result).toBe("string");
        // Verify it's in Spanish (ends with 'a' or 'ada')
        expect(result).toMatch(/ada?$/);
      });
    });
  });
});
