import { ValueObject } from '@shared/kernel/value-object';

export class AppointmentStatus extends ValueObject {
  private constructor(private readonly value: string) {
    super();
    if (!['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(value)) {
      throw new Error(`Invalid appointment status: ${value}`);
    }
  }

  // Factory methods
  static confirmed(): AppointmentStatus {
    return new AppointmentStatus('CONFIRMED');
  }

  static cancelled(): AppointmentStatus {
    return new AppointmentStatus('CANCELLED');
  }

  static completed(): AppointmentStatus {
    return new AppointmentStatus('COMPLETED');
  }

  static fromString(value: string): AppointmentStatus {
    return new AppointmentStatus(value);
  }

  // Métodos de negocio
  canBeCancelled(): boolean {
    return this.value === 'CONFIRMED';
  }

  isCancelled(): boolean {
    return this.value === 'CANCELLED';
  }

  isConfirmed(): boolean {
    return this.value === 'CONFIRMED';
  }

  isCompleted(): boolean {
    return this.value === 'COMPLETED';
  }

  // Getters
  getValue(): string {
    return this.value;
  }

  // Equality
  protected getEqualityComponents(): unknown[] {
    return [this.value];
  }
}
