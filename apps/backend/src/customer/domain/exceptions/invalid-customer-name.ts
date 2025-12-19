/**
 * Exception thrown when a customer name is invalid
 *
 * This exception is thrown when:
 * - Name is empty or only whitespace
 * - Name exceeds maximum length (100 characters)
 */
export class InvalidCustomerNameException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCustomerNameException';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidCustomerNameException);
    }
  }
}
