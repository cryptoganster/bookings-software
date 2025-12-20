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

export interface CreateBusinessDto {
  name: string;
  whatsappNumber: string;
  address: string;
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
  accessToken: string; // Revertido a accessToken
  user: {
    id: string;
    email: string;
    name: string;
    roles: UserRole[];
  };
}

export interface RegisterResponse {
  userId: string; // El registro devuelve userId directamente
  accessToken: string; // Y accessToken
}
