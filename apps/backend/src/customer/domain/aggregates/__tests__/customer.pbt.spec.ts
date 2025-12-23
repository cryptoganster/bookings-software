import * as fc from 'fast-check';
import { Customer } from '../customer';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';

/**
 * Property-Based Tests for Customer Aggregate
 *
 * These tests verify universal properties that should hold true
 * for all valid inputs, using fast-check to generate random test cases.
 */
describe('Customer Aggregate - Property-Based Tests', () => {
  // Arbitraries (generators for random test data)
  // Generate valid UUIDs using UUID.generate() instead of fc.uuid()
  // because fc.uuid() may generate UUIDs that don't pass strict v4 validation
  const uuidArb = fc.constant(null).map(() => UUID.generate());

  const whatsappPhoneArb = fc
    .integer({ min: 10000000, max: 999999999999 })
    .map((num) => WhatsAppPhone.fromString(`+1${num}`));

  const nameArb = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

  /**
   * Property 3: Customer name update preserves identity
   *
   * For any Customer, updating the name should not change the
   * customerId, businessId, or whatsappPhone.
   */
  describe('Property 3: Name update preserves identity', () => {
    it('should preserve customerId, businessId, and whatsappPhone when updating name', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          whatsappPhoneArb,
          nameArb,
          nameArb,
          (customerId, businessId, whatsappPhone, initialName, newName) => {
            // Arrange
            const customer = Customer.createAnonymous(
              customerId,
              businessId,
              whatsappPhone,
              initialName,
            );

            const originalId = customer.getId();
            const originalBusinessId = customer.getBusinessId();
            const originalPhone = customer.getWhatsAppPhone();

            // Act
            customer.updateName(newName);

            // Assert
            expect(customer.getId()).toEqual(originalId);
            expect(customer.getBusinessId()).toEqual(originalBusinessId);
            expect(customer.getWhatsAppPhone()).toEqual(originalPhone);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  /**
   * Property 7: Customer aggregate version increments
   *
   * For any Customer, applying any domain operation should
   * increment the version by exactly 1.
   */
  describe('Property 7: Version increments on operations', () => {
    it('should increment version by 1 when updating name', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          whatsappPhoneArb,
          nameArb,
          nameArb,
          (customerId, businessId, whatsappPhone, initialName, newName) => {
            // Arrange
            const customer = Customer.createAnonymous(
              customerId,
              businessId,
              whatsappPhone,
              initialName,
            );
            const versionBeforeUpdate = customer.getVersion().getValue();

            // Act
            customer.updateName(newName);

            // Assert
            expect(customer.getVersion().getValue()).toBe(versionBeforeUpdate + 1);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should increment version by 1 when linking to user', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          uuidArb,
          whatsappPhoneArb,
          fc.option(nameArb, { nil: null }),
          (customerId, businessId, userId, whatsappPhone, name) => {
            // Arrange
            const customer = Customer.createAnonymous(customerId, businessId, whatsappPhone, name);
            const versionBeforeLink = customer.getVersion().getValue();

            // Act
            customer.linkToUser(userId);

            // Assert
            expect(customer.getVersion().getValue()).toBe(versionBeforeLink + 1);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should increment version by 1 when unlinking from user', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          uuidArb,
          whatsappPhoneArb,
          fc.option(nameArb, { nil: null }),
          (customerId, businessId, userId, whatsappPhone, name) => {
            // Arrange
            const customer = Customer.createAnonymous(customerId, businessId, whatsappPhone, name);
            customer.linkToUser(userId);
            const versionBeforeUnlink = customer.getVersion().getValue();

            // Act
            customer.unlinkFromUser();

            // Assert
            expect(customer.getVersion().getValue()).toBe(versionBeforeUnlink + 1);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  /**
   * Property 8: Customer linking preserves identity
   *
   * For any Customer, linking to a User should not change the
   * customerId, businessId, whatsappPhone, or name.
   */
  describe('Property 8: Linking preserves identity', () => {
    it('should preserve all identity fields when linking to user', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          uuidArb,
          whatsappPhoneArb,
          fc.option(nameArb, { nil: null }),
          (customerId, businessId, userId, whatsappPhone, name) => {
            // Arrange
            const customer = Customer.createAnonymous(customerId, businessId, whatsappPhone, name);

            const originalId = customer.getId();
            const originalBusinessId = customer.getBusinessId();
            const originalPhone = customer.getWhatsAppPhone();
            const originalName = customer.getName();

            // Act
            customer.linkToUser(userId);

            // Assert
            expect(customer.getId()).toEqual(originalId);
            expect(customer.getBusinessId()).toEqual(originalBusinessId);
            expect(customer.getWhatsAppPhone()).toEqual(originalPhone);
            expect(customer.getName()).toBe(originalName);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  /**
   * Property 9: Customer unlinking preserves identity
   *
   * For any Customer, unlinking from a User should not change the
   * customerId, businessId, whatsappPhone, or name.
   */
  describe('Property 9: Unlinking preserves identity', () => {
    it('should preserve all identity fields when unlinking from user', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          uuidArb,
          whatsappPhoneArb,
          fc.option(nameArb, { nil: null }),
          (customerId, businessId, userId, whatsappPhone, name) => {
            // Arrange
            const customer = Customer.createAnonymous(customerId, businessId, whatsappPhone, name);
            customer.linkToUser(userId);

            const originalId = customer.getId();
            const originalBusinessId = customer.getBusinessId();
            const originalPhone = customer.getWhatsAppPhone();
            const originalName = customer.getName();

            // Act
            customer.unlinkFromUser();

            // Assert
            expect(customer.getId()).toEqual(originalId);
            expect(customer.getBusinessId()).toEqual(originalBusinessId);
            expect(customer.getWhatsAppPhone()).toEqual(originalPhone);
            expect(customer.getName()).toBe(originalName);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  /**
   * Property 10: Anonymous customer has null userId
   *
   * For any Customer created with createAnonymous(), the userId
   * should be null and isAnonymous() should return true.
   */
  describe('Property 10: Anonymous customer has null userId', () => {
    it('should have null userId and isAnonymous() true for any anonymous customer', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          whatsappPhoneArb,
          fc.option(nameArb, { nil: null }),
          (customerId, businessId, whatsappPhone, name) => {
            // Act
            const customer = Customer.createAnonymous(customerId, businessId, whatsappPhone, name);

            // Assert
            expect(customer.getUserId()).toBeNull();
            expect(customer.isAnonymous()).toBe(true);
            expect(customer.isRegistered()).toBe(false);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  /**
   * Property 11: Registered customer has non-null userId
   *
   * For any Customer that has been linked to a User, the userId
   * should be non-null and isRegistered() should return true.
   */
  describe('Property 11: Registered customer has non-null userId', () => {
    it('should have non-null userId and isRegistered() true after linking', () => {
      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          uuidArb,
          whatsappPhoneArb,
          fc.option(nameArb, { nil: null }),
          (customerId, businessId, userId, whatsappPhone, name) => {
            // Arrange
            const customer = Customer.createAnonymous(customerId, businessId, whatsappPhone, name);

            // Act
            customer.linkToUser(userId);

            // Assert
            expect(customer.getUserId()).not.toBeNull();
            expect(customer.getUserId()).toEqual(userId);
            expect(customer.isAnonymous()).toBe(false);
            expect(customer.isRegistered()).toBe(true);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  /**
   * Additional Property: fromPersistence preserves all fields
   *
   * For any Customer reconstructed from persistence, all fields
   * should match the original values including version.
   */
  describe('Additional Property: fromPersistence preserves all fields', () => {
    it('should preserve all fields when reconstructing from persistence', () => {
      fc.assert(
        fc.property(
          uuidArb,
          fc.option(uuidArb, { nil: null }),
          uuidArb,
          whatsappPhoneArb,
          fc.option(nameArb, { nil: null }),
          fc.integer({ min: 0, max: 1000 }),
          (customerId, userId, businessId, whatsappPhone, name, version) => {
            // Arrange
            const createdAt = new Date('2024-01-01');
            const updatedAt = new Date('2024-01-15');

            // Act
            const customer = Customer.fromPersistence(
              customerId,
              userId,
              businessId,
              whatsappPhone,
              name,
              version,
              createdAt,
              updatedAt,
            );

            // Assert
            expect(customer.getId()).toEqual(customerId);
            expect(customer.getUserId()).toEqual(userId);
            expect(customer.getBusinessId()).toEqual(businessId);
            expect(customer.getWhatsAppPhone()).toEqual(whatsappPhone);
            expect(customer.getName()).toBe(name);
            expect(customer.getVersion().getValue()).toBe(version);
            expect(customer.getCreatedAt()).toEqual(createdAt);
            expect(customer.getUpdatedAt()).toEqual(updatedAt);
          },
        ),
        { numRuns: 50 },
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
          uuidArb,
          whatsappPhoneArb,
          nameArb,
          nameArb,
          nameArb,
          (customerId, businessId, userId, whatsappPhone, name1, name2, name3) => {
            // Arrange
            const customer = Customer.createAnonymous(customerId, businessId, whatsappPhone, name1);
            const initialVersion = customer.getVersion().getValue();

            // Act - Perform 4 operations
            customer.updateName(name2); // +1
            customer.updateName(name3); // +1
            customer.linkToUser(userId); // +1
            customer.unlinkFromUser(); // +1

            // Assert
            expect(customer.getVersion().getValue()).toBe(initialVersion + 4);
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
