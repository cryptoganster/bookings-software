import { DomainException } from '@shared/kernel/exceptions/domain';

/**
 * Exception thrown when a customer is not found
 *
 * This exception is thrown when attempting to retrieve or modify
 * a customer that does not exist in the system.
 */
export class CustomerNotFoundException extends DomainException {
  constructor(customerId: string) {
    super(`Customer with id ${customerId} not found`);
    this.name = 'CustomerNotFoundException';
  }
}
