/**
 * Exception thrown when attempting to delete an already deleted customer
 */
export class CustomerAlreadyDeletedException extends Error {
  constructor(customerId: string) {
    super(`Customer ${customerId} is already deleted`);
    this.name = 'CustomerAlreadyDeletedException';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomerAlreadyDeletedException);
    }
  }
}
