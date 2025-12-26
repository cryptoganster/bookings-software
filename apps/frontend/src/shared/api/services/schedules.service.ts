/**
 * Schedules API Service
 */

import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";

export interface ScheduleDto {
  id: string;
  businessId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface CreateScheduleDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface UpdateScheduleDto {
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}

export const schedulesService = {
  async getAll(): Promise<ScheduleDto[]> {
    const { data } = await apiClient.get<ScheduleDto[]>(
      ENDPOINTS.SCHEDULES.LIST,
    );
    return data;
  },

  async create(dto: CreateScheduleDto): Promise<ScheduleDto> {
    const { data } = await apiClient.post<ScheduleDto>(
      ENDPOINTS.SCHEDULES.CREATE,
      dto,
    );
    return data;
  },

  async update(id: string, dto: UpdateScheduleDto): Promise<ScheduleDto> {
    const { data } = await apiClient.put<ScheduleDto>(
      ENDPOINTS.SCHEDULES.UPDATE(id),
      dto,
    );
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.SCHEDULES.DELETE(id));
  },
};
