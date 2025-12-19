import { CustomerReadModel } from '@customer/domain/read-models/customer';

/**
 * Read Repository Interface for Customer Queries
 * 
 * Following CQRS strict separation:
 * - Only read operations
 * - Returns read models (DTOs), not aggregates
 * - Optimized queries with joins when needed
 */
export interface ICustomerReadRepository {
  /**
   * Find customer by ID
   * @throws CustomerNotFoundException if not found
   */
  findById(id: string): Promise<CustomerReadModel>;

  /**
   * Find customer by WhatsApp phone within a business
   * Multi-tenant: unique per (businessId, whatsappPhone)
   * 
   * @returns null if not found (doesn't throw)
   */
  findByWhatsAppPhone(
    businessId: string,
    whatsappPhone: string,
  ): Promise<CustomerReadModel | null>;

  /**
   * Find all customers for a business
   * Multi-tenant isolation
   */
  findByBusinessId(businessId: string): Promise<CustomerReadModel[]>;

  /**
   * Find all customers linked to a User
   * Marketplace support: one User can be customer in multiple businesses
   * 
   * @returns empty array if no customers found
   */
  findByUserId(userId: string): Promise<CustomerReadModel[]>;

  /**
   * Find all anonymous customers for a business
   * Anonymous = userId is null
   * 
   * @returns empty array if no anonymous customers found
   */
  findAnonymousByBusinessId(businessId: string): Promise<CustomerReadModel[]>;
}
