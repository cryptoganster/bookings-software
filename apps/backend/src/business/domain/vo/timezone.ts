import { ValueObject } from '@shared/kernel/value-object';
import { InvalidTimezoneException } from '../exceptions/invalid-timezone';

/**
 * Timezone Value Object
 * Represents an IANA timezone (e.g., America/Santo_Domingo, America/New_York)
 */
export class Timezone extends ValueObject {
  private static readonly VALID_TIMEZONES = Intl.supportedValuesOf('timeZone');

  private constructor(private readonly value: string) {
    super();
  }

  /**
   * Creates a Timezone from an IANA timezone string
   * Validates against the list of supported timezones
   */
  static create(value: string): Timezone {
    if (!this.VALID_TIMEZONES.includes(value)) {
      throw new InvalidTimezoneException(value);
    }

    return new Timezone(value);
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
