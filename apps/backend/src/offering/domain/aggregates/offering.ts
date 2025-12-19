import { VersionedAggregateRoot } from '@shared/kernel/versioned-aggregate-root';
import { UUID } from '@shared/vo/uuid';
import { OfferingDuration } from '@offering/domain/vo/offering-duration';
import { OfferingCreated } from '@offering/domain/events/offering-created';
import { OfferingUpdated } from '@offering/domain/events/offering-updated';
import { OfferingDeactivated } from '@offering/domain/events/offering-deactivated';
import { OfferingActivated } from '@offering/domain/events/offering-activated';
import { InvalidOfferingCapacityException } from '@offering/domain/exceptions/invalid-offering-capacity';

export class Offering extends VersionedAggregateRoot {
  private id!: UUID;
  private businessId!: UUID;
  private name!: string;
  private duration!: OfferingDuration;
  private maxCapacityPerSlot!: number;
  private maxDailyCapacity!: number | null;
  private isActive!: boolean;

  // Factory method para creación
  static create(
    id: UUID,
    businessId: UUID,
    name: string,
    duration: OfferingDuration,
    maxCapacityPerSlot: number,
    maxDailyCapacity: number | null,
  ): Offering {
    // Validar capacidad
    if (maxCapacityPerSlot < 1) {
      throw new InvalidOfferingCapacityException('maxCapacityPerSlot must be at least 1');
    }

    if (maxDailyCapacity !== null && maxDailyCapacity < maxCapacityPerSlot) {
      throw new InvalidOfferingCapacityException(
        'maxDailyCapacity must be greater than or equal to maxCapacityPerSlot',
      );
    }

    const offering = new Offering();
    offering.id = id;
    offering.businessId = businessId;
    offering.name = name;
    offering.duration = duration;
    offering.maxCapacityPerSlot = maxCapacityPerSlot;
    offering.maxDailyCapacity = maxDailyCapacity;
    offering.isActive = true;

    // Publicar evento
    offering.apply(
      new OfferingCreated(
        id.getValue(),
        businessId.getValue(),
        name,
        duration.getMinutes(),
        maxCapacityPerSlot,
        maxDailyCapacity,
      ),
    );
    offering.incrementVersion();

    return offering;
  }

  // Método de negocio: actualizar offering
  update(
    name: string,
    duration: OfferingDuration,
    maxCapacityPerSlot: number,
    maxDailyCapacity: number | null,
  ): void {
    // Validar capacidad
    if (maxCapacityPerSlot < 1) {
      throw new InvalidOfferingCapacityException('maxCapacityPerSlot must be at least 1');
    }

    if (maxDailyCapacity !== null && maxDailyCapacity < maxCapacityPerSlot) {
      throw new InvalidOfferingCapacityException(
        'maxDailyCapacity must be greater than or equal to maxCapacityPerSlot',
      );
    }

    // Actualizar atributos
    this.name = name;
    this.duration = duration;
    this.maxCapacityPerSlot = maxCapacityPerSlot;
    this.maxDailyCapacity = maxDailyCapacity;
    this.incrementVersion();

    // Publicar evento
    this.apply(
      new OfferingUpdated(
        this.id.getValue(),
        this.businessId.getValue(),
        name,
        duration.getMinutes(),
        maxCapacityPerSlot,
        maxDailyCapacity,
      ),
    );
  }

  // Método de negocio: desactivar offering
  deactivate(): void {
    this.isActive = false;
    this.incrementVersion();

    // Publicar evento
    this.apply(new OfferingDeactivated(this.id.getValue(), this.businessId.getValue()));
  }

  // Método de negocio: activar offering
  activate(): void {
    this.isActive = true;
    this.incrementVersion();

    // Publicar evento
    this.apply(new OfferingActivated(this.id.getValue(), this.businessId.getValue()));
  }

  // Factory method para reconstrucción desde persistencia
  static fromPersistence(
    id: UUID,
    businessId: UUID,
    name: string,
    duration: OfferingDuration,
    maxCapacityPerSlot: number,
    maxDailyCapacity: number | null,
    isActive: boolean,
    version: number,
  ): Offering {
    const offering = new Offering();
    offering.id = id;
    offering.businessId = businessId;
    offering.name = name;
    offering.duration = duration;
    offering.maxCapacityPerSlot = maxCapacityPerSlot;
    offering.maxDailyCapacity = maxDailyCapacity;
    offering.isActive = isActive;
    offering.setVersion(version);
    return offering;
  }

  // Getters (no setters públicos)
  getId(): UUID {
    return this.id;
  }

  getBusinessId(): UUID {
    return this.businessId;
  }

  getName(): string {
    return this.name;
  }

  getDuration(): OfferingDuration {
    return this.duration;
  }

  getMaxCapacityPerSlot(): number {
    return this.maxCapacityPerSlot;
  }

  getMaxDailyCapacity(): number | null {
    return this.maxDailyCapacity;
  }

  isActiveOffering(): boolean {
    return this.isActive;
  }
}
