import { ValueObject } from '@shared/kernel/value-object';
import { InvalidWhatsAppPhoneException } from '@shared/kernel/exceptions/invalid-whatsapp-phone';

/**
 * WhatsAppPhone Value Object
 *
 * Represents a WhatsApp phone number in E.164 format (+[country code][number])
 *
 * E.164 format rules:
 * - Must start with '+'
 * - Country code: 1-3 digits (cannot start with 0)
 * - Total length: 8-15 digits (including country code)
 * - No spaces, dashes, or other characters
 *
 * Examples:
 * - +18095551234 (Dominican Republic)
 * - +12025551234 (USA)
 * - +442071234567 (UK)
 * - +861234567890 (China)
 */
export class WhatsAppPhone extends ValueObject {
  /**
   * E.164 format regex
   * - ^ : Start of string
   * - \+ : Literal plus sign
   * - [1-9] : Country code first digit (1-9, cannot be 0)
   * - \d{6,14} : 6 to 14 more digits (total 7-15 digits, minimum 8 with country code)
   * - $ : End of string
   */
  private static readonly E164_REGEX = /^\+[1-9]\d{6,14}$/;

  private constructor(private readonly value: string) {
    super();
    this.validate(value);
  }

  /**
   * Validates the phone number format
   * @throws InvalidWhatsAppPhoneException if format is invalid
   */
  private validate(value: string): void {
    if (!value) {
      throw new InvalidWhatsAppPhoneException('WhatsApp phone cannot be empty');
    }

    if (!WhatsAppPhone.E164_REGEX.test(value)) {
      throw new InvalidWhatsAppPhoneException(
        `Invalid WhatsApp phone format: ${value}. Expected E.164 format (+[country code][number])`,
      );
    }
  }

  /**
   * Factory method to create WhatsAppPhone from string
   * @param value Phone number in E.164 format
   * @returns WhatsAppPhone instance
   * @throws InvalidWhatsAppPhoneException if format is invalid
   */
  static fromString(value: string): WhatsAppPhone {
    return new WhatsAppPhone(value);
  }

  /**
   * Gets the phone number value
   * @returns Phone number string in E.164 format
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Returns components for equality comparison
   * @returns Array with phone number value
   */
  protected getEqualityComponents(): unknown[] {
    return [this.value];
  }
}
