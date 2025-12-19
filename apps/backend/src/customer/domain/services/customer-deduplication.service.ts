import { Injectable } from '@nestjs/common';
import { CustomerReadModel } from '@customer/domain/read-models/customer';
import { DuplicateCustomerPair } from '@customer/app/queries/detect-duplicate-customers/query';

/**
 * Domain Service for customer deduplication
 *
 * Implements algorithms to detect duplicate customers based on:
 * - Phone number similarity
 * - Name similarity (Levenshtein distance)
 *
 * This is a Domain Service because the logic doesn't belong to a single aggregate
 * and operates on multiple customer entities.
 */
@Injectable()
export class CustomerDeduplicationService {
  /**
   * Normalize phone number for comparison
   * Removes +, spaces, dashes, parentheses
   *
   * @example
   * normalizePhone('+1 (809) 555-1234') => '18095551234'
   * normalizePhone('809-555-1234') => '8095551234'
   */
  normalizePhone(phone: string): string {
    return phone.replace(/[\s\-\+\(\)]/g, '');
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Returns the minimum number of single-character edits (insertions, deletions, substitutions)
   * required to change one string into the other.
   *
   * @returns Distance (0 = identical, higher = more different)
   */
  levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create 2D array for dynamic programming
    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) {
      matrix[i][0] = i;
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost, // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Calculate name similarity score (0-1)
   * Uses Levenshtein distance normalized by max length
   *
   * @returns Similarity score (1 = identical, 0 = completely different)
   */
  calculateNameSimilarity(name1: string | null, name2: string | null): number {
    // If both names are null or empty, consider them not similar
    if (!name1 || !name2) {
      return 0;
    }

    // Normalize: lowercase and trim
    const normalized1 = name1.toLowerCase().trim();
    const normalized2 = name2.toLowerCase().trim();

    // If identical after normalization, return 1
    if (normalized1 === normalized2) {
      return 1;
    }

    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);

    // Normalize to 0-1 scale (1 = identical, 0 = completely different)
    return 1 - distance / maxLength;
  }

  /**
   * Calculate phone similarity score (0-1)
   * Compares last 7-10 digits (local phone number)
   *
   * @returns Similarity score (1 = identical, 0 = completely different)
   */
  calculatePhoneSimilarity(phone1: string, phone2: string): number {
    const normalized1 = this.normalizePhone(phone1);
    const normalized2 = this.normalizePhone(phone2);

    // If identical, return 1
    if (normalized1 === normalized2) {
      return 1;
    }

    // Compare last 7 digits (local number without area code)
    const last7_1 = normalized1.slice(-7);
    const last7_2 = normalized2.slice(-7);

    if (last7_1 === last7_2) {
      return 0.9; // Very similar (same local number, different area code)
    }

    // Compare last 10 digits (full number without country code)
    const last10_1 = normalized1.slice(-10);
    const last10_2 = normalized2.slice(-10);

    if (last10_1 === last10_2) {
      return 0.95; // Almost identical (same number, different country code)
    }

    return 0; // Completely different
  }

  /**
   * Calculate combined similarity score
   * Weighted average of name and phone similarity
   *
   * @returns Combined similarity score (0-1)
   */
  calculateSimilarityScore(customer1: CustomerReadModel, customer2: CustomerReadModel): number {
    const nameSimilarity = this.calculateNameSimilarity(customer1.name, customer2.name);
    const phoneSimilarity = this.calculatePhoneSimilarity(
      customer1.whatsappPhone,
      customer2.whatsappPhone,
    );

    // If both have names, use weighted average (60% name, 40% phone)
    // If one or both don't have names, use only phone similarity
    if (customer1.name && customer2.name) {
      return nameSimilarity * 0.6 + phoneSimilarity * 0.4;
    }

    return phoneSimilarity;
  }

  /**
   * Generate reasons for duplicate detection
   * Explains why two customers are considered duplicates
   */
  generateReasons(
    customer1: CustomerReadModel,
    customer2: CustomerReadModel,
    similarityScore: number,
  ): string[] {
    const reasons: string[] = [];

    const nameSimilarity = this.calculateNameSimilarity(customer1.name, customer2.name);
    const phoneSimilarity = this.calculatePhoneSimilarity(
      customer1.whatsappPhone,
      customer2.whatsappPhone,
    );

    if (nameSimilarity >= 0.8) {
      reasons.push('Nombres muy similares');
    } else if (nameSimilarity >= 0.6) {
      reasons.push('Nombres similares');
    }

    if (phoneSimilarity === 1) {
      reasons.push('Mismo número de teléfono');
    } else if (phoneSimilarity >= 0.9) {
      reasons.push('Números de teléfono muy similares');
    } else if (phoneSimilarity >= 0.7) {
      reasons.push('Últimos dígitos del teléfono coinciden');
    }

    if (reasons.length === 0) {
      reasons.push(`Similitud general: ${Math.round(similarityScore * 100)}%`);
    }

    return reasons;
  }

  /**
   * Compare two customers and return duplicate pair if similar enough
   *
   * @param threshold Minimum similarity score to consider duplicates (0-1)
   * @returns DuplicateCustomerPair if similar enough, null otherwise
   */
  comparePair(
    customer1: CustomerReadModel,
    customer2: CustomerReadModel,
    threshold: number,
  ): DuplicateCustomerPair | null {
    const similarityScore = this.calculateSimilarityScore(customer1, customer2);

    if (similarityScore >= threshold) {
      return {
        customer1,
        customer2,
        similarityScore,
        reasons: this.generateReasons(customer1, customer2, similarityScore),
      };
    }

    return null;
  }

  /**
   * Detect duplicates in a list of customers
   * Compares all pairs and returns those above threshold
   *
   * @param customers List of customers to compare
   * @param threshold Minimum similarity score (default 0.8)
   * @returns Array of duplicate pairs, sorted by similarity (descending)
   */
  detectDuplicates(
    customers: CustomerReadModel[],
    threshold: number = 0.8,
  ): DuplicateCustomerPair[] {
    const duplicates: DuplicateCustomerPair[] = [];

    // Compare all pairs (O(n²) complexity)
    for (let i = 0; i < customers.length; i++) {
      for (let j = i + 1; j < customers.length; j++) {
        const pair = this.comparePair(customers[i], customers[j], threshold);
        if (pair) {
          duplicates.push(pair);
        }
      }
    }

    // Sort by similarity score (descending)
    return duplicates.sort((a, b) => b.similarityScore - a.similarityScore);
  }
}
