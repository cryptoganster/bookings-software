import { VersionedAggregateRoot } from '@shared/kernel/versioned-aggregate-root';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';
import { Timezone } from '@business/domain/vo/timezone';
import { BusinessAddress } from '@business/domain/vo/business-address';
import { BusinessCreated } from '@business/domain/events/business-created';
import { BusinessInfoUpdated } from '@business/domain/events/business-info-updated';
import { BusinessWhatsAppConfigured } from '@business/domain/events/business-whatsapp-configured';
import { BusinessDeactivated } from '@business/domain/events/business-deactivated';
import { BusinessActivated } from '@business/domain/events/business-activated';
import { InvalidBusinessNameException } from '@business/domain/exceptions/invalid-business-name';

/**
 * Business Aggregate
 *
 * Represents a business entity in the system.
 * Each business is owned by a User (ownerId → User.id).
 * A User can own multiple businesses (limited by subscription plan).
 *
 * Requirements: 1.1-1.5, 6.1-6.5, 7.1-7.5
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

  /**
   * Factory method to create a new Business
   *
   * Requirements: 1.1-1.5
   */
  static create(
    id: UUID,
    ownerId: UUID,
    name: string,
    whatsappPhone: WhatsAppPhone,
    address: BusinessAddress,
    timezone: Timezone,
  ): Business {
    // Validate business name
    if (!name || name.trim().length === 0) {
      throw new InvalidBusinessNameException('Business name cannot be empty');
    }

    if (name.trim().length < 3) {
      throw new InvalidBusinessNameException('Business name must be at least 3 characters');
    }

    if (name.trim().length > 100) {
      throw new InvalidBusinessNameException('Business name cannot exceed 100 characters');
    }

    const business = new Business();
    business.id = id;
    business.ownerId = ownerId;
    business.name = name.trim();
    business.whatsappPhone = whatsappPhone;
    business.address = address;
    business.timezone = timezone;
    business.isActive = true;
    business.createdAt = new Date();

    // Apply domain event
    business.apply(
      new BusinessCreated(id.getValue(), ownerId.getValue(), name.trim(), whatsappPhone.getValue()),
    );

    business.incrementVersion();

    return business;
  }

  /**
   * Factory method to reconstruct Business from persistence
   *
   * Requirements: 9.2
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
    business.setVersion(version);

    return business;
  }

  /**
   * Update business information
   *
   * Requirements: 10.2
   */
  updateInfo(name: string, address: BusinessAddress, timezone: Timezone): void {
    // Validate business name
    if (!name || name.trim().length === 0) {
      throw new InvalidBusinessNameException('Business name cannot be empty');
    }

    if (name.trim().length < 3) {
      throw new InvalidBusinessNameException('Business name must be at least 3 characters');
    }

    if (name.trim().length > 100) {
      throw new InvalidBusinessNameException('Business name cannot exceed 100 characters');
    }

    this.name = name.trim();
    this.address = address;
    this.timezone = timezone;

    this.incrementVersion();
    this.apply(new BusinessInfoUpdated(this.id.getValue(), name.trim()));
  }

  /**
   * Configure WhatsApp phone number
   *
   * Requirements: 3.1-3.5, 10.3
   */
  configureWhatsApp(whatsappPhone: WhatsAppPhone): void {
    this.whatsappPhone = whatsappPhone;

    this.incrementVersion();
    this.apply(new BusinessWhatsAppConfigured(this.id.getValue(), whatsappPhone.getValue()));
  }

  /**
   * Deactivate business (idempotent)
   *
   * Requirements: 6.1, 6.3
   */
  deactivate(): void {
    if (!this.isActive) {
      return; // Already deactivated, idempotent
    }

    this.isActive = false;

    this.incrementVersion();
    this.apply(new BusinessDeactivated(this.id.getValue()));
  }

  /**
   * Activate business (idempotent)
   *
   * Requirements: 6.4, 6.5
   */
  activate(): void {
    if (this.isActive) {
      return; // Already active, idempotent
    }

    this.isActive = true;

    this.incrementVersion();
    this.apply(new BusinessActivated(this.id.getValue()));
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
}
