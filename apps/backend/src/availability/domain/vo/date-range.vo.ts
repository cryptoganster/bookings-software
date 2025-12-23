import { ValueObject } from '@shared/kernel/value-object';

export class DateRange extends ValueObject {
  private constructor(
    private readonly startDate: Date,
    private readonly endDate: Date,
    private readonly skipValidation: boolean = false,
  ) {
    super();
    if (!skipValidation) {
      this.validate();
    }
  }

  static create(startDate: Date, endDate: Date): DateRange {
    return new DateRange(startDate, endDate, false);
  }

  static fromPersistence(startDate: Date, endDate: Date): DateRange {
    // Skip validation when loading from database (dates might be in the past)
    return new DateRange(startDate, endDate, true);
  }

  private validate(): void {
    // Normalizar fechas a medianoche UTC para comparación consistente
    const normalizedStart = new Date(this.startDate);
    normalizedStart.setUTCHours(0, 0, 0, 0);

    const normalizedEnd = new Date(this.endDate);
    normalizedEnd.setUTCHours(0, 0, 0, 0);

    // Validar que startDate <= endDate
    if (normalizedStart > normalizedEnd) {
      throw new Error(
        `Start date (${this.startDate.toISOString()}) must be before or equal to end date (${this.endDate.toISOString()})`,
      );
    }

    // Validar que no sea en el pasado (comparar en UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (normalizedStart < today) {
      throw new Error(`Start date cannot be in the past: ${this.startDate.toISOString()}`);
    }
  }

  getStartDate(): Date {
    return this.startDate;
  }

  getEndDate(): Date {
    return this.endDate;
  }

  includes(date: Date): boolean {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const normalizedStart = new Date(this.startDate);
    normalizedStart.setUTCHours(0, 0, 0, 0);

    const normalizedEnd = new Date(this.endDate);
    normalizedEnd.setUTCHours(0, 0, 0, 0);

    return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
  }

  getDurationInDays(): number {
    const normalizedStart = new Date(this.startDate);
    normalizedStart.setUTCHours(0, 0, 0, 0);

    const normalizedEnd = new Date(this.endDate);
    normalizedEnd.setUTCHours(0, 0, 0, 0);

    const diffTime = normalizedEnd.getTime() - normalizedStart.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
  }

  protected getEqualityComponents(): any[] {
    return [this.startDate.toISOString(), this.endDate.toISOString()];
  }
}
