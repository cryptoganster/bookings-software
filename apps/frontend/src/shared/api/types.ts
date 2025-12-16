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
 * Schedule read model (not yet in shared-types)
 * TODO: Move to shared-types when backend implements schedules
 */
export interface ScheduleReadModel {
  id: string;
  businessId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

/**
 * Blockout read model (not yet in shared-types)
 * TODO: Move to shared-types when backend implements blockouts
 */
export interface BlockoutReadModel {
  id: string;
  businessId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}

/**
 * Conversation read model (not yet in shared-types)
 * TODO: Move to shared-types when backend implements conversations
 */
export interface ConversationReadModel {
  id: string;
  businessId: string;
  customerId: string;
  customerPhone: string;
  customerName: string | null;
  status: "ACTIVE" | "AWAITING_ADMIN" | "RESOLVED";
  lastMessageAt: Date;
  unreadCount: number;
}

/**
 * Message read model (not yet in shared-types)
 * TODO: Move to shared-types when backend implements messages
 */
export interface MessageReadModel {
  id: string;
  conversationId: string;
  direction: "INBOUND" | "OUTBOUND";
  content: string;
  messageType: "TEXT" | "BUTTON" | "LOCATION";
  sentAt: Date;
  isFromAdmin: boolean;
}

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
