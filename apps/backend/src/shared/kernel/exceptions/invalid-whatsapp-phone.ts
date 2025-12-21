/**
 * Exception thrown when a WhatsApp phone number format is invalid
 *
 * Expected format: E.164 (+[country code][number])
 * Examples: +18095551234, +442071234567
 */
export class InvalidWhatsAppPhoneException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidWhatsAppPhoneException';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidWhatsAppPhoneException);
    }
  }
}
