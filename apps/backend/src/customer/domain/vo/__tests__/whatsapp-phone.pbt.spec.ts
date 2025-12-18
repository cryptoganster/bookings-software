import * as fc from 'fast-check';
import { WhatsAppPhone } from '../whatsapp-phone';
import { InvalidWhatsAppPhoneException } from '../../exceptions/invalid-whatsapp-phone';

/**
 * Property-Based Tests for WhatsAppPhone
 * 
 * **Feature: customer-bc, Property 1: WhatsAppPhone format validation**
 * **Validates: Requirements 4.1, 4.4**
 * 
 * For any string that represents a valid E.164 phone number,
 * creating a WhatsAppPhone and then calling getValue() should return the same string.
 */
describe('WhatsAppPhone PBT', () => {
  /**
   * Property 1: Round-trip consistency for valid E.164 numbers
   * 
   * For any valid E.164 phone number, the round-trip (create → getValue) should preserve the value
   */
  it('should preserve format in round-trip for valid E.164 numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9 }), // Country code first digit (1-9)
        fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 6, maxLength: 14 }), // Remaining digits (min 7 total)
        (countryCodeFirstDigit: number, remainingDigits: number[]) => {
          const phone = `+${countryCodeFirstDigit}${remainingDigits.join('')}`;
          const whatsappPhone = WhatsAppPhone.fromString(phone);
          expect(whatsappPhone.getValue()).toBe(phone);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 6: WhatsAppPhone validation rejects invalid formats
   * 
   * **Feature: customer-bc, Property 6: WhatsAppPhone validation rejects invalid formats**
   * **Validates: Requirements 4.2**
   * 
   * For any string that does not match E.164 format,
   * attempting to create a WhatsAppPhone should throw InvalidWhatsAppPhoneException.
   */
  it('should reject invalid formats', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Phone without plus sign (only digits)
          fc.integer({ min: 10000000, max: 999999999999999 }).map(n => n.toString()),
          // Phone with spaces
          fc.constant('+1 809 555 1234'),
          // Phone with dashes
          fc.constant('+1-809-555-1234'),
          // Phone starting with +0
          fc.integer({ min: 10000000, max: 999999999999999 }).map(n => `+0${n}`),
          // Empty string
          fc.constant(''),
          // Phone too short
          fc.constant('+123456')
        ),
        (invalidPhone: string) => {
          expect(() => WhatsAppPhone.fromString(invalidPhone)).toThrow(InvalidWhatsAppPhoneException);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Equality is reflexive
   * 
   * For any valid phone number, it should be equal to itself
   */
  it('should be equal to itself (reflexive)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9 }),
        fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 6, maxLength: 14 }),
        (countryCodeFirstDigit: number, remainingDigits: number[]) => {
          const phone = `+${countryCodeFirstDigit}${remainingDigits.join('')}`;
          const whatsappPhone = WhatsAppPhone.fromString(phone);
          expect(whatsappPhone.equals(whatsappPhone)).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Equality is symmetric
   * 
   * For any two phone numbers with the same value, phone1.equals(phone2) === phone2.equals(phone1)
   */
  it('should be symmetric in equality', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9 }),
        fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 6, maxLength: 14 }),
        (countryCodeFirstDigit: number, remainingDigits: number[]) => {
          const phone = `+${countryCodeFirstDigit}${remainingDigits.join('')}`;
          const phone1 = WhatsAppPhone.fromString(phone);
          const phone2 = WhatsAppPhone.fromString(phone);
          expect(phone1.equals(phone2)).toBe(phone2.equals(phone1));
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Equality is transitive
   * 
   * For any three phone numbers with the same value,
   * if phone1.equals(phone2) and phone2.equals(phone3), then phone1.equals(phone3)
   */
  it('should be transitive in equality', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9 }),
        fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 6, maxLength: 14 }),
        (countryCodeFirstDigit: number, remainingDigits: number[]) => {
          const phone = `+${countryCodeFirstDigit}${remainingDigits.join('')}`;
          const phone1 = WhatsAppPhone.fromString(phone);
          const phone2 = WhatsAppPhone.fromString(phone);
          const phone3 = WhatsAppPhone.fromString(phone);
          
          if (phone1.equals(phone2) && phone2.equals(phone3)) {
            expect(phone1.equals(phone3)).toBe(true);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Different values are not equal
   * 
   * For any two different phone numbers, they should not be equal
   */
  it('should not be equal when values differ', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9 }),
        fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 6, maxLength: 14 }),
        fc.integer({ min: 1, max: 9 }),
        fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 6, maxLength: 14 }),
        (cc1: number, digits1: number[], cc2: number, digits2: number[]) => {
          const phone1Str = `+${cc1}${digits1.join('')}`;
          const phone2Str = `+${cc2}${digits2.join('')}`;
          
          // Only test when phones are actually different
          if (phone1Str !== phone2Str) {
            const phone1 = WhatsAppPhone.fromString(phone1Str);
            const phone2 = WhatsAppPhone.fromString(phone2Str);
            expect(phone1.equals(phone2)).toBe(false);
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});
