import { ValueObject } from '@shared/kernel/value-object';

/**
 * SubscriptionPlan Value Object
 * Representa el plan de suscripción de un BusinessOwner con sus límites
 */
export class SubscriptionPlan extends ValueObject {
  private constructor(
    private readonly name: string,
    private readonly maxBusinesses: number,
    private readonly maxAppointmentsPerMonth: number,
    private readonly price: number,
  ) {
    super();
  }

  /**
   * Plan FREE: 1 negocio, 100 citas/mes, $0
   */
  static free(): SubscriptionPlan {
    return new SubscriptionPlan('FREE', 1, 100, 0);
  }

  /**
   * Plan BASIC: 1 negocio, 500 citas/mes, $29
   */
  static basic(): SubscriptionPlan {
    return new SubscriptionPlan('BASIC', 1, 500, 29);
  }

  /**
   * Plan PRO: 3 negocios, 2000 citas/mes, $79
   */
  static pro(): SubscriptionPlan {
    return new SubscriptionPlan('PRO', 3, 2000, 79);
  }

  /**
   * Plan ENTERPRISE: 10 negocios, 10000 citas/mes, $199
   */
  static enterprise(): SubscriptionPlan {
    return new SubscriptionPlan('ENTERPRISE', 10, 10000, 199);
  }

  /**
   * Crea un SubscriptionPlan desde un string
   * @throws Error si el plan no es válido
   */
  static fromString(value: string): SubscriptionPlan {
    switch (value) {
      case 'FREE':
        return SubscriptionPlan.free();
      case 'BASIC':
        return SubscriptionPlan.basic();
      case 'PRO':
        return SubscriptionPlan.pro();
      case 'ENTERPRISE':
        return SubscriptionPlan.enterprise();
      default:
        throw new Error(`Invalid subscription plan: ${value}`);
    }
  }

  /**
   * Verifica si se puede mejorar a otro plan
   * Solo permite upgrades (FREE → BASIC → PRO → ENTERPRISE)
   */
  canUpgradeTo(other: SubscriptionPlan): boolean {
    const tiers = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
    const currentIndex = tiers.indexOf(this.name);
    const targetIndex = tiers.indexOf(other.name);
    return targetIndex > currentIndex;
  }

  getName(): string {
    return this.name;
  }

  getMaxBusinesses(): number {
    return this.maxBusinesses;
  }

  getMaxAppointmentsPerMonth(): number {
    return this.maxAppointmentsPerMonth;
  }

  getPrice(): number {
    return this.price;
  }

  protected getEqualityComponents(): unknown[] {
    return [this.name];
  }
}
