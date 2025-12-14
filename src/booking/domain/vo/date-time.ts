import { ValueObject } from '@shared/kernel/value-object';

export class DateTime extends ValueObject {
  private constructor(private readonly value: Date) {
    super();
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      throw new Error('Invalid date');
    }
  }

  // Factory methods
  static fromDate(date: Date): DateTime {
    return new DateTime(new Date(date.getTime()));
  }

  static now(): DateTime {
    return new DateTime(new Date());
  }

  static fromString(dateString: string): DateTime {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date string: ${dateString}`);
    }
    return new DateTime(date);
  }

  // Métodos de negocio
  toDate(): Date {
    return new Date(this.value.getTime());
  }

  isInPast(): boolean {
    return this.value.getTime() < Date.now();
  }

  isWithinHours(hours: number): boolean {
    const diffMs = this.value.getTime() - Date.now();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours <= hours && diffHours >= 0;
  }

  isWithinMinutes(minutes: number): boolean {
    const diffMs = this.value.getTime() - Date.now();
    const diffMinutes = diffMs / (1000 * 60);
    return diffMinutes <= minutes && diffMinutes >= 0;
  }

  getDayOfWeek(): number {
    return this.value.getDay();
  }

  getTime(): string {
    return this.value.toTimeString().split(' ')[0];
  }

  getDate(): Date {
    const date = new Date(this.value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Equality
  protected getEqualityComponents(): any[] {
    return [this.value.getTime()];
  }

  toString(): string {
    return this.value.toISOString();
  }
}
