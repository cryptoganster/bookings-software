/**
 * Appointments API Service
 */

import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { AppointmentDto } from "@packages/shared-types";

export const appointmentsService = {
  async getAll(): Promise<AppointmentDto[]> {
    const { data } = await apiClient.get<AppointmentDto[]>(
      ENDPOINTS.APPOINTMENTS.LIST,
    );
    return data;
  },

  async getById(id: string): Promise<AppointmentDto> {
    const { data } = await apiClient.get<AppointmentDto>(
      ENDPOINTS.APPOINTMENTS.DETAIL(id),
    );
    return data;
  },

  async getToday(): Promise<AppointmentDto[]> {
    const { data } = await apiClient.get<AppointmentDto[]>(
      ENDPOINTS.APPOINTMENTS.TODAY,
    );
    return data;
  },

  async getUpcoming(): Promise<AppointmentDto[]> {
    const { data } = await apiClient.get<AppointmentDto[]>(
      ENDPOINTS.APPOINTMENTS.UPCOMING,
    );
    return data;
  },

  async cancel(id: string): Promise<void> {
    await apiClient.put(ENDPOINTS.APPOINTMENTS.CANCEL(id));
  },
};
