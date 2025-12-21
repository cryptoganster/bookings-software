import { ValueObject } from '@shared/kernel/value-object';

/**
 * SubscriptionStatus Value Object
 * Representa el estado de la suscripción de un BusinessOwner
 */
export class SubscriptionStatus extends ValueObject {
  private constructor(private readonly value: string) {
    super();
  }

  /**
   * Estado ACTIVE: Suscripción activa, puede crear citas
   */
  static active(): SubscriptionStatus {
    return new SubscriptionStatus('ACTIVE');
  }

  /**
   * Estado SUSPENDED: Suscripción suspendida, no puede crear citas
   */
  static suspended(): SubscriptionStatus {
    return new SubscriptionStatus('SUSPENDED');
  }

  /**
   * Estado CANCELLED: Suscripción cancelada
   */
  static cancelled(): SubscriptionStatus {
    return new SubscriptionStatus('CANCELLED');
  }

  /**
   * Crea un SubscriptionStatus desde un string
   * @throws Error si el estado no es válido
   */
  static fromString(value: string): SubscriptionStatus {
    switch (value) {
      case 'ACTIVE':
        return SubscriptionStatus.active();
      case 'SUSPENDED':
        return SubscriptionStatus.suspended();
      case 'CANCELLED':
        return SubscriptionStatus.cancelled();
      default:
        throw new Error(`Invalid subscription status: ${value}`);
    }
  }

  isActive(): boolean {
    return this.value === 'ACTIVE';
  }

  isSuspended(): boolean {
    return this.value === 'SUSPENDED';
  }

  isCancelled(): boolean {
    return this.value === 'CANCELLED';
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
