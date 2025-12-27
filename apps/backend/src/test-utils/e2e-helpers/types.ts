/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Please use the new test types from '@test-utils/helpers' instead:
 *
 * Migration guide:
 * - Import from: import { UserRole, TestUser, RegisterDto, etc. } from '@test-utils/helpers';
 * - All types are now organized by Bounded Context in helpers/types.ts
 *
 * See: apps/backend/src/test-utils/helpers/types.ts
 */

/**
 * E2E Testing Types
 *
 * Type definitions for E2E testing infrastructure
 */

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
  initialRole?: UserRole; // Cambiado de role a initialRole y hecho opcional
}

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

export interface CreateCustomerDto {
  businessId: string;
  whatsappPhone: string;
  name?: string;
}

export interface CreateTestUserOptions {
  name?: string;
  businessData?: Partial<CreateBusinessDto>;
  customerData?: Partial<CreateCustomerDto>;
}

export interface LoginResponse {
  token: string; // Changed from accessToken to token to match shared-types
  user: {
    id: string;
    email: string;
    name: string;
    roles: UserRole[];
  };
}

export interface RegisterResponse {
  userId: string; // El registro devuelve userId directamente
  token: string; // Changed from accessToken to token to match shared-types
}
