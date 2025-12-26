import { AggregateRoot } from '@nestjs/cqrs';
import { UUID } from '@shared/vo/uuid';
import { TimeSlot } from '@availability/domain/vo/time-slot.vo';
import { DayOfWeek } from '@availability/domain/vo/day-of-week.vo';
import { ScheduleCreated } from '@availability/domain/events/schedule-created';
import { ScheduleUpdated } from '@availability/domain/events/schedule-updated';
import { ScheduleDeleted } from '@availability/domain/events/schedule-deleted';

export class Schedule extends AggregateRoot {
  private id!: UUID;
  private businessId!: UUID;
  private dayOfWeek!: DayOfWeek;
  private timeSlot!: TimeSlot;
  private isActive!: boolean;

  // Factory method para creación
  static create(id: UUID, businessId: UUID, dayOfWeek: DayOfWeek, timeSlot: TimeSlot): Schedule {
    const schedule = new Schedule();
    schedule.id = id;
    schedule.businessId = businessId;
    schedule.dayOfWeek = dayOfWeek;
    schedule.timeSlot = timeSlot;
    schedule.isActive = true;

    // Publicar evento
    schedule.apply(
      new ScheduleCreated(
        id.getValue(),
        businessId.getValue(),
        dayOfWeek.getValue(),
        timeSlot.getStartTime(),
        timeSlot.getEndTime(),
      ),
    );

    return schedule;
  }

  // Métodos de negocio
  update(timeSlot: TimeSlot): void {
    this.timeSlot = timeSlot;

    // Publicar evento
    this.apply(
      new ScheduleUpdated(
        this.id.getValue(),
        this.businessId.getValue(),
        this.dayOfWeek.getValue(),
        timeSlot.getStartTime(),
        timeSlot.getEndTime(),
      ),
    );
  }

  deactivate(): void {
    this.isActive = false;

    // Publicar evento
    this.apply(
      new ScheduleDeleted(
        this.id.getValue(),
        this.businessId.getValue(),
        this.dayOfWeek.getValue(),
      ),
    );
  }

  activate(): void {
    this.isActive = true;
  }

  // Factory method para reconstrucción desde persistencia
  static fromPersistence(
    id: UUID,
    businessId: UUID,
    dayOfWeek: DayOfWeek,
    timeSlot: TimeSlot,
    isActive: boolean,
  ): Schedule {
    const schedule = new Schedule();
    schedule.id = id;
    schedule.businessId = businessId;
    schedule.dayOfWeek = dayOfWeek;
    schedule.timeSlot = timeSlot;
    schedule.isActive = isActive;
    return schedule;
  }

  // Getters
  getId(): UUID {
    return this.id;
  }

  getBusinessId(): UUID {
    return this.businessId;
  }

  getDayOfWeek(): DayOfWeek {
    return this.dayOfWeek;
  }

  getTimeSlot(): TimeSlot {
    return this.timeSlot;
  }

  getIsActive(): boolean {
    return this.isActive;
  }
}
