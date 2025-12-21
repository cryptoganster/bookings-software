import { DomainException } from '@shared/kernel/exceptions/domain';

/**
 * BusinessOwnerNotFoundException
 *
 * Thrown when a BusinessOwner cannot be found by ID or userId.
 */
export class BusinessOwnerNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(`BusinessOwner not found: ${identifier}`);
  }
}
