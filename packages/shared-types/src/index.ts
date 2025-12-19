/**
 * @bookings/shared-types
 *
 * API CONTRACT LAYER - Siguiendo Clean Architecture y DDD
 *
 * Este package define el CONTRATO entre Backend y Frontend.
 * Representa la capa de "Ports" en Hexagonal Architecture.
 *
 * PRINCIPIOS:
 * 1. Backend y Frontend dependen de ESTE contrato (Dependency Inversion)
 * 2. Este package NO depende de backend ni frontend
 * 3. Define la forma de los datos que viajan por la API (DTOs)
 * 4. Es la "verdad única" para la comunicación entre capas
 *
 * ARQUITECTURA:
 *
 *     ┌─────────────────────────────────────────┐
 *     │         @bookings/shared-types          │
 *     │         (API Contract Layer)            │
 *     │    - DTOs de Request/Response           │
 *     │    - Tipos de dominio públicos          │
 *     └─────────────────────────────────────────┘
 *                ↑                    ↑
 *                │                    │
 *        depende │                    │ depende
 *                │                    │
 *     ┌──────────┴──────────┐  ┌─────┴──────────┐
 *     │   Backend (NestJS)  │  │  Frontend (React)│
 *     │   - Implementa DTOs │  │  - Consume DTOs  │
 *     │   - Mapea a Domain  │  │  - Usa para API  │
 *     └─────────────────────┘  └──────────────────┘
 *
 * VENTAJAS:
 * ✅ Sin acoplamiento entre backend y frontend
 * ✅ Backend puede cambiar su dominio interno sin afectar frontend
 * ✅ Frontend puede cambiar su UI sin afectar backend
 * ✅ Contrato explícito y versionable
 * ✅ Reutilizable en múltiples frontends (web, mobile, etc.)
 */

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

/**
 * DTO para login request
 */
export interface LoginRequestDto {
  email: string;
  password: string;
}

/**
 * DTO para login response
 *
 * @remarks
 * - businessId removed: Use Business.ownerId → User.id instead
 * - roles array is included in UserDto
 * - isActive and emailVerified are included in UserDto
 */
export interface LoginResponseDto {
  user: UserDto;
  token: string;
}

/**
 * DTO para register request
 */
export interface RegisterRequestDto {
  email: string;
  password: string;
  name: string;
}

/**
 * Roles de usuario disponibles
 */
export type UserRole = "BUSINESS_OWNER" | "CUSTOMER" | "ADMIN";

/**
 * User DTO - Representa un usuario en la API
 */
export interface UserDto {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string; // ISO 8601 string
}

// ============================================================================
// APPOINTMENTS
// ============================================================================

/**
 * Appointment DTO - Representa una cita en la API
 */
export interface AppointmentDto {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string;
  offeringId: string;
  offeringName: string;
  dateTime: string; // ISO 8601 string
  status: AppointmentStatus;
  createdAt: string; // ISO 8601 string
  cancelledAt: string | null; // ISO 8601 string
}

/**
 * Status de una cita
 */
export type AppointmentStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";

/**
 * DTO para crear una cita
 */
export interface CreateAppointmentRequestDto {
  customerId: string;
  offeringId: string;
  dateTime: string; // ISO 8601 string
}

/**
 * DTO para respuesta de creación de cita
 */
export interface CreateAppointmentResponseDto {
  appointmentId: string;
}

/**
 * Filtros para listar citas (query params)
 */
export interface AppointmentFiltersDto {
  status?: AppointmentStatus;
  startDate?: string; // ISO 8601 string
  endDate?: string; // ISO 8601 string
  offeringId?: string;
  customerId?: string;
}

// ============================================================================
// OFFERINGS (SERVICES)
// ============================================================================

/**
 * Offering DTO - Representa un servicio ofrecido
 */
export interface OfferingDto {
  id: string;
  businessId: string;
  name: string;
  duration: number; // minutos
  maxCapacityPerSlot: number;
  maxDailyCapacity: number | null;
  isActive: boolean;
  createdAt: string; // ISO 8601 string
}

/**
 * DTO para crear un offering
 */
export interface CreateOfferingRequestDto {
  name: string;
  duration: number;
  maxCapacityPerSlot: number;
  maxDailyCapacity?: number;
}

// ============================================================================
// CUSTOMERS
// ============================================================================

/**
 * Customer DTO - Representa un cliente
 */
export interface CustomerDto {
  id: string;
  businessId: string;
  whatsappPhone: string;
  name: string | null;
  createdAt: string; // ISO 8601 string
}

/**
 * Customer Read Model - Modelo de lectura enriquecido para queries
 * Incluye datos desnormalizados para optimizar la UI
 */
export interface CustomerReadModel {
  id: string;
  businessId: string;
  userId: string | null; // null = anónimo, UUID = registrado
  whatsappPhone: string;
  name: string | null;
  appointmentCount?: number; // Número de citas del cliente
  lastAppointmentDate?: string | null; // ISO 8601 string
  createdAt: string; // ISO 8601 string
}

// ============================================================================
// BUSINESS
// ============================================================================

/**
 * Business DTO - Representa un negocio
 */
export interface BusinessDto {
  id: string;
  ownerId: string;
  name: string;
  whatsappNumber: string;
  address: string | null;
  timezone: string;
  createdAt: string; // ISO 8601 string
}

// ============================================================================
// GENERIC API RESPONSES
// ============================================================================

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Error de API (formato NestJS)
 */
export interface ApiErrorDto {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string; // ISO 8601 string
  path?: string;
}

/**
 * Respuesta de éxito genérica
 */
export interface SuccessResponseDto<T = void> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Respuesta de error genérica
 */
export interface ErrorResponseDto {
  success: false;
  error: ApiErrorDto;
}
