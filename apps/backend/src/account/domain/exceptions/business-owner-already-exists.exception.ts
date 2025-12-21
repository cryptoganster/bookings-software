import { DomainException } from '@shared/kernel/exceptions/domain';

/**
 * BusinessOwnerAlreadyExistsException
 *
 * Thrown when attempting to create a BusinessOwner for a userId that already has one.
 *
 * Requirements: Edge Case 1, Edge Case 2
 */
export class BusinessOwnerAlreadyExistsException extends DomainException {
  constructor(userId: string) {
    super(`BusinessOwner already exists for userId: ${userId}`);
  }
}
