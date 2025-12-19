import { CustomerDeduplicationService } from '../customer-deduplication.service';
import { CustomerReadModel } from '@customer/domain/read-models/customer';

describe('CustomerDeduplicationService', () => {
  let service: CustomerDeduplicationService;

  beforeEach(() => {
    service = new CustomerDeduplicationService();
  });

  // Helper function to create CustomerReadModel instances
  const createCustomer = (
    id: string,
    phone: string,
    name: string | null = null,
    userId: string | null = null,
  ): CustomerReadModel => {
    return new CustomerReadModel(id, userId, 'business-1', phone, name, new Date(), new Date());
  };

  describe('normalizePhone', () => {
    it('should remove +, spaces, dashes, and parentheses', () => {
      expect(service.normalizePhone('+1 (809) 555-1234')).toBe('18095551234');
      expect(service.normalizePhone('809-555-1234')).toBe('8095551234');
      expect(service.normalizePhone('+1-809-555-1234')).toBe('18095551234');
      expect(service.normalizePhone('(809) 555 1234')).toBe('8095551234');
    });

    it('should handle already normalized phones', () => {
      expect(service.normalizePhone('18095551234')).toBe('18095551234');
      expect(service.normalizePhone('8095551234')).toBe('8095551234');
    });

    it('should handle empty string', () => {
      expect(service.normalizePhone('')).toBe('');
    });
  });

  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(service.levenshteinDistance('hello', 'hello')).toBe(0);
      expect(service.levenshteinDistance('', '')).toBe(0);
    });

    it('should calculate distance for single character difference', () => {
      expect(service.levenshteinDistance('hello', 'hallo')).toBe(1); // substitution
      expect(service.levenshteinDistance('hello', 'helo')).toBe(1); // deletion
      expect(service.levenshteinDistance('hello', 'helloo')).toBe(1); // insertion
    });

    it('should calculate distance for multiple differences', () => {
      expect(service.levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(service.levenshteinDistance('saturday', 'sunday')).toBe(3);
    });

    it('should handle empty strings', () => {
      expect(service.levenshteinDistance('', 'hello')).toBe(5);
      expect(service.levenshteinDistance('hello', '')).toBe(5);
    });
  });

  describe('calculateNameSimilarity', () => {
    it('should return 1 for identical names', () => {
      expect(service.calculateNameSimilarity('Juan Pérez', 'Juan Pérez')).toBe(1);
    });

    it('should return 1 for names that differ only in case', () => {
      expect(service.calculateNameSimilarity('Juan Pérez', 'juan pérez')).toBe(1);
      expect(service.calculateNameSimilarity('JUAN PÉREZ', 'juan pérez')).toBe(1);
    });

    it('should return 1 for names with extra whitespace', () => {
      expect(service.calculateNameSimilarity('  Juan Pérez  ', 'Juan Pérez')).toBe(1);
    });

    it('should return 0 for null names', () => {
      expect(service.calculateNameSimilarity(null, 'Juan Pérez')).toBe(0);
      expect(service.calculateNameSimilarity('Juan Pérez', null)).toBe(0);
      expect(service.calculateNameSimilarity(null, null)).toBe(0);
    });

    it('should return 0 for empty names', () => {
      expect(service.calculateNameSimilarity('', 'Juan Pérez')).toBe(0);
      expect(service.calculateNameSimilarity('Juan Pérez', '')).toBe(0);
    });

    it('should calculate similarity for similar names', () => {
      const similarity = service.calculateNameSimilarity('Juan Pérez', 'Juan Perez');
      expect(similarity).toBeGreaterThanOrEqual(0.9); // Very similar (accent difference)
    });

    it('should calculate similarity for typos', () => {
      const similarity = service.calculateNameSimilarity('Juan Pérez', 'Juan Peres');
      expect(similarity).toBeGreaterThanOrEqual(0.8); // Similar (typo)
    });

    it('should return low similarity for different names', () => {
      const similarity = service.calculateNameSimilarity('Juan Pérez', 'María García');
      expect(similarity).toBeLessThan(0.5); // Different
    });
  });

  describe('calculatePhoneSimilarity', () => {
    it('should return 1 for identical phones', () => {
      expect(service.calculatePhoneSimilarity('+18095551234', '+18095551234')).toBe(1);
    });

    it('should return 1 for phones with different formatting', () => {
      expect(service.calculatePhoneSimilarity('+1 (809) 555-1234', '18095551234')).toBe(1);
    });

    it('should return 0.9 for same number, different country code', () => {
      // Both have same last 10 digits, so they match on last 10
      expect(service.calculatePhoneSimilarity('+18095551234', '+528095551234')).toBe(0.9); // Same last 7 digits (local number)
    });

    it('should return 0.9 for same local number, different area code', () => {
      expect(service.calculatePhoneSimilarity('+18095551234', '+18295551234')).toBe(0.9);
    });

    it('should return 0 for completely different phones', () => {
      expect(service.calculatePhoneSimilarity('+18095551234', '+18091112222')).toBe(0);
    });
  });

  describe('calculateSimilarityScore', () => {
    it('should use weighted average when both have names', () => {
      const customer1 = createCustomer('1', '+18095551234', 'Juan Pérez');
      const customer2 = createCustomer('2', '+18095551234', 'Juan Perez');

      const score = service.calculateSimilarityScore(customer1, customer2);

      // Same phone (1.0) + very similar name (~0.9) = weighted average
      // 0.9 * 0.6 + 1.0 * 0.4 = 0.54 + 0.4 = 0.94
      expect(score).toBeGreaterThan(0.9);
    });

    it('should use only phone similarity when one has no name', () => {
      const customer1 = createCustomer('1', '+18095551234', null);
      const customer2 = createCustomer('2', '+18095551234', 'Juan Pérez');

      const score = service.calculateSimilarityScore(customer1, customer2);

      // Only phone similarity (1.0)
      expect(score).toBe(1);
    });

    it('should use only phone similarity when both have no names', () => {
      const customer1 = createCustomer('1', '+18095551234', null);
      const customer2 = createCustomer('2', '+18095551234', null);

      const score = service.calculateSimilarityScore(customer1, customer2);

      // Only phone similarity (1.0)
      expect(score).toBe(1);
    });
  });

  describe('generateReasons', () => {
    it('should include "Mismo número de teléfono" for identical phones', () => {
      const customer1 = createCustomer('1', '+18095551234', 'Juan Pérez');
      const customer2 = createCustomer('2', '+18095551234', 'Juan Perez');

      const reasons = service.generateReasons(customer1, customer2, 0.95);

      expect(reasons).toContain('Mismo número de teléfono');
    });

    it('should include "Nombres muy similares" for high name similarity', () => {
      const customer1 = createCustomer('1', '+18095551234', 'Juan Pérez');
      const customer2 = createCustomer('2', '+18095551234', 'Juan Perez');

      const reasons = service.generateReasons(customer1, customer2, 0.95);

      expect(reasons).toContain('Nombres muy similares');
    });

    it('should include general similarity when no specific reasons', () => {
      const customer1 = createCustomer('1', '+18095551234', null);
      const customer2 = createCustomer('2', '+18091112222', null);

      const reasons = service.generateReasons(customer1, customer2, 0.5);

      expect(reasons.length).toBeGreaterThan(0);
      expect(reasons[0]).toContain('Similitud general');
    });
  });

  describe('comparePair', () => {
    it('should return duplicate pair when similarity >= threshold', () => {
      const customer1 = createCustomer('1', '+18095551234', 'Juan Pérez');
      const customer2 = createCustomer('2', '+18095551234', 'Juan Perez');

      const pair = service.comparePair(customer1, customer2, 0.8);

      expect(pair).not.toBeNull();
      expect(pair!.customer1).toBe(customer1);
      expect(pair!.customer2).toBe(customer2);
      expect(pair!.similarityScore).toBeGreaterThan(0.8);
      expect(pair!.reasons.length).toBeGreaterThan(0);
    });

    it('should return null when similarity < threshold', () => {
      const customer1 = createCustomer('1', '+18095551234', 'Juan Pérez');
      const customer2 = createCustomer('2', '+18091112222', 'María García');

      const pair = service.comparePair(customer1, customer2, 0.8);

      expect(pair).toBeNull();
    });
  });

  describe('detectDuplicates', () => {
    it('should return empty array for empty input', () => {
      const duplicates = service.detectDuplicates([], 0.8);
      expect(duplicates).toEqual([]);
    });

    it('should return empty array for single customer', () => {
      const customer = createCustomer('1', '+18095551234', 'Juan Pérez');

      const duplicates = service.detectDuplicates([customer], 0.8);
      expect(duplicates).toEqual([]);
    });

    it('should detect duplicates and sort by similarity', () => {
      const customer1 = createCustomer('1', '+18095551234', 'Juan Pérez');
      const customer2 = createCustomer('2', '+18095551234', 'Juan Perez'); // Very similar
      const customer3 = createCustomer('3', '+18095551234', 'Juan P'); // Less similar

      const duplicates = service.detectDuplicates([customer1, customer2, customer3], 0.7);

      expect(duplicates.length).toBeGreaterThan(0);
      // Should be sorted by similarity (descending)
      for (let i = 0; i < duplicates.length - 1; i++) {
        expect(duplicates[i].similarityScore).toBeGreaterThanOrEqual(
          duplicates[i + 1].similarityScore,
        );
      }
    });

    it('should respect threshold', () => {
      const customer1 = createCustomer('1', '+18095551234', 'Juan Pérez');
      const customer2 = createCustomer('2', '+18091112222', 'María García'); // Not similar

      const duplicates = service.detectDuplicates([customer1, customer2], 0.8);

      expect(duplicates).toEqual([]);
    });

    it('should handle edge case: same phone, null names', () => {
      const customer1 = createCustomer('1', '+18095551234', null);
      const customer2 = createCustomer('2', '+18095551234', null);

      const duplicates = service.detectDuplicates([customer1, customer2], 0.8);

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].similarityScore).toBe(1); // Same phone
    });
  });
});
