import { VersionedAggregateRoot } from '@shared/kernel/versioned-aggregate-root';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';
import { Timezone } from '@business/domain/vo/timezone';
import { BusinessAddress } from '@business/domain/vo/business-address';
import {
  BusinessCreated,
  BusinessInfoUpdated,
  BusinessWhatsAppConfigured,
  BusinessDeactivated,
  BusinessActivated,
} from '@business/domain/events';
import { InvalidBusinessNameException } from '@business/domain/exceptions/invalid-business-name';

/**
 * Business Aggregate Root
 *
 * Represents a specific business with its configuration and contact information.
 * A User can own multiple Business entities according to their subscription plan.
 *
 * Business Rules:
 * - Business name must be between 3 and 100 characters
 * - WhatsApp number must be globally unique
 * - Business is owned by a User (ownerId → User.id, NOT BusinessOwner.id)
 * - Business can be activated/deactivated
 * - Inactive businesses cannot accept new appointments
 */
export class Business extends VersionedAggregateRoot {
  private id!: UUID;
  private ownerId!: UUID; // ← References User.id (NOT BusinessOwner.id)
  private name!: string;
  private whatsappPhone!: WhatsAppPhone;
  private address!: BusinessAddress;
  private timezone!: Timezone;
  private isActive!: boolean;
  private createdAt!: Date;
  private updatedAt!: Date;

  /**
   * Factory method to create a new business
   * @param id Business ID
   * @param ownerId User ID of the business owner
   * @param name Business name
   * @param whatsappPhone WhatsApp Business phone
   * @param address Business address
   * @param timezone Business timezone (IANA format)
   * @returns New Business instance
   * @throws InvalidBusinessNameException if name is invalid
   */
  static create(
    id: UUID,
    ownerId: UUID,
    name: string,
    whatsappPhone: WhatsAppPhone,
    address: BusinessAddress,
    timezone: Timezone,
  ): Business {
    // Validate name
    this.validateName(name);

    const business = new Business();
    business.id = id;
    business.ownerId = ownerId;
    business.name = name.trim();
    business.whatsappPhone = whatsappPhone;
    business.address = address;
    business.timezone = timezone;
    business.isActive = true; // Active by default
    business.createdAt = new Date();
    business.updatedAt = new Date();

    // Publish event
    business.apply(
      new BusinessCreated(
        id.getValue(),
        ownerId.getValue(),
        business.name,
        whatsappPhone.getValue(),
      ),
    );
    business.incrementVersion();

    return business;
  }

  /**
   * Validates business name
   * @param name Name to validate
   * @throws InvalidBusinessNameException if name is invalid
   */
  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new InvalidBusinessNameException('Business name cannot be empty');
    }
    if (name.trim().length < 3) {
      throw new InvalidBusinessNameException('Business name must be at least 3 characters');
    }
    if (name.length > 100) {
      throw new InvalidBusinessNameException('Business name cannot exceed 100 characters');
    }
  }

  /**
   * Updates business information
   * @param name New business name
   * @param address New business address
   * @param timezone New business timezone
   * @throws InvalidBusinessNameException if name is invalid
   */
  updateInfo(name: string, address: BusinessAddress, timezone: Timezone): void {
    Business.validateName(name);

    this.name = name.trim();
    this.address = address;
    this.timezone = timezone;
    this.updatedAt = new Date();
    this.incrementVersion();

    // Publish event
    this.apply(new BusinessInfoUpdated(this.id.getValue(), this.name));
  }

  /**
   * Configures or updates WhatsApp Business phone
   * @param whatsappPhone New WhatsApp phone
   */
  configureWhatsApp(whatsappPhone: WhatsAppPhone): void {
    this.whatsappPhone = whatsappPhone;
    this.updatedAt = new Date();
    this.incrementVersion();

    // Publish event
    this.apply(new BusinessWhatsAppConfigured(this.id.getValue(), whatsappPhone.getValue()));
  }

  /**
   * Deactivates the business (prevents new appointments)
   * Idempotent operation - does nothing if already inactive
   */
  deactivate(): void {
    if (!this.isActive) {
      return; // Already inactive, idempotent
    }

    this.isActive = false;
    this.updatedAt = new Date();
    this.incrementVersion();

    // Publish event
    this.apply(new BusinessDeactivated(this.id.getValue()));
  }

  /**
   * Activates the business (allows new appointments)
   * Idempotent operation - does nothing if already active
   */
  activate(): void {
    if (this.isActive) {
      return; // Already active, idempotent
    }

    this.isActive = true;
    this.updatedAt = new Date();
    this.incrementVersion();

    // Publish event
    this.apply(new BusinessActivated(this.id.getValue()));
  }

  /**
   * Factory method to reconstruct business from persistence
   * @param id Business ID
   * @param ownerId User ID of the owner
   * @param name Business name
   * @param whatsappPhone WhatsApp phone
   * @param address Business address
   * @param timezone Business timezone
   * @param isActive Active status
   * @param createdAt Creation timestamp
   * @param updatedAt Last update timestamp
   * @param version Aggregate version
   * @returns Reconstructed Business instance
   */
  static fromPersistence(
    id: UUID,
    ownerId: UUID,
    name: string,
    whatsappPhone: WhatsAppPhone,
    address: BusinessAddress,
    timezone: Timezone,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
    version: number,
  ): Business {
    const business = new Business();
    business.id = id;
    business.ownerId = ownerId;
    business.name = name;
    business.whatsappPhone = whatsappPhone;
    business.address = address;
    business.timezone = timezone;
    business.isActive = isActive;
    business.createdAt = createdAt;
    business.updatedAt = updatedAt;
    business.setVersion(version); // ← Restore version for optimistic locking
    return business;
  }

  // Getters
  getId(): UUID {
    return this.id;
  }

  getOwnerId(): UUID {
    return this.ownerId;
  }

  getName(): string {
    return this.name;
  }

  getWhatsAppPhone(): WhatsAppPhone {
    return this.whatsappPhone;
  }

  getAddress(): BusinessAddress {
    return this.address;
  }

  getTimezone(): Timezone {
    return this.timezone;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
