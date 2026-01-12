/**
 * Test: Appointment Entity Index Exports
 * Verifica que todos los exports públicos estén disponibles
 */

import { describe, it, expect } from "vitest";
import * as AppointmentEntity from "../index";

describe("Appointment Entity - Public API", () => {
  it("should export UI components", () => {
    expect(AppointmentEntity.AppointmentCard).toBeDefined();
    expect(AppointmentEntity.AppointmentBadge).toBeDefined();
  });

  it("should export query hooks", () => {
    expect(AppointmentEntity.useAppointments).toBeDefined();
    expect(AppointmentEntity.useAppointment).toBeDefined();
    expect(AppointmentEntity.useUpcomingAppointments).toBeDefined();
    expect(AppointmentEntity.useTodayAppointments).toBeDefined();
  });

  it("should export mutation hooks", () => {
    expect(AppointmentEntity.useCancelAppointment).toBeDefined();
  });

  it("should export query keys", () => {
    expect(AppointmentEntity.appointmentKeys).toBeDefined();
  });

  it("should export API client", () => {
    expect(AppointmentEntity.appointmentsApi).toBeDefined();
  });

  it("should export formatting utilities", () => {
    expect(AppointmentEntity.formatAppointmentDateTime).toBeDefined();
    expect(AppointmentEntity.formatAppointmentDate).toBeDefined();
    expect(AppointmentEntity.formatAppointmentTime).toBeDefined();
    expect(AppointmentEntity.formatCustomerName).toBeDefined();
    expect(AppointmentEntity.formatPhoneNumber).toBeDefined();
    expect(AppointmentEntity.formatAppointmentSummary).toBeDefined();
  });

  it("should export status utilities", () => {
    expect(AppointmentEntity.getStatusColor).toBeDefined();
    expect(AppointmentEntity.getStatusLabel).toBeDefined();
  });
});
