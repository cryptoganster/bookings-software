import { describe, it, expect } from "vitest";
import {
  formatAppointmentDateTime,
  formatAppointmentDate,
  formatAppointmentTime,
  formatCustomerName,
  formatPhoneNumber,
  formatAppointmentSummary,
} from "../formatAppointment";
import type { AppointmentReadModel } from "../../model/types";

describe("formatAppointment", () => {
  const mockAppointment: AppointmentReadModel = {
    id: "appointment-1",
    businessId: "business-1",
    customerId: "customer-1",
    customerName: "Juan Pérez",
    customerPhone: "+18095551234",
    offeringId: "offering-1",
    offeringName: "Corte de Pelo",
    dateTime: "2024-12-18T14:30:00Z",
    status: "CONFIRMED",
    createdAt: "2024-12-15T10:00:00Z",
    cancelledAt: null,
  };

  describe("formatAppointmentDateTime", () => {
    it("should format date and time correctly in business timezone", () => {
      const result = formatAppointmentDateTime(
        mockAppointment.dateTime,
        "America/Santo_Domingo",
      );
      // Should include day, date, and time
      expect(result).toMatch(/\d{2}\/\d{2}/); // Date format
      expect(result).toMatch(/\d{1,2}:\d{2}/); // Time format
    });

    it("should fallback to local timezone when timezone not provided", () => {
      const result = formatAppointmentDateTime(mockAppointment.dateTime);
      // Should still format correctly
      expect(result).toMatch(/\d{2}\/\d{2}/); // Date format
      expect(result).toMatch(/\d{1,2}:\d{2}/); // Time format
    });
  });

  describe("formatAppointmentDate", () => {
    it("should format date correctly in business timezone", () => {
      const result = formatAppointmentDate(
        mockAppointment.dateTime,
        "America/Santo_Domingo",
      );
      // Should include day name and month
      expect(result).toContain("de");
      expect(result).toMatch(/\d{2}/); // Day number
    });

    it("should fallback to local timezone when timezone not provided", () => {
      const result = formatAppointmentDate(mockAppointment.dateTime);
      // Should still format correctly
      expect(result).toContain("de");
      expect(result).toMatch(/\d{2}/); // Day number
    });
  });

  describe("formatAppointmentTime", () => {
    it("should format time correctly in business timezone", () => {
      const result = formatAppointmentTime(
        mockAppointment.dateTime,
        "America/Santo_Domingo",
      );
      // Should be in format "h:mm a"
      expect(result).toMatch(/\d{1,2}:\d{2} [AP]M/);
    });

    it("should fallback to local timezone when timezone not provided", () => {
      const result = formatAppointmentTime(mockAppointment.dateTime);
      // Should still format correctly
      expect(result).toMatch(/\d{1,2}:\d{2} [AP]M/);
    });
  });

  describe("formatCustomerName", () => {
    it("should return customer name when available", () => {
      const result = formatCustomerName(mockAppointment);
      expect(result).toBe("Juan Pérez");
    });

    it("should return phone number when name is null", () => {
      const appointmentWithoutName: AppointmentReadModel = {
        ...mockAppointment,
        customerName: null,
      };
      const result = formatCustomerName(appointmentWithoutName);
      expect(result).toBe("+18095551234");
    });
  });

  describe("formatPhoneNumber", () => {
    it("should format US phone number correctly", () => {
      const result = formatPhoneNumber("+18095551234");
      expect(result).toBe("+1 809-555-1234");
    });

    it("should return original phone if not in expected format", () => {
      const result = formatPhoneNumber("+34123456789");
      expect(result).toBe("+34123456789");
    });

    it("should handle phone without country code", () => {
      const result = formatPhoneNumber("8095551234");
      expect(result).toBe("8095551234");
    });
  });

  describe("formatAppointmentSummary", () => {
    it("should format all appointment fields correctly with timezone", () => {
      const result = formatAppointmentSummary(
        mockAppointment,
        "America/Santo_Domingo",
      );

      expect(result.id).toBe(mockAppointment.id);
      expect(result.customerName).toBe("Juan Pérez");
      expect(result.customerPhone).toBe("+1 809-555-1234");
      expect(result.offeringName).toBe("Corte de Pelo");
      expect(result.status).toBe("CONFIRMED");
      expect(result.dateTime).toBeTruthy();
      expect(result.date).toBeTruthy();
      expect(result.time).toBeTruthy();
    });

    it("should handle appointment without customer name", () => {
      const appointmentWithoutName: AppointmentReadModel = {
        ...mockAppointment,
        customerName: null,
      };
      const result = formatAppointmentSummary(
        appointmentWithoutName,
        "America/Santo_Domingo",
      );

      expect(result.customerName).toBe("+18095551234");
    });

    it("should work without timezone parameter", () => {
      const result = formatAppointmentSummary(mockAppointment);

      expect(result.id).toBe(mockAppointment.id);
      expect(result.dateTime).toBeTruthy();
      expect(result.date).toBeTruthy();
      expect(result.time).toBeTruthy();
    });
  });
});
