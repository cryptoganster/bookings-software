/**
 * Exception thrown when attempting to unlink a customer that is not linked to any user
 *
 * This exception is thrown when trying to unlink a customer from a user
 * but the customer is anonymous (userId is null).
 */
export class CustomerNotLinkedToUserException extends Error {
  constructor(customerId: string) {
    super(`Customer ${customerId} is not linked to any user`);
    this.name = 'CustomerNotLinkedToUserException';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomerNotLinkedToUserException);
    }
  }
}
