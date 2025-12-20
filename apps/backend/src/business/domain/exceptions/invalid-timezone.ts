import { DomainException } from '@shared/kernel/exceptions/domain';

export class InvalidTimezoneException extends DomainException {
  constructor(value: string) {
    super(
      `Invalid timezone: "${value}". Must be a valid IANA timezone (e.g., America/Santo_Domingo, America/New_York)`,
    );
    this.name = 'InvalidTimezoneException';
  }
}
