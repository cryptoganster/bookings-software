/**
 * Tests for Appointments API
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { appointmentsApi } from "../api";
import { apiClient } from "@shared/api/client";
import { ENDPOINTS } from "@shared/api/endpoints";
import type { AppointmentDto } from "@packages/shared-types";

vi.mock("@shared/api/client");

describe("appointmentsApi", () => {
  const mockAppointment: AppointmentDto = {
    id: "apt-1",
    businessId: "biz-1",
    customerId: "cust-1",
    customerName: "John Doe",
    customerPhone: "+18095551234",
    offeringId: "off-1",
    offeringName: "Haircut",
    dateTime: "2024-01-15T14:30:00Z",
    status: "CONFIRMED",
    createdAt: "2024-01-01T00:00:00Z",
    cancelledAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("should fetch all appointments without filters", async () => {
      const mockData = [mockAppointment];
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const result = await appointmentsApi.getAll();

      expect(apiClient.get).toHaveBeenCalledWith(ENDPOINTS.APPOINTMENTS.LIST, {
        params: undefined,
      });
      expect(result).toEqual(mockData);
    });

    it("should fetch appointments with status filter", async () => {
      const mockData = [mockAppointment];
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const result = await appointmentsApi.getAll({ status: "CONFIRMED" });

      expect(apiClient.get).toHaveBeenCalledWith(ENDPOINTS.APPOINTMENTS.LIST, {
        params: { status: "CONFIRMED" },
      });
      expect(result).toEqual(mockData);
    });

    it("should fetch appointments with date range filter", async () => {
      const mockData = [mockAppointment];
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const result = await appointmentsApi.getAll({
        dateRange: [startDate, endDate],
      });

      expect(apiClient.get).toHaveBeenCalledWith(ENDPOINTS.APPOINTMENTS.LIST, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      expect(result).toEqual(mockData);
    });

    it("should fetch appointments with offering filter", async () => {
      const mockData = [mockAppointment];
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const result = await appointmentsApi.getAll({ offeringId: "off-1" });

      expect(apiClient.get).toHaveBeenCalledWith(ENDPOINTS.APPOINTMENTS.LIST, {
        params: { offeringId: "off-1" },
      });
      expect(result).toEqual(mockData);
    });

    it("should fetch appointments with multiple filters", async () => {
      const mockData = [mockAppointment];
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const result = await appointmentsApi.getAll({
        status: "CONFIRMED",
        dateRange: [startDate, endDate],
        offeringId: "off-1",
      });

      expect(apiClient.get).toHaveBeenCalledWith(ENDPOINTS.APPOINTMENTS.LIST, {
        params: {
          status: "CONFIRMED",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          offeringId: "off-1",
        },
      });
      expect(result).toEqual(mockData);
    });
  });

  describe("getById", () => {
    it("should fetch appointment by id", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockAppointment });

      const result = await appointmentsApi.getById("apt-1");

      expect(apiClient.get).toHaveBeenCalledWith(
        ENDPOINTS.APPOINTMENTS.DETAIL("apt-1"),
      );
      expect(result).toEqual(mockAppointment);
    });

    it("should return null when appointment not found (404)", async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { status: 404 },
      });

      const result = await appointmentsApi.getById("non-existent");

      expect(result).toBeNull();
    });

    it("should throw error for other errors", async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { status: 500 },
      });

      await expect(appointmentsApi.getById("apt-1")).rejects.toEqual({
        response: { status: 500 },
      });
    });
  });

  describe("cancel", () => {
    it("should cancel appointment", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ data: undefined });

      await appointmentsApi.cancel("apt-1");

      expect(apiClient.put).toHaveBeenCalledWith(
        ENDPOINTS.APPOINTMENTS.CANCEL("apt-1"),
      );
    });
  });

  describe("getToday", () => {
    it("should fetch today's appointments", async () => {
      const mockData = [mockAppointment];
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const result = await appointmentsApi.getToday();

      expect(apiClient.get).toHaveBeenCalledWith(ENDPOINTS.APPOINTMENTS.TODAY);
      expect(result).toEqual(mockData);
    });
  });

  describe("getUpcoming", () => {
    it("should fetch upcoming appointments", async () => {
      const mockData = [mockAppointment];
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const result = await appointmentsApi.getUpcoming();

      expect(apiClient.get).toHaveBeenCalledWith(
        ENDPOINTS.APPOINTMENTS.UPCOMING,
      );
      expect(result).toEqual(mockData);
    });
  });
});
