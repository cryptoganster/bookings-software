/**
 * Common API Types
 * 
 * Este archivo re-exporta tipos desde @bookings/shared-types y define
 * tipos específicos del frontend que no pertenecen al contrato de API.
 * 
 * PRINCIPIO: Importar desde shared-types, no duplicar.
 */

// ============================================================================
// RE-EXPORTS FROM @bookings/shared-types
// ============================================================================

export type {
  // Authentication
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  UserDto,
  
  // Appointments
  AppointmentDto,
  AppointmentStatus,
  CreateAppointmentRequestDto,
  CreateAppointmentResponseDto,
  AppointmentFiltersDto,
  
  // Offerings
  OfferingDto,
  CreateOfferingRequestDto,
  
  // Customers
  CustomerDto,
  
  // Business
  BusinessDto,
  
  // Generic responses
  PaginatedResponseDto,
  ApiErrorDto,
  SuccessResponseDto,
  ErrorResponseDto,
} from '@bookings/shared-types';

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
  status?: import('@bookings/shared-types').AppointmentStatus;
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
