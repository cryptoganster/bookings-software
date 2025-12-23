import { DomainException } from '@shared/kernel/exceptions/domain';

export class ScheduleNotFoundException extends DomainException {
  constructor(scheduleId: string) {
    super(`Schedule with id ${scheduleId} not found`);
  }
}
