/**
 * Shared API exports
 * Centralized exports for API-related modules
 * 
 * NOTA: Para tipos del contrato de API (DTOs), importar directamente desde:
 *   import type { AppointmentDto } from '@shared/types';
 */

export { apiClient } from './client';
export { ENDPOINTS } from './endpoints';

// Solo exportar tipos específicos del frontend
export type {
  DashboardStats,
  AppointmentFilters,
  ScheduleReadModel,
  BlockoutReadModel,
  ConversationReadModel,
  MessageReadModel,
} from './types';
