import { VersionedAggregateRoot } from '@shared/kernel/versioned-aggregate-root';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@customer/domain/vo/whatsapp-phone';
import {
  CustomerCreated,
  CustomerNameUpdated,
  CustomerLinkedToUser,
  CustomerUnlinkedFromUser,
} from '@customer/domain/events';
import {
  InvalidCustomerDataException,
  InvalidCustomerNameException,
  CustomerAlreadyLinkedToUserException,
  CustomerNotLinkedToUserException,
} from '@customer/domain/exceptions';

/**
 * Customer Aggregate Root
 *
 * Represents a customer profile in a specific business context.
 * A customer can be anonymous (userId = null) or registered (userId = UUID).
 *
 * Business Rules:
 * - Customer is unique per (businessId, whatsappPhone)
 * - Customer can be anonymous (no User) or registered (linked to User)
 * - Name is optional but must be valid if provided
 * - Customer can be linked/unlinked to User
 */
export class Customer extends VersionedAggregateRoot {
  private id!: UUID;
  private userId!: UUID | null; // ← Optional: null = anonymous, UUID = registered
  private businessId!: UUID;
  private whatsappPhone!: WhatsAppPhone;
  private name!: string | null;
  private createdAt!: Date;
  private updatedAt!: Date;

  /**
   * Factory method to create an anonymous customer
   * @param id Customer ID
   * @param businessId Business ID
   * @param whatsappPhone WhatsApp phone number
   * @param name Optional customer name
   * @returns New Customer instance
   * @throws InvalidCustomerDataException if required fields are missing
   */
  static createAnonymous(
    id: UUID,
    businessId: UUID,
    whatsappPhone: WhatsAppPhone,
    name: string | null = null,
  ): Customer {
    // Validations
    if (!id || !businessId || !whatsappPhone) {
      throw new InvalidCustomerDataException('id, businessId and whatsappPhone are required');
    }

    // Validate name if provided
    if (name !== null) {
      this.validateName(name);
    }

    const customer = new Customer();
    customer.id = id;
    customer.userId = null; // ← Anonymous customer
    customer.businessId = businessId;
    customer.whatsappPhone = whatsappPhone;
    customer.name = name ? name.trim() : null;
    customer.createdAt = new Date();
    customer.updatedAt = new Date();

    // Publish event
    customer.apply(
      new CustomerCreated(
        id.getValue(),
        businessId.getValue(),
        whatsappPhone.getValue(),
        customer.name,
      ),
    );
    customer.incrementVersion();

    return customer;
  }

  /**
   * Validates customer name
   * @param name Name to validate
   * @throws InvalidCustomerNameException if name is invalid
   */
  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new InvalidCustomerNameException('Name cannot be empty');
    }
    if (name.length > 100) {
      throw new InvalidCustomerNameException('Name cannot exceed 100 characters');
    }
  }

  /**
   * Updates customer name
   * @param name New name
   * @throws InvalidCustomerNameException if name is invalid
   */
  updateName(name: string): void {
    Customer.validateName(name);

    const previousName = this.name;
    this.name = name.trim();
    this.updatedAt = new Date();
    this.incrementVersion();

    // Publish event
    this.apply(new CustomerNameUpdated(this.id.getValue(), this.name, previousName));
  }

  /**
   * Links customer to a User (converts anonymous to registered)
   * @param userId User ID to link
   * @throws CustomerAlreadyLinkedToUserException if already linked
   */
  linkToUser(userId: UUID): void {
    if (this.userId !== null) {
      throw new CustomerAlreadyLinkedToUserException(this.id.getValue());
    }

    this.userId = userId;
    this.updatedAt = new Date();
    this.incrementVersion();

    // Publish event
    this.apply(new CustomerLinkedToUser(this.id.getValue(), userId.getValue()));
  }

  /**
   * Unlinks customer from User (converts registered to anonymous)
   * @throws CustomerNotLinkedToUserException if not linked
   */
  unlinkFromUser(): void {
    if (this.userId === null) {
      throw new CustomerNotLinkedToUserException(this.id.getValue());
    }

    const previousUserId = this.userId;
    this.userId = null;
    this.updatedAt = new Date();
    this.incrementVersion();

    // Publish event
    this.apply(new CustomerUnlinkedFromUser(this.id.getValue(), previousUserId.getValue()));
  }

  /**
   * Checks if customer is anonymous (not linked to User)
   * @returns true if anonymous, false otherwise
   */
  isAnonymous(): boolean {
    return this.userId === null;
  }

  /**
   * Checks if customer is registered (linked to User)
   * @returns true if registered, false otherwise
   */
  isRegistered(): boolean {
    return this.userId !== null;
  }

  /**
   * Factory method to reconstruct customer from persistence
   * @param id Customer ID
   * @param userId User ID (nullable)
   * @param businessId Business ID
   * @param whatsappPhone WhatsApp phone
   * @param name Customer name (nullable)
   * @param version Aggregate version
   * @param createdAt Creation timestamp
   * @param updatedAt Last update timestamp
   * @returns Reconstructed Customer instance
   */
  static fromPersistence(
    id: UUID,
    userId: UUID | null,
    businessId: UUID,
    whatsappPhone: WhatsAppPhone,
    name: string | null,
    version: number,
    createdAt: Date,
    updatedAt: Date,
  ): Customer {
    const customer = new Customer();
    customer.id = id;
    customer.userId = userId;
    customer.businessId = businessId;
    customer.whatsappPhone = whatsappPhone;
    customer.name = name;
    customer.createdAt = createdAt;
    customer.updatedAt = updatedAt;
    customer.setVersion(version); // ← Restore version for optimistic locking
    return customer;
  }

  // Getters
  getId(): UUID {
    return this.id;
  }

  getUserId(): UUID | null {
    return this.userId;
  }

  getBusinessId(): UUID {
    return this.businessId;
  }

  getWhatsAppPhone(): WhatsAppPhone {
    return this.whatsappPhone;
  }

  getName(): string | null {
    return this.name;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
