// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  businessId: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Appointment Types
export type AppointmentStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface AppointmentReadModel {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string;
  offeringId: string;
  offeringName: string;
  dateTime: Date;
  status: AppointmentStatus;
  createdAt: Date;
  cancelledAt: Date | null;
}

export interface CreateAppointmentDto {
  customerId: string;
  offeringId: string;
  dateTime: Date;
}

// Offering Types
export interface OfferingReadModel {
  id: string;
  businessId: string;
  name: string;
  duration: number;
  maxCapacityPerSlot: number;
  maxDailyCapacity: number | null;
  isActive: boolean;
}

// Customer Types
export interface CustomerReadModel {
  id: string;
  businessId: string;
  whatsappPhone: string;
  name: string | null;
  createdAt: Date;
}

// Business Types
export interface BusinessReadModel {
  id: string;
  ownerId: string;
  name: string;
  whatsappNumber: string;
  address: string | null;
  timezone: string;
  createdAt: Date;
}

// Filter Types
export interface AppointmentFilters {
  status?: AppointmentStatus;
  dateRange?: [Date, Date];
  offeringId?: string;
}

// API Response Types
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
