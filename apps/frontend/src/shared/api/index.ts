/**
 * Shared API exports
 * Centralized exports for API-related modules
 * 
 * NOTA: Para tipos del contrato de API (DTOs), importar directamente desde:
 *   import type { AppointmentDto } from '@packages/shared-types';
 * 
 * Convención de imports:
 *   @packages/* → packages/ del monorepo (compartido entre apps)
 *   @shared/*   → src/shared/ de esta app (interno)
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
