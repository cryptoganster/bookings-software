import { DomainException } from '@shared/kernel/exceptions/domain';

export class MaxBusinessesExceededException extends DomainException {
  constructor(userId: string, currentCount: number, maxAllowed: number) {
    super(
      `Cannot create business for user ${userId}: maximum businesses exceeded (${currentCount}/${maxAllowed}). Please upgrade your subscription plan.`,
    );
    this.name = 'MaxBusinessesExceededException';
  }
}
