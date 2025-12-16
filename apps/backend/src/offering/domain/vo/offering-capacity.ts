import { ValueObject } from '@shared/kernel/value-object';

/**
 * Value Object representing the capacity constraints of an offering.
 *
 * Business Rules:
 * - maxPerSlot must be at least 1
 * - maxDaily (if defined) must be >= maxPerSlot
 */
export class OfferingCapacity extends ValueObject {
  private static readonly MIN_CAPACITY_PER_SLOT = 1;

  private constructor(
    private readonly maxPerSlot: number,
    private readonly maxDaily: number | null,
  ) {
    super();
    this.validate(maxPerSlot, maxDaily);
  }

  /**
   * Creates a new OfferingCapacity
   * @param maxPerSlot Maximum number of clients per time slot
   * @param maxDaily Optional maximum number of clients per day
   * @throws Error if capacity values are invalid
   */
  static create(maxPerSlot: number, maxDaily: number | null = null): OfferingCapacity {
    return new OfferingCapacity(maxPerSlot, maxDaily);
  }

  /**
   * Gets the maximum capacity per slot
   */
  getMaxPerSlot(): number {
    return this.maxPerSlot;
  }

  /**
   * Gets the maximum daily capacity (null if unlimited)
   */
  getMaxDaily(): number | null {
    return this.maxDaily;
  }

  /**
   * Checks if there is a daily limit
   */
  hasDailyLimit(): boolean {
    return this.maxDaily !== null;
  }

  /**
   * Validates the capacity values according to business rules
   */
  private validate(maxPerSlot: number, maxDaily: number | null): void {
    if (!Number.isInteger(maxPerSlot)) {
      throw new Error('Max capacity per slot must be an integer');
    }

    if (maxPerSlot < OfferingCapacity.MIN_CAPACITY_PER_SLOT) {
      throw new Error(
        `Max capacity per slot must be at least ${OfferingCapacity.MIN_CAPACITY_PER_SLOT}`,
      );
    }

    if (maxDaily !== null) {
      if (!Number.isInteger(maxDaily)) {
        throw new Error('Max daily capacity must be an integer');
      }

      if (maxDaily < maxPerSlot) {
        throw new Error(
          'Max daily capacity must be greater than or equal to max capacity per slot',
        );
      }
    }
  }

  protected getEqualityComponents(): unknown[] {
    return [this.maxPerSlot, this.maxDaily];
  }

  /**
   * Returns a string representation of the capacity
   */
  toString(): string {
    if (this.maxDaily === null) {
      return `${this.maxPerSlot} per slot (unlimited daily)`;
    }

    return `${this.maxPerSlot} per slot, ${this.maxDaily} per day`;
  }
}
