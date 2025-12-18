/**
 * Exception thrown when customer data is invalid
 * 
 * This exception is thrown when required fields are missing or invalid
 * during customer creation or modification.
 */
export class InvalidCustomerDataException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCustomerDataException';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidCustomerDataException);
    }
  }
}
