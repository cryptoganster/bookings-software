/**
 * Frontend-Specific API Types
 *
 * ⚠️ IMPORTANTE: Este archivo SOLO debe contener tipos específicos del frontend
 * que NO pertenecen al contrato de API.
 *
 * ✅ USAR ESTE ARCHIVO PARA:
 * - Tipos de UI state (filtros, preferencias, etc.)
 * - Agregaciones específicas del frontend (DashboardStats)
 * - Tipos temporales mientras el backend no los implementa (marcados con TODO)
 *
 * ❌ NO USAR ESTE ARCHIVO PARA:
 * - DTOs del backend (AppointmentDto, OfferingDto, etc.)
 * - Tipos del contrato de API
 * - Re-exportar tipos de @packages/shared-types
 *
 * 📦 PARA TIPOS DEL CONTRATO DE API:
 * Importar DIRECTAMENTE desde @packages/shared-types:
 *
 *   import type { AppointmentDto } from '@packages/shared-types';
 *
 * 📚 CONVENCIONES:
 * - @packages/* = packages/ del monorepo (compartido entre apps)
 * - @shared/*   = src/shared/ de esta app (interno)
 *
 * Ver: docs/conventions/import-conventions.md
 */

// ============================================================================
// FRONTEND-SPECIFIC TYPES
// ============================================================================

/**
 * Stats for dashboard (frontend-specific aggregation)
 */
export interface DashboardStats {
  appointmentsToday: number;
  appointmentsThisWeek: number;
  pendingQueries: number;
  occupancyRate: number;
}

/**
 * Filter options for appointments (frontend UI state)
 * Extends the API filters with UI-specific fields
 */
export interface AppointmentFilters {
  status?: import("@packages/shared-types").AppointmentStatus;
  dateRange?: [Date, Date]; // UI uses Date objects, API uses ISO strings
  offeringId?: string;
}

/**
 * ✅ ConversationReadModel and MessageReadModel are now in @packages/shared-types
 * Import them directly:
 *
 * import type {
 *   ConversationReadModel,
 *   MessageReadModel
 * } from '@packages/shared-types';
 */

// ============================================================================
// EJEMPLO DE USO CORRECTO
// ============================================================================

/**
 * ✅ CORRECTO - Importar DTOs del contrato directamente:
 *
 * import type {
 *   AppointmentDto,
 *   OfferingDto,
 *   AppointmentStatus
 * } from '@packages/shared-types';
 *
 * import type {
 *   DashboardStats,
 *   AppointmentFilters
 * } from '@shared/api/types';
 *
 * ❌ INCORRECTO - No re-exportar ni duplicar:
 *
 * // NO hacer esto:
 * export type { AppointmentDto } from '@packages/shared-types';
 *
 * // NO hacer esto:
 * export interface AppointmentDto { ... } // Duplicación
 */
