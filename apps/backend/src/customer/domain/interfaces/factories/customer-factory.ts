import { Customer } from '@customer/domain/aggregates/customer';

/**
 * Factory Interface for loading Customer aggregates
 * 
 * Following Factory Pattern for CQRS:
 * - Loads aggregates from persistence for modification
 * - Returns domain aggregates with business logic
 * - Preserves version for optimistic locking
 * - Used in Command Handlers (not Query Handlers)
 * 
 * @see .kiro/steering/factory-pattern.md
 */
export interface ICustomerFactory {
  /**
   * Loads a Customer aggregate by ID for modification
   * 
   * @returns Customer aggregate with business logic and version
   * @returns null if not found
   */
  loadById(id: string): Promise<Customer | null>;

  /**
   * Loads a Customer aggregate by WhatsApp phone within a business
   * Multi-tenant: unique per (businessId, whatsappPhone)
   * 
   * @returns Customer aggregate with business logic and version
   * @returns null if not found
   */
  loadByWhatsAppPhone(
    businessId: string,
    whatsappPhone: string,
  ): Promise<Customer | null>;
}
