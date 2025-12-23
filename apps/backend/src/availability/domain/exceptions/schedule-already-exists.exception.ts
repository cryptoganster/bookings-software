import { DomainException } from '@shared/kernel/exceptions/domain';

export class ScheduleAlreadyExistsException extends DomainException {
  constructor(businessId: string, dayOfWeek: number) {
    super(`Schedule already exists for business ${businessId} on day ${dayOfWeek}`);
  }
}
