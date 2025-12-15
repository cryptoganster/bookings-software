import { VersionedAggregateRoot } from '@shared/kernel/versioned-aggregate-root';
import { UUID } from '@shared/vo/uuid';
import { CapacityCreated } from '../events/capacity-created';
import { SlotBooked } from '../events/slot-booked';
import { SlotReleased } from '../events/slot-released';
import { CapacityChanged } from '../events/capacity-changed';

export class Capacity extends VersionedAggregateRoot {
  private id!: UUID;
  private offeringId!: UUID;
  private date!: Date;
  private totalSlots!: number;
  private availableSlots!: number;
  private bookedSlots!: number;

  // Factory method para creación
  static create(id: UUID, offeringId: UUID, date: Date, totalSlots: number): Capacity {
    // Validaciones
    if (totalSlots < 0) {
      throw new Error('Total slots cannot be negative');
    }

    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      throw new Error('Cannot create capacity for past dates');
    }

    const capacity = new Capacity();
    capacity.id = id;
    capacity.offeringId = offeringId;
    capacity.date = date;
    capacity.totalSlots = totalSlots;
    capacity.availableSlots = totalSlots;
    capacity.bookedSlots = 0;

    // Publicar evento
    capacity.apply(
      new CapacityCreated(id.getValue(), offeringId.getValue(), date, totalSlots, totalSlots),
    );
    capacity.incrementVersion();

    return capacity;
  }

  // Métodos de negocio
  bookSlot(): void {
    // Validar que hay slots disponibles
    if (this.availableSlots <= 0) {
      throw new Error('No available slots to book');
    }

    // Decrementar slots disponibles
    this.availableSlots--;
    this.bookedSlots++;
    this.incrementVersion();

    // Publicar evento
    this.apply(
      new SlotBooked(
        this.id.getValue(),
        this.offeringId.getValue(),
        this.date,
        this.availableSlots,
      ),
    );
  }

  releaseSlot(): void {
    // Validar que hay slots reservados para liberar
    if (this.bookedSlots <= 0) {
      throw new Error('No booked slots to release');
    }

    // Validar que no excedemos el total
    if (this.availableSlots >= this.totalSlots) {
      throw new Error('Cannot release slot: already at maximum capacity');
    }

    // Incrementar slots disponibles
    this.availableSlots++;
    this.bookedSlots--;
    this.incrementVersion();

    // Publicar evento
    this.apply(
      new SlotReleased(
        this.id.getValue(),
        this.offeringId.getValue(),
        this.date,
        this.availableSlots,
      ),
    );
  }

  updateCapacity(newTotalSlots: number): void {
    // Validaciones
    if (newTotalSlots < 0) {
      throw new Error('Total slots cannot be negative');
    }

    if (newTotalSlots < this.bookedSlots) {
      throw new Error(
        `Cannot reduce capacity below booked slots (${this.bookedSlots} slots already booked)`,
      );
    }

    // Calcular nueva disponibilidad
    const difference = newTotalSlots - this.totalSlots;
    this.totalSlots = newTotalSlots;
    this.availableSlots += difference;
    this.incrementVersion();

    // Publicar evento
    this.apply(
      new CapacityChanged(
        this.id.getValue(),
        this.offeringId.getValue(),
        this.date,
        this.totalSlots,
        this.availableSlots,
      ),
    );
  }

  // Factory method para reconstrucción desde persistencia
  static fromPersistence(
    id: UUID,
    offeringId: UUID,
    date: Date,
    totalSlots: number,
    availableSlots: number,
    bookedSlots: number,
    version: number,
  ): Capacity {
    const capacity = new Capacity();
    capacity.id = id;
    capacity.offeringId = offeringId;
    capacity.date = date;
    capacity.totalSlots = totalSlots;
    capacity.availableSlots = availableSlots;
    capacity.bookedSlots = bookedSlots;
    capacity.setVersion(version);
    return capacity;
  }

  // Getters (no setters públicos)
  getId(): UUID {
    return this.id;
  }

  getOfferingId(): UUID {
    return this.offeringId;
  }

  getDate(): Date {
    return this.date;
  }

  getTotalSlots(): number {
    return this.totalSlots;
  }

  getAvailableSlots(): number {
    return this.availableSlots;
  }

  getBookedSlots(): number {
    return this.bookedSlots;
  }

  hasAvailableSlots(): boolean {
    return this.availableSlots > 0;
  }
}
