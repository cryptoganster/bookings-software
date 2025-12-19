/**
 * Exception thrown when a customer is not found
 *
 * This exception is thrown when attempting to retrieve or modify
 * a customer that does not exist in the system.
 */
export class CustomerNotFoundException extends Error {
  constructor(customerId: string) {
    super(`Customer with id ${customerId} not found`);
    this.name = 'CustomerNotFoundException';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomerNotFoundException);
    }
  }
}
