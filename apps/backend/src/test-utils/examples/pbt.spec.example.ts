/**
 * Property-Based Testing (PBT) Example
 *
 * This file demonstrates how to write property-based tests using fast-check.
 * Property-based tests verify that certain properties hold true for a wide range of inputs.
 *
 * Benefits:
 * - Discovers edge cases automatically
 * - Tests with hundreds of random inputs
 * - More thorough than example-based tests
 * - Documents invariants and properties
 *
 * @see https://github.com/dubzzz/fast-check
 *
 * NOTE: This is an EXAMPLE file for documentation purposes.
 * To use property-based testing in your tests, install fast-check:
 * ```bash
 * pnpm add -D fast-check
 * ```
 */

import { describe, it, expect } from '@jest/globals';
import { UUID } from '@shared/vo/uuid';
import { generateTestEmail, generateUniqueWhatsAppNumber } from '@test-utils/helpers';

// Uncomment when fast-check is installed:
// import * as fc from 'fast-check';

describe('Property-Based Testing Examples', () => {
  /**
   * Example 1: UUID Generation Properties
   *
   * Property: All generated UUIDs should be valid UUID v4 format
   */
  describe('UUID Generation', () => {
    it('should always generate valid UUID v4 format', () => {
      // Without fast-check, we test with a loop
      for (let i = 0; i < 100; i++) {
        const uuid = UUID.generate();
        const uuidString = uuid.getValue();

        // Property 1: UUID should match v4 format
        const uuidV4Regex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(uuidString).toMatch(uuidV4Regex);

        // Property 2: UUID should be 36 characters long (including hyphens)
        expect(uuidString).toHaveLength(36);

        // Property 3: UUID should have hyphens at correct positions
        expect(uuidString[8]).toBe('-');
        expect(uuidString[13]).toBe('-');
        expect(uuidString[18]).toBe('-');
        expect(uuidString[23]).toBe('-');
      }
    });

    it('should generate unique UUIDs', () => {
      // Property: Generating multiple UUIDs should produce unique values
      const uuids = Array.from({ length: 100 }, () => UUID.generate().getValue());
      const uniqueUuids = new Set(uuids);

      expect(uniqueUuids.size).toBe(100);
    });

    it('should correctly parse valid UUID strings', () => {
      // Test with a few known valid UUIDs
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
      ];

      for (const uuidString of validUUIDs) {
        const uuid = UUID.fromString(uuidString);
        expect(uuid.getValue()).toBe(uuidString);
      }

      // With fast-check:
      // fc.assert(
      //   fc.property(fc.uuid(), (uuidString) => {
      //     const uuid = UUID.fromString(uuidString);
      //     expect(uuid.getValue()).toBe(uuidString);
      //   })
      // );
    });
  });

  /**
   * Example 2: Email Generation Properties
   *
   * Property: All generated emails should be valid email format
   */
  describe('Email Generation', () => {
    it('should always generate valid email format', () => {
      for (let i = 0; i < 100; i++) {
        const email = generateTestEmail();

        // Property 1: Email should match basic email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(email).toMatch(emailRegex);

        // Property 2: Email should contain @ symbol
        expect(email).toContain('@');

        // Property 3: Email should have domain part
        const parts = email.split('@');
        expect(parts).toHaveLength(2);
        expect(parts[1]).toContain('.');
      }
    });

    it('should generate unique emails', () => {
      // Property: Generating multiple emails should produce unique values
      const emails = Array.from({ length: 100 }, () => generateTestEmail());
      const uniqueEmails = new Set(emails);

      expect(uniqueEmails.size).toBe(100);
    });

    // Note: generateTestEmail() doesn't accept parameters in current implementation
    // This is just an example of what you could test if it did
    it.skip('example: should generate emails with custom prefix (not implemented)', () => {
      // With fast-check:
      // fc.assert(
      //   fc.property(fc.string({ minLength: 1, maxLength: 20 }), (prefix) => {
      //     const email = generateTestEmail(prefix);
      //     expect(email.startsWith(prefix)).toBe(true);
      //   })
      // );
    });
  });

  /**
   * Example 3: WhatsApp Number Generation Properties
   *
   * Property: All generated WhatsApp numbers should be valid phone format
   */
  describe('WhatsApp Number Generation', () => {
    it('should always generate valid phone format', () => {
      for (let i = 0; i < 100; i++) {
        const phone = generateUniqueWhatsAppNumber();

        // Property 1: Phone should start with +
        expect(phone.startsWith('+')).toBe(true);

        // Property 2: Phone should contain only digits after +
        const digits = phone.slice(1);
        expect(/^\d+$/.test(digits)).toBe(true);

        // Property 3: Phone should have reasonable length (10-15 digits)
        expect(digits.length).toBeGreaterThanOrEqual(10);
        expect(digits.length).toBeLessThanOrEqual(15);
      }
    });

    it('should generate unique phone numbers', () => {
      // Property: Generating multiple phones should produce unique values
      const phones = Array.from({ length: 100 }, () => generateUniqueWhatsAppNumber());
      const uniquePhones = new Set(phones);

      expect(uniquePhones.size).toBe(100);
    });
  });

  /**
   * Example 4: String Validation Properties
   *
   * Property: Validation should be consistent and predictable
   */
  describe('String Validation', () => {
    it('empty string should always be invalid for required fields', () => {
      const testStrings = ['', '  ', '\t', '\n', '   \t\n   '];

      for (const str of testStrings) {
        const trimmed = str.trim();
        // Property: Empty strings should always fail validation
        expect(trimmed).toBe('');
      }

      // With fast-check:
      // fc.assert(
      //   fc.property(fc.string(), (str) => {
      //     const trimmed = str.trim();
      //     if (trimmed.length === 0) {
      //       expect(trimmed).toBe('');
      //     }
      //   })
      // );
    });

    it('non-empty strings should pass length validation', () => {
      const testStrings = ['a', 'test', 'hello world', 'x'.repeat(100)];

      for (const str of testStrings) {
        // Property: Strings within length bounds should be valid
        expect(str.length).toBeGreaterThan(0);
        expect(str.length).toBeLessThanOrEqual(100);
      }

      // With fast-check:
      // fc.assert(
      //   fc.property(fc.string({ minLength: 1, maxLength: 100 }), (str) => {
      //     expect(str.length).toBeGreaterThan(0);
      //     expect(str.length).toBeLessThanOrEqual(100);
      //   })
      // );
    });
  });

  /**
   * Example 5: Idempotency Properties
   *
   * Property: Calling the same function multiple times should produce the same result
   */
  describe('Idempotency', () => {
    it('UUID.fromString should be idempotent', () => {
      const testUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
      ];

      for (const uuidString of testUUIDs) {
        // Property: Parsing the same UUID string multiple times should produce equal results
        const uuid1 = UUID.fromString(uuidString);
        const uuid2 = UUID.fromString(uuidString);

        expect(uuid1.getValue()).toBe(uuid2.getValue());
      }

      // With fast-check:
      // fc.assert(
      //   fc.property(fc.uuid(), (uuidString) => {
      //     const uuid1 = UUID.fromString(uuidString);
      //     const uuid2 = UUID.fromString(uuidString);
      //     expect(uuid1.getValue()).toBe(uuid2.getValue());
      //   })
      // );
    });

    it('UUID toString and fromString should be inverses', () => {
      for (let i = 0; i < 100; i++) {
        const original = UUID.generate();
        const stringified = original.getValue();
        const parsed = UUID.fromString(stringified);

        // Property: toString and fromString should be inverse operations
        expect(parsed.getValue()).toBe(original.getValue());
      }

      // With fast-check (if installed):
      // fc.assert(
      //   fc.property(fc.uuid(), (uuidString) => {
      //     const uuid = UUID.fromString(uuidString);
      //     const stringified = uuid.getValue();
      //     const parsed = UUID.fromString(stringified);
      //     expect(parsed.getValue()).toBe(uuidString);
      //   })
      // );
    });
  });
});

/**
 * Tips for Writing Property-Based Tests:
 *
 * 1. **Think in Properties, Not Examples**
 *    - Instead of: "UUID '123e4567-e89b-12d3-a456-426614174000' should be valid"
 *    - Think: "All generated UUIDs should match UUID v4 format"
 *
 * 2. **Common Properties to Test**
 *    - Idempotency: f(f(x)) === f(x)
 *    - Inverse: f(g(x)) === x
 *    - Invariants: Properties that always hold
 *    - Commutativity: f(x, y) === f(y, x)
 *    - Associativity: f(f(x, y), z) === f(x, f(y, z))
 *
 * 3. **Use Appropriate Arbitraries**
 *    - fc.string() - Random strings
 *    - fc.integer() - Random integers
 *    - fc.uuid() - Valid UUIDs
 *    - fc.emailAddress() - Valid emails
 *    - fc.date() - Random dates
 *
 * 4. **Start Simple**
 *    - Begin with basic properties
 *    - Add more complex properties as you understand the domain
 *
 * 5. **Document Your Properties**
 *    - Explain what property you're testing
 *    - Why it should hold
 *    - What it guarantees
 *
 * 6. **Handle Shrinking**
 *    - fast-check automatically shrinks failing cases
 *    - This helps find the minimal failing example
 *
 * 7. **Run Many Iterations**
 *    - Default is 100 runs
 *    - Increase for critical code: test.prop({ numRuns: 1000 })
 *
 * 8. **Combine with Example-Based Tests**
 *    - Use PBT for properties
 *    - Use example-based tests for specific scenarios
 */
