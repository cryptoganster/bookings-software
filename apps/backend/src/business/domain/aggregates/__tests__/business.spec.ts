import { describe, it, expect, beforeEach } from '@jest/globals';
import { Business } from '../business';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';
import { Timezone } from '../../vo/timezone';
import { BusinessAddress } from '../../vo/business-address';
import { InvalidBusinessNameException } from '../../exceptions/invalid-business-name';
import { BusinessCreated } from '../../events/business-created';
import { BusinessInfoUpdated } from '../../events/business-info-updated';
import { BusinessWhatsAppConfigured } from '../../events/business-whatsapp-configured';
import { BusinessDeactivated } from '../../events/business-deactivated';
import { BusinessActivated } from '../../events/business-activated';

describe('Business Aggregate', () => {
  let id: UUID;
  let ownerId: UUID;
  let name: string;
  let whatsappPhone: WhatsAppPhone;
  let address: BusinessAddress;
  let timezone: Timezone;

  beforeEach(() => {
    id = UUID.generate();
    ownerId = UUID.generate();
    name = 'Test Business';
    whatsappPhone = WhatsAppPhone.fromString('+18095551234');
    address = BusinessAddress.create('123 Main St', 'Santo Domingo');
    timezone = Timezone.create('America/Santo_Domingo');
  });

  describe('create', () => {
    it('should create Business with valid data and publish event', () => {
      // Arrange & Act
      const business = Business.create(id, ownerId, name, whatsappPhone, address, timezone);

      // Assert
      expect(business).toBeDefined();
      expect(business.getId()).toEqual(id);
      expect(business.getOwnerId()).toEqual(ownerId);
      expect(business.getName()).toBe('Test Business');
      expect(business.getWhatsAppPhone()).toEqual(whatsappPhone);
      expect(business.getAddress()).toEqual(address);
      expect(business.getTimezone()).toEqual(timezone);
      expect(business.getIsActive()).toBe(true);
      expect(business.getCreatedAt()).toBeInstanceOf(Date);
      expect(business.getVersion().getValue()).toBe(1);

      // Note: Events are auto-published with autoCommit=true, so getUncommittedEvents() returns empty
      // The BusinessCreated event was published, but we can't check it in unit tests without EventBus integration
      // We verify the aggregate state instead
    });

    it('should trim business name', () => {
      // Arrange & Act
      const business = Business.create(
        id,
        ownerId,
        '  Test Business  ',
        whatsappPhone,
        address,
        timezone,
      );

      // Assert
      expect(business.getName()).toBe('Test Business');
    });

    it('should throw InvalidBusinessNameException when name is empty', () => {
      // Arrange & Act & Assert
      expect(() => Business.create(id, ownerId, '', whatsappPhone, address, timezone)).toThrow(
        InvalidBusinessNameException,
      );
    });

    it('should throw InvalidBusinessNameException when name is only whitespace', () => {
      // Arrange & Act & Assert
      expect(() => Business.create(id, ownerId, '   ', whatsappPhone, address, timezone)).toThrow(
        InvalidBusinessNameException,
      );
    });

    it('should throw InvalidBusinessNameException when name is less than 3 characters', () => {
      // Arrange & Act & Assert
      expect(() => Business.create(id, ownerId, 'AB', whatsappPhone, address, timezone)).toThrow(
        InvalidBusinessNameException,
      );
    });

    it('should throw InvalidBusinessNameException when name exceeds 100 characters', () => {
      // Arrange
      const longName = 'A'.repeat(101);

      // Act & Assert
      expect(() =>
        Business.create(id, ownerId, longName, whatsappPhone, address, timezone),
      ).toThrow(InvalidBusinessNameException);
    });

    it('should accept name with exactly 3 characters', () => {
      // Arrange & Act
      const business = Business.create(id, ownerId, 'ABC', whatsappPhone, address, timezone);

      // Assert
      expect(business.getName()).toBe('ABC');
    });

    it('should accept name with exactly 100 characters', () => {
      // Arrange
      const maxName = 'A'.repeat(100);

      // Act
      const business = Business.create(id, ownerId, maxName, whatsappPhone, address, timezone);

      // Assert
      expect(business.getName()).toBe(maxName);
    });
  });

  describe('updateInfo', () => {
    it('should update business information', () => {
      // Arrange
      const business = Business.create(id, ownerId, name, whatsappPhone, address, timezone);

      const newName = 'Updated Business';
      const newAddress = BusinessAddress.create('456 Oak Ave', 'Santiago');
      const newTimezone = Timezone.create('America/New_York');

      // Act
      business.updateInfo(newName, newAddress, newTimezone);

      // Assert
      expect(business.getName()).toBe('Updated Business');
      expect(business.getAddress()).toEqual(newAddress);
      expect(business.getTimezone()).toEqual(newTimezone);
      expect(business.getVersion().getValue()).toBe(2);

      // Note: Events are auto-published with autoCommit=true
      // The BusinessInfoUpdated event was published, but we verify the aggregate state instead
    });

    it('should trim updated name', () => {
      // Arrange
      const business = Business.create(id, ownerId, name, whatsappPhone, address, timezone);

      // Act
      business.updateInfo('  Updated Business  ', address, timezone);

      // Assert
      expect(business.getName()).toBe('Updated Business');
    });

    it('should increment version', () => {
      // Arrange
      const business = Business.create(id, ownerId, name, whatsappPhone, address, timezone);
      const initialVersion = business.getVersion().getValue();

      // Act
      business.updateInfo('Updated Business', address, timezone);

      // Assert
      expect(business.getVersion().getValue()).toBe(initialVersion + 1);
    });

    it('should throw InvalidBusinessNameException when updated name is empty', () => {
      // Arrange
      const business = Business.create(id, ownerId, name, whatsappPhone, address, timezone);

      // Act & Assert
      expect(() => business.updateInfo('', address, timezone)).toThrow(
        InvalidBusinessNameException,
      );
    });

    it('should throw InvalidBusinessNameException when updated name is too short', () => {
      // Arrange
      const business = Business.create(id, ownerId, name, whatsappPhone, address, timezone);

      // Act & Assert
      expect(() => business.updateInfo('AB', address, timezone)).toThrow(
        InvalidBusinessNameException,
      );
    });

    it('should throw InvalidBusinessNameException when updated name is too long', () => {
      // Arrange
      const business = Business.create(id, ownerId, name, whatsappPhone, address, timezone);
      const longName = 'A'.repeat(101);

      // Act & Assert
      expect(() => business.updateInfo(longName, address, timezone)).toThrow(
        InvalidBusinessNameException,
      );
    });
  });

  describe('configureWhatsApp', () => {
    it('should configure WhatsApp phone number', () => {
      // Arrange
      const business = Business.create(id, ownerId, name, whatsappPhone, address, timezone);

      const newWhatsappPhone = WhatsAppPhone.fromString('+18095559999');

      // Act
      business.configureWhatsApp(newWhatsappPhone);

      // Assert
      expect(business.getWhatsAppPhone()).toEqual(newWhatsappPhone);
      expect(business.getVersion().getValue()).toBe(2);

      // Note: Events are auto-published with autoCommit=true
      // The BusinessWhatsAppConfigured event was published, but we verify the aggregate state instead
    });

    it('should increment version', () => {
      // Arrange
      const business = Business.create(id, ownerId, name, whatsappPhone, address, timezone);
      const initialVersion = business.getVersion().getValue();

      const newWhatsappPhone = WhatsAppPhone.fromString('+18095559999');

      // Act
      business.configureWhatsApp(newWhatsappPhone);

      // Assert
      expect(business.getVersion().getValue()).toBe(initialVersion + 1);
    });
  });

  describe('deactivate', () => {
    it('should deactivate active business', () => {
      // Arrange
      const business = Business.create(id, ownerId, name, whatsappPhone, address, timezone);

      // Act
      business.deactivate();

      // Assert
      expect(business.getIsActive()).toBe(false);
      expect(business.getVersion().getValue()).toBe(2);

      // Note: Events are auto-published with autoCommit=true
      // The BusinessDeactivated event was published, but we verify the aggregate state instead
    });

    it('should be idempotent (no version change when already deactivated)', () => {
      // Arrange
      const business = Business.create(id, ownerId, name, whatsappPhone, address, timezone);
      business.deactivate();

      const versionBeforeSecondDeactivate = business.getVersion().getValue();

      // Act
      business.deactivate();

      // Assert
      expect(business.getIsActive()).toBe(false);
      expect(business.getVersion().getValue()).toBe(versionBeforeSecondDeactivate);
    });
  });

  describe('activate', () => {
    it('should activate deactivated business', () => {
      // Arrange
      const business = Business.create(id, ownerId, name, whatsappPhone, address, timezone);
      business.deactivate();

      // Act
      business.activate();

      // Assert
      expect(business.getIsActive()).toBe(true);
      expect(business.getVersion().getValue()).toBe(3);

      // Note: Events are auto-published with autoCommit=true
      // The BusinessActivated event was published, but we verify the aggregate state instead
    });

    it('should be idempotent (no version change when already active)', () => {
      // Arrange
      const business = Business.create(id, ownerId, name, whatsappPhone, address, timezone);

      const versionBeforeSecondActivate = business.getVersion().getValue();

      // Act
      business.activate();

      // Assert
      expect(business.getIsActive()).toBe(true);
      expect(business.getVersion().getValue()).toBe(versionBeforeSecondActivate);
    });
  });

  describe('fromPersistence', () => {
    it('should reconstruct Business from persistence with version', () => {
      // Arrange
      const persistedVersion = 5;

      // Act
      const business = Business.fromPersistence(
        id,
        ownerId,
        name,
        whatsappPhone,
        address,
        timezone,
        true,
        new Date(),
        persistedVersion,
      );

      // Assert
      expect(business).toBeDefined();
      expect(business.getId()).toEqual(id);
      expect(business.getOwnerId()).toEqual(ownerId);
      expect(business.getName()).toBe(name);
      expect(business.getWhatsAppPhone()).toEqual(whatsappPhone);
      expect(business.getAddress()).toEqual(address);
      expect(business.getTimezone()).toEqual(timezone);
      expect(business.getIsActive()).toBe(true);
      expect(business.getVersion().getValue()).toBe(persistedVersion);
    });

    it('should reconstruct deactivated Business', () => {
      // Arrange & Act
      const business = Business.fromPersistence(
        id,
        ownerId,
        name,
        whatsappPhone,
        address,
        timezone,
        false, // isActive = false
        new Date(),
        3,
      );

      // Assert
      expect(business.getIsActive()).toBe(false);
    });
  });

  describe('version increments', () => {
    it('should increment version by 1 on each state change', () => {
      // Arrange
      const business = Business.create(id, ownerId, name, whatsappPhone, address, timezone);

      // Assert initial version
      expect(business.getVersion().getValue()).toBe(1);

      // Act & Assert - updateInfo
      business.updateInfo('Updated', address, timezone);
      expect(business.getVersion().getValue()).toBe(2);

      // Act & Assert - configureWhatsApp
      business.configureWhatsApp(WhatsAppPhone.fromString('+18095559999'));
      expect(business.getVersion().getValue()).toBe(3);

      // Act & Assert - deactivate
      business.deactivate();
      expect(business.getVersion().getValue()).toBe(4);

      // Act & Assert - activate
      business.activate();
      expect(business.getVersion().getValue()).toBe(5);
    });
  });
});
