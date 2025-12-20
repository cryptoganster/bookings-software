import { DomainException } from '@shared/kernel/exceptions/domain';

export class MaxBusinessesExceededException extends DomainException {
  constructor(ownerId: string, maxBusinesses: number) {
    super(
      `Cannot create business: User ${ownerId} has reached the maximum limit of ${maxBusinesses} businesses for their subscription plan`,
    );
    this.name = 'MaxBusinessesExceededException';
  }
}
