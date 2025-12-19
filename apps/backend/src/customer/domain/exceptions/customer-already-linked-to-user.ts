/**
 * Exception thrown when attempting to link a customer that is already linked to a user
 *
 * This exception is thrown when trying to link a customer to a user
 * but the customer already has a userId (is already registered).
 */
export class CustomerAlreadyLinkedToUserException extends Error {
  constructor(customerId: string) {
    super(`Customer ${customerId} is already linked to a user`);
    this.name = 'CustomerAlreadyLinkedToUserException';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomerAlreadyLinkedToUserException);
    }
  }
}
