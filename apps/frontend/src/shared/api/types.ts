/**
 * Frontend-Specific API Types
 * 
 * Este archivo SOLO contiene tipos específicos del frontend que NO pertenecen
 * al contrato de API (shared-types).
 * 
 * PRINCIPIO: Para tipos del contrato de API, importar directamente desde
 * @shared/types en lugar de re-exportarlos aquí.
 * 
 * Ejemplo:
 *   import type { AppointmentDto } from '@shared/types';
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
  status?: import('@shared/types').AppointmentStatus;
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
  status: 'ACTIVE' | 'AWAITING_ADMIN' | 'RESOLVED';
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
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  messageType: 'TEXT' | 'BUTTON' | 'LOCATION';
  sentAt: Date;
  isFromAdmin: boolean;
}
