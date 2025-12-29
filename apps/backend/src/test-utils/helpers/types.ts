/**
 * Test Helper Types
 *
 * Type definitions for test helpers organized by Bounded Context.
 * This file consolidates all type definitions used across test utilities.
 */

// ============================================================================
// Auth BC Types
// ============================================================================

export enum UserRole {
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
  role: UserRole | UserRole[];
  businessId?: string;
  customerId?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  initialRole?: UserRole;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    roles: UserRole[];
  };
}

export interface RegisterResponse {
  userId: string;
  token: string;
}

// ============================================================================
// Account BC Types
// ============================================================================

export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export interface CreateBusinessOwnerDto {
  userId: string;
  subscriptionPlan?: SubscriptionPlan;
}

// ============================================================================
// Business BC Types
// ============================================================================

export interface AddressDto {
  street: string;
  city: string;
  state?: string | null;
  country: string;
  postalCode?: string | null;
}

export interface CreateBusinessDto {
  name: string;
  whatsappNumber: string;
  address: AddressDto;
  timezone: string;
}

export interface ConfigureWhatsAppDto {
  whatsappNumber: string;
}

// ============================================================================
// Customer BC Types
// ============================================================================

export interface CreateCustomerDto {
  businessId: string;
  whatsappPhone: string;
  name?: string;
  userId?: string | null;
}

// ============================================================================
// Offering BC Types
// ============================================================================

export interface CreateOfferingDto {
  businessId: string;
  name: string;
  duration: number;
  maxCapacityPerSlot: number;
  maxDailyCapacity?: number | null;
  isActive?: boolean;
}

// ============================================================================
// Availability BC Types
// ============================================================================

export interface CreateCapacityDto {
  offeringId: string;
  date: Date;
  availableSlots: number;
  totalSlots: number;
}

export interface CreateScheduleDto {
  businessId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface CreateBlockoutDto {
  businessId: string;
  startDate?: Date;
  endDate?: Date;
  reason?: string;
}

// ============================================================================
// Booking BC Types
// ============================================================================

export interface CreateAppointmentDto {
  id?: string;
  businessId: string;
  customerId: string;
  offeringId: string;
  dateTime?: Date;
  status?: string;
  version?: number;
  cancelledAt?: Date | null;
}

export interface ModifyAppointmentDto {
  dateTime: Date;
}

// ============================================================================
// Conversation BC Types
// ============================================================================

export interface CreateConversationDto {
  id?: string;
  businessId: string;
  customerId: string;
  customerPhone: string;
  status?: string;
  state?: string;
  selectedOfferingId?: string;
  selectedDate?: string;
  selectedTime?: string;
  createdAppointmentId?: string;
  lastMessageAt?: Date;
  version?: number;
}

export interface CreateMessageDto {
  id?: string;
  conversationId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  messageType?: string;
  sentAt?: Date;
  isFromAdmin?: boolean;
}

// ============================================================================
// Composite Types (for backward compatibility and convenience)
// ============================================================================

export interface CreateTestUserOptions {
  name?: string;
  businessData?: Partial<CreateBusinessDto>;
  customerData?: Partial<CreateCustomerDto>;
}
