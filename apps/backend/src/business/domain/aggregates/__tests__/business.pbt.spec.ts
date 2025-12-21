import * as fc from 'fast-check';
import { Business } from '../business';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';
import { Timezone } from '../../vo/timezone';
import { BusinessAddress } from '../../vo/business-address';

/**
 * Property-Based Tests for Business Aggregate
 *
 * These tests verify universal properties that should hold true
 * for all valid inputs, using fast-check to generate random test cases.
 *
 * Feature: business-bc
 */
describe('Business Aggregate - Property-Based Tests', () => {
  // Arbitraries (generators for random test data)
  const uuidArb = fc.constant(null).map(() => UUID.generate());

  const whatsappPhoneArb = fc
    .integer({ min: 10000000, max: 999999999999 })
    .map((num) => WhatsAppPhone.fromString(`+1${num}`));

  const businessNameArb = fc
    .string({ minLength: 3, maxLength: 100 })
    .filter((s) => s.trim().length >= 3);

  // Generate valid IANA timezones
  const validTimezones = Intl.supportedValuesOf('timeZone');
  const timezoneArb = fc.constantFrom(...validTimezones).map((tz) => Timezone.create(tz));

  const businessAddressArb = fc
    .record({
      street: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
      city: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
      state: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
      country: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
      postalCode: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
    })
    .map((addr) =>
      BusinessAddress.create(addr.street, addr.city, addr.state, addr.country, addr.postalCode),
    );

  /**
   * Property 1: Timezone round-trip
   *
   * For any valid IANA timezone string, creating Timezone VO and
   * calling getValue() should return the same string.
   *
   * Feature: business-bc, Property 1: Timezone round-trip
   * Validates: Requirements 4.1, 4.3
   */
  describe('Property 1: Timezone round-trip', () => {
    it('should return the same timezone string after round-trip', () => {
      fc.assert(
        fc.property(fc.constantFrom(...validTimezones), (timezoneString) => {
          // Act
          const timezone = Timezone.create(timezoneString);

          // Assert
          expect(timezone.getValue()).toBe(timezoneString);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 2: BusinessAddress equality
   *
   * For any two BusinessAddress VOs with same values, equals()
   * should return true.
   *
   * Feature: business-bc, Property 2: BusinessAddress equality
   * Validates: Requirements 5.1, 5.2, 8.4
   */
  describe('Property 2: BusinessAddress equality', () => {
    it('should return true for two addresses with same values', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
          (street, city, state, country, postalCode) => {
            // Act
            const address1 = BusinessAddress.create(street, city, state, country, postalCode);
            const address2 = BusinessAddress.create(street, city, state, country, postalCode);

            // Assert
            expect(address1.equals(address2)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should return false for addresses with different values', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          (street1, city1, street2, city2) => {
            // Ensure streets or cities are different
            fc.pre(street1 !== street2 || city1 !== city2);

            // Act
            const address1 = BusinessAddress.create(street1, city1);
            const address2 = BusinessAddress.create(street2, city2);

            // Assert
            expect(address1.equals(address2)).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 3: Business version increments
   *
   * For any Business aggregate, applying any domain operation
   * should increment version by exactly 1.
   *
   * Feature: business-bc, Property 3: Business version increments
   * Validates: Requirements 7.3
   */
  describe('Property 3: Business version increments', () => {
    it('should increment version by 1 when updating info', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          businessNameArb,
          whatsappPhoneArb,
          businessAddressArb,
          timezoneArb,
          businessNameArb,
          businessAddressArb,
          timezoneArb,
          (id, ownerId, name, phone, address, timezone, newName, newAddress, newTimezone) => {
            // Arrange
            const business = Business.create(id, ownerId, name, phone, address, timezone);
            const versionBeforeUpdate = business.getVersion().getValue();

            // Act
            business.updateInfo(newName, newAddress, newTimezone);

            // Assert
            expect(business.getVersion().getValue()).toBe(versionBeforeUpdate + 1);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should increment version by 1 when configuring WhatsApp', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          businessNameArb,
          whatsappPhoneArb,
          businessAddressArb,
          timezoneArb,
          whatsappPhoneArb,
          (id, ownerId, name, phone, address, timezone, newPhone) => {
            // Arrange
            const business = Business.create(id, ownerId, name, phone, address, timezone);
            const versionBeforeUpdate = business.getVersion().getValue();

            // Act
            business.configureWhatsApp(newPhone);

            // Assert
            expect(business.getVersion().getValue()).toBe(versionBeforeUpdate + 1);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should increment version by 1 when deactivating', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          businessNameArb,
          whatsappPhoneArb,
          businessAddressArb,
          timezoneArb,
          (id, ownerId, name, phone, address, timezone) => {
            // Arrange
            const business = Business.create(id, ownerId, name, phone, address, timezone);
            const versionBeforeDeactivate = business.getVersion().getValue();

            // Act
            business.deactivate();

            // Assert
            expect(business.getVersion().getValue()).toBe(versionBeforeDeactivate + 1);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should increment version by 1 when activating after deactivation', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          businessNameArb,
          whatsappPhoneArb,
          businessAddressArb,
          timezoneArb,
          (id, ownerId, name, phone, address, timezone) => {
            // Arrange
            const business = Business.create(id, ownerId, name, phone, address, timezone);
            business.deactivate();
            const versionBeforeActivate = business.getVersion().getValue();

            // Act
            business.activate();

            // Assert
            expect(business.getVersion().getValue()).toBe(versionBeforeActivate + 1);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Additional Property: Business info update preserves identity
   *
   * For any Business, updating info should not change the
   * businessId, ownerId, or whatsappPhone.
   */
  describe('Additional Property: Info update preserves identity', () => {
    it('should preserve businessId, ownerId, and whatsappPhone when updating info', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          businessNameArb,
          whatsappPhoneArb,
          businessAddressArb,
          timezoneArb,
          businessNameArb,
          businessAddressArb,
          timezoneArb,
          (id, ownerId, name, phone, address, timezone, newName, newAddress, newTimezone) => {
            // Arrange
            const business = Business.create(id, ownerId, name, phone, address, timezone);
            const originalId = business.getId();
            const originalOwnerId = business.getOwnerId();
            const originalPhone = business.getWhatsAppPhone();

            // Act
            business.updateInfo(newName, newAddress, newTimezone);

            // Assert
            expect(business.getId()).toEqual(originalId);
            expect(business.getOwnerId()).toEqual(originalOwnerId);
            expect(business.getWhatsAppPhone()).toEqual(originalPhone);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Additional Property: Deactivate is idempotent
   *
   * For any Business, calling deactivate() multiple times should
   * only increment version once (first call).
   */
  describe('Additional Property: Deactivate is idempotent', () => {
    it('should not increment version on subsequent deactivate calls', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          businessNameArb,
          whatsappPhoneArb,
          businessAddressArb,
          timezoneArb,
          (id, ownerId, name, phone, address, timezone) => {
            // Arrange
            const business = Business.create(id, ownerId, name, phone, address, timezone);
            business.deactivate();
            const versionAfterFirstDeactivate = business.getVersion().getValue();

            // Act
            business.deactivate();
            business.deactivate();

            // Assert
            expect(business.getVersion().getValue()).toBe(versionAfterFirstDeactivate);
            expect(business.getIsActive()).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Additional Property: Activate is idempotent
   *
   * For any Business, calling activate() multiple times should
   * only increment version once (first call after deactivation).
   */
  describe('Additional Property: Activate is idempotent', () => {
    it('should not increment version on subsequent activate calls', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          businessNameArb,
          whatsappPhoneArb,
          businessAddressArb,
          timezoneArb,
          (id, ownerId, name, phone, address, timezone) => {
            // Arrange
            const business = Business.create(id, ownerId, name, phone, address, timezone);
            business.deactivate();
            business.activate();
            const versionAfterFirstActivate = business.getVersion().getValue();

            // Act
            business.activate();
            business.activate();

            // Assert
            expect(business.getVersion().getValue()).toBe(versionAfterFirstActivate);
            expect(business.getIsActive()).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Additional Property: fromPersistence preserves all fields
   *
   * For any Business reconstructed from persistence, all fields
   * should match the original values including version.
   */
  describe('Additional Property: fromPersistence preserves all fields', () => {
    it('should preserve all fields when reconstructing from persistence', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          businessNameArb,
          whatsappPhoneArb,
          businessAddressArb,
          timezoneArb,
          fc.boolean(),
          fc.integer({ min: 0, max: 1000 }),
          (id, ownerId, name, phone, address, timezone, isActive, version) => {
            // Arrange
            const createdAt = new Date('2024-01-01');

            // Act
            const business = Business.fromPersistence(
              id,
              ownerId,
              name,
              phone,
              address,
              timezone,
              isActive,
              createdAt,
              version,
            );

            // Assert
            expect(business.getId()).toEqual(id);
            expect(business.getOwnerId()).toEqual(ownerId);
            expect(business.getName()).toBe(name);
            expect(business.getWhatsAppPhone()).toEqual(phone);
            expect(business.getAddress()).toEqual(address);
            expect(business.getTimezone()).toEqual(timezone);
            expect(business.getIsActive()).toBe(isActive);
            expect(business.getCreatedAt()).toEqual(createdAt);
            expect(business.getVersion().getValue()).toBe(version);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Additional Property: Multiple operations increment version correctly
   *
   * For any sequence of operations, the version should increment
   * by the number of operations performed.
   */
  describe('Additional Property: Multiple operations increment version', () => {
    it('should increment version by number of operations performed', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          businessNameArb,
          whatsappPhoneArb,
          businessAddressArb,
          timezoneArb,
          businessNameArb,
          businessAddressArb,
          timezoneArb,
          whatsappPhoneArb,
          (
            id,
            ownerId,
            name,
            phone,
            address,
            timezone,
            newName,
            newAddress,
            newTimezone,
            newPhone,
          ) => {
            // Arrange
            const business = Business.create(id, ownerId, name, phone, address, timezone);
            const initialVersion = business.getVersion().getValue();

            // Act - Perform 4 operations
            business.updateInfo(newName, newAddress, newTimezone); // +1
            business.configureWhatsApp(newPhone); // +1
            business.deactivate(); // +1
            business.activate(); // +1

            // Assert
            expect(business.getVersion().getValue()).toBe(initialVersion + 4);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Additional Property: Business is active by default
   *
   * For any Business created with create(), isActive should be true.
   */
  describe('Additional Property: Business is active by default', () => {
    it('should have isActive=true for any newly created business', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          businessNameArb,
          whatsappPhoneArb,
          businessAddressArb,
          timezoneArb,
          (id, ownerId, name, phone, address, timezone) => {
            // Act
            const business = Business.create(id, ownerId, name, phone, address, timezone);

            // Assert
            expect(business.getIsActive()).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
