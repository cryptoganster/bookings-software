import { AggregateRoot } from '@nestjs/cqrs';
import { UUID } from '@shared/vo/uuid';
import { DateRange } from '@availability/domain/vo/date-range.vo';
import { BlockoutCreated } from '@availability/domain/events/blockout-created';
import { BlockoutRemoved } from '@availability/domain/events/blockout-removed';

export class Blockout extends AggregateRoot {
  private id!: UUID;
  private businessId!: UUID;
  private dateRange!: DateRange;
  private reason!: string | null;

  // Factory method para creación
  static create(
    id: UUID,
    businessId: UUID,
    dateRange: DateRange,
    reason: string | null = null,
  ): Blockout {
    const blockout = new Blockout();
    blockout.id = id;
    blockout.businessId = businessId;
    blockout.dateRange = dateRange;
    blockout.reason = reason;

    // Publicar evento
    blockout.apply(
      new BlockoutCreated(
        id.getValue(),
        businessId.getValue(),
        dateRange.getStartDate(),
        dateRange.getEndDate(),
        reason,
      ),
    );

    return blockout;
  }

  // Métodos de negocio
  isDateBlocked(date: Date): boolean {
    return this.dateRange.includes(date);
  }

  remove(): void {
    // Publicar evento
    this.apply(new BlockoutRemoved(this.id.getValue(), this.businessId.getValue()));
  }

  // Factory method para reconstrucción desde persistencia
  static fromPersistence(
    id: UUID,
    businessId: UUID,
    dateRange: DateRange,
    reason: string | null,
  ): Blockout {
    const blockout = new Blockout();
    blockout.id = id;
    blockout.businessId = businessId;
    blockout.dateRange = dateRange;
    blockout.reason = reason;
    return blockout;
  }

  // Getters
  getId(): UUID {
    return this.id;
  }

  getBusinessId(): UUID {
    return this.businessId;
  }

  getDateRange(): DateRange {
    return this.dateRange;
  }

  getReason(): string | null {
    return this.reason;
  }
}
