/**
 * Appointment Entity Types
 * 
 * Este módulo define los tipos relacionados con las citas (appointments).
 * Los tipos principales se importan desde @packages/shared-types
 * para mantener consistencia con el contrato de API.
 */

import type { 
  AppointmentDto, 
  AppointmentStatus,
  AppointmentFiltersDto 
} from '@packages/shared-types';

/**
 * AppointmentReadModel - Representa una cita en el sistema
 * Importado desde shared-types para mantener consistencia con el backend
 */
export type AppointmentReadModel = AppointmentDto;

/**
 * AppointmentFilters - Filtros para consultar citas
 * Usado en el frontend para filtrar la lista de citas
 */
export interface AppointmentFilters {
  status?: AppointmentStatus;
  dateRange?: [Date, Date] | null;
  offeringId?: string | null;
}

/**
 * AppointmentFiltersApi - Filtros en formato API
 * Convierte los filtros del frontend al formato esperado por la API
 */
export type AppointmentFiltersApi = AppointmentFiltersDto;

/**
 * Re-export AppointmentStatus para conveniencia
 */
export type { AppointmentStatus };
