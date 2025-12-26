import { DomainException } from '@shared/kernel/exceptions/domain';

export class InvalidDayOfWeekException extends DomainException {
  constructor(value: number) {
    super(`Invalid day of week: ${value}. Must be between 0 and 6`);
  }
}
