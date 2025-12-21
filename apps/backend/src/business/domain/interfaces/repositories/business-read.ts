import { BusinessReadModel } from '@business/domain/read-models/business';

/**
 * IBusinessReadRepository
 *
 * Read repository interface for Business queries
 * Following CQRS strict pattern - only read operations
 * Returns read models (DTOs) optimized for queries
 */
export interface IBusinessReadRepository {
  /**
   * Finds a business by ID
   * @param id Business ID
   * @returns Business read model or null if not found
   */
  findById(id: string): Promise<BusinessReadModel | null>;

  /**
   * Finds all businesses owned by a user
   * @param ownerId User ID (references User.id)
   * @returns Array of business read models
   */
  findByOwnerId(ownerId: string): Promise<BusinessReadModel[]>;

  /**
   * Finds a business by WhatsApp phone number
   * Used by Conversation BC to identify business from incoming messages
   * @param whatsappPhone WhatsApp phone in E.164 format
   * @returns Business read model or null if not found
   */
  findByWhatsAppPhone(whatsappPhone: string): Promise<BusinessReadModel | null>;
}
