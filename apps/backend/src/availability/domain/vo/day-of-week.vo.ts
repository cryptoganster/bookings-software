import { ValueObject } from '@shared/kernel/value-object';

export class DayOfWeek extends ValueObject {
  private static readonly DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  private constructor(private readonly value: number) {
    super();
    this.validate();
  }

  static create(value: number): DayOfWeek {
    return new DayOfWeek(value);
  }

  static fromString(dayName: string): DayOfWeek {
    const index = DayOfWeek.DAY_NAMES.findIndex(
      (name) => name.toLowerCase() === dayName.toLowerCase(),
    );

    if (index === -1) {
      throw new Error(`Invalid day name: ${dayName}`);
    }

    return new DayOfWeek(index);
  }

  private validate(): void {
    if (!Number.isInteger(this.value)) {
      throw new Error(`Day of week must be an integer, got: ${this.value}`);
    }

    if (this.value < 0 || this.value > 6) {
      throw new Error(`Day of week must be between 0 and 6, got: ${this.value}`);
    }
  }

  getValue(): number {
    return this.value;
  }

  toString(): string {
    return DayOfWeek.DAY_NAMES[this.value];
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
