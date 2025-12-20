/**
 * Shared API exports
 * Centralized exports for API-related modules
 *
 * ⚠️ IMPORTANTE: Este módulo NO re-exporta tipos del contrato de API.
 *
 * 📦 Para DTOs del backend, importar DIRECTAMENTE desde:
 *   import type { AppointmentDto, OfferingDto } from '@packages/shared-types';
 *
 * ✅ Este módulo solo exporta:
 * - apiClient: Cliente HTTP configurado
 * - ENDPOINTS: Constantes de URLs
 * - Tipos específicos del frontend (UI state, agregaciones)
 *
 * 📚 Convención de imports:
 *   @packages/* → packages/ del monorepo (compartido entre apps)
 *   @shared/*   → src/shared/ de esta app (interno)
 *
 * Ver: docs/conventions/import-conventions.md
 */

export { apiClient } from "./client";
export { ENDPOINTS } from "./endpoints";
export { customersApi } from "./customers";

// Solo tipos específicos del frontend (NO DTOs del backend)
export type {
  DashboardStats,
  AppointmentFilters,
  ScheduleReadModel,
  BlockoutReadModel,
  ConversationReadModel,
  MessageReadModel,
} from "./types";
