import { ValueObject } from '@shared/kernel/value-object';
import { InvalidOfferingDurationException } from '@offering/domain/exceptions/invalid-offering-duration';

/**
 * Value Object representing the duration of an offering in minutes.
 *
 * Business Rules:
 * - Must be a multiple of 15 minutes
 * - Minimum: 15 minutes
 * - Maximum: 480 minutes (8 hours)
 */
export class OfferingDuration extends ValueObject {
  private static readonly MIN_MINUTES = 15;
  private static readonly MAX_MINUTES = 480;
  private static readonly SLOT_INTERVAL = 15;

  private constructor(private readonly minutes: number) {
    super();
    this.validate(minutes);
  }

  /**
   * Creates a new OfferingDuration from minutes
   * @param minutes Duration in minutes
   * @throws InvalidOfferingDurationException if duration is invalid
   */
  static fromMinutes(minutes: number): OfferingDuration {
    return new OfferingDuration(minutes);
  }

  /**
   * Gets the duration in minutes
   */
  getMinutes(): number {
    return this.minutes;
  }

  /**
   * Validates the duration according to business rules
   */
  private validate(minutes: number): void {
    if (!Number.isInteger(minutes)) {
      throw new InvalidOfferingDurationException(minutes);
    }

    if (minutes < OfferingDuration.MIN_MINUTES) {
      throw new InvalidOfferingDurationException(minutes);
    }

    if (minutes > OfferingDuration.MAX_MINUTES) {
      throw new InvalidOfferingDurationException(minutes);
    }

    if (minutes % OfferingDuration.SLOT_INTERVAL !== 0) {
      throw new InvalidOfferingDurationException(minutes);
    }
  }

  protected getEqualityComponents(): unknown[] {
    return [this.minutes];
  }

  /**
   * Returns a string representation of the duration
   */
  toString(): string {
    const hours = Math.floor(this.minutes / 60);
    const mins = this.minutes % 60;

    if (hours === 0) {
      return `${mins} min`;
    }

    if (mins === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${mins}min`;
  }
}
