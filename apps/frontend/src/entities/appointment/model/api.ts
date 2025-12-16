/**
 * Appointments API Service
 * 
 * Este módulo maneja todas las llamadas a la API relacionadas con citas (appointments).
 * Usa el cliente axios configurado y los endpoints centralizados.
 */

import { apiClient } from '@shared/api/client';
import { ENDPOINTS } from '@shared/api/endpoints';
import type { 
  AppointmentDto,
  AppointmentFiltersDto 
} from '@packages/shared-types';
import type { AppointmentFilters } from './types';

/**
 * Convierte filtros del frontend al formato de la API
 */
function convertFiltersToApi(filters: AppointmentFilters): AppointmentFiltersDto {
  const apiFilters: AppointmentFiltersDto = {};

  if (filters.status) {
    apiFilters.status = filters.status;
  }

  if (filters.dateRange) {
    const [startDate, endDate] = filters.dateRange;
    apiFilters.startDate = startDate.toISOString();
    apiFilters.endDate = endDate.toISOString();
  }

  if (filters.offeringId) {
    apiFilters.offeringId = filters.offeringId;
  }

  return apiFilters;
}

/**
 * Appointments API Service
 * Expone métodos para interactuar con el endpoint de appointments
 */
export const appointmentsApi = {
  /**
   * Obtiene todas las citas con filtros opcionales
   * @param filters - Filtros para aplicar a la consulta
   * @returns Promise con array de citas
   */
  async getAll(filters?: AppointmentFilters): Promise<AppointmentDto[]> {
    const params = filters ? convertFiltersToApi(filters) : undefined;
    
    const { data } = await apiClient.get<AppointmentDto[]>(
      ENDPOINTS.APPOINTMENTS.LIST,
      { params }
    );
    
    return data;
  },

  /**
   * Obtiene una cita por su ID
   * @param id - ID de la cita
   * @returns Promise con la cita o null si no existe
   */
  async getById(id: string): Promise<AppointmentDto | null> {
    try {
      const { data } = await apiClient.get<AppointmentDto>(
        ENDPOINTS.APPOINTMENTS.DETAIL(id)
      );
      
      return data;
    } catch (error: any) {
      // Si es 404, retornar null en lugar de lanzar error
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Cancela una cita
   * @param id - ID de la cita a cancelar
   * @returns Promise que se resuelve cuando la cancelación es exitosa
   */
  async cancel(id: string): Promise<void> {
    await apiClient.put(ENDPOINTS.APPOINTMENTS.CANCEL(id));
  },

  /**
   * Obtiene las citas de hoy
   * @returns Promise con array de citas de hoy
   */
  async getToday(): Promise<AppointmentDto[]> {
    const { data } = await apiClient.get<AppointmentDto[]>(
      ENDPOINTS.APPOINTMENTS.TODAY
    );
    
    return data;
  },

  /**
   * Obtiene las próximas citas
   * @returns Promise con array de próximas citas
   */
  async getUpcoming(): Promise<AppointmentDto[]> {
    const { data } = await apiClient.get<AppointmentDto[]>(
      ENDPOINTS.APPOINTMENTS.UPCOMING
    );
    
    return data;
  },
};
