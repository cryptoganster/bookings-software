import { ValueObject } from '@shared/kernel/value-object';

export class TimeSlot extends ValueObject {
  private constructor(
    private readonly startTime: string,
    private readonly endTime: string,
  ) {
    super();
    this.validate();
  }

  static create(startTime: string, endTime: string): TimeSlot {
    return new TimeSlot(startTime, endTime);
  }

  private validate(): void {
    // Validar formato HH:mm
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

    if (!timeRegex.test(this.startTime)) {
      throw new Error(`Invalid start time format: ${this.startTime}. Expected HH:mm`);
    }

    if (!timeRegex.test(this.endTime)) {
      throw new Error(`Invalid end time format: ${this.endTime}. Expected HH:mm`);
    }

    // Validar que startTime < endTime
    if (this.startTime >= this.endTime) {
      throw new Error(`Start time (${this.startTime}) must be before end time (${this.endTime})`);
    }
  }

  getStartTime(): string {
    return this.startTime;
  }

  getEndTime(): string {
    return this.endTime;
  }

  includes(time: string): boolean {
    return time >= this.startTime && time <= this.endTime;
  }

  getDurationInMinutes(): number {
    const [startHour, startMinute] = this.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.endTime.split(':').map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    return endTotalMinutes - startTotalMinutes;
  }

  protected getEqualityComponents(): unknown[] {
    return [this.startTime, this.endTime];
  }
}
