import { ValueObject } from '@shared/kernel/value-object';
import { InvalidWhatsAppNumberException } from '../exceptions/invalid-whatsapp-number';

/**
 * WhatsAppNumber Value Object
 * Represents a WhatsApp Business phone number in E.164 format
 * E.164 format: + followed by 1-15 digits (e.g., +18095551234)
 */
export class WhatsAppNumber extends ValueObject {
  private constructor(private readonly value: string) {
    super();
  }

  /**
   * Creates a WhatsAppNumber from a string
   * Normalizes to E.164 format and validates
   */
  static create(value: string): WhatsAppNumber {
    // Normalize to E.164 format
    const normalized = this.normalizeToE164(value);

    // Validate E.164 format
    if (!this.isValidE164(normalized)) {
      throw new InvalidWhatsAppNumberException(value);
    }

    return new WhatsAppNumber(normalized);
  }

  /**
   * Normalizes a phone number to E.164 format
   * Removes spaces, hyphens, parentheses
   * Adds + prefix if missing
   */
  private static normalizeToE164(value: string): string {
    // Remove spaces, hyphens, parentheses
    let cleaned = value.replace(/[\s\-\(\)]/g, '');

    // Add + prefix if missing
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }

  /**
   * Validates E.164 format
   * E.164: + followed by 1-15 digits, starting with non-zero
   */
  private static isValidE164(value: string): boolean {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(value);
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
