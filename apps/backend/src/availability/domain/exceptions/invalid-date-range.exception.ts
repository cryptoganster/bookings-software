import { DomainException } from '@shared/kernel/exceptions/domain';

export class InvalidDateRangeException extends DomainException {
  constructor(startDate: Date, endDate: Date) {
    super(
      `Invalid date range: start date (${startDate.toISOString()}) must be before or equal to end date (${endDate.toISOString()})`,
    );
  }
}
