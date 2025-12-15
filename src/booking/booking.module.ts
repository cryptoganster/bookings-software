import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Models
import { AppointmentModel } from './infra/persistence/models/appointment';
import { CapacityModel } from '@availability/infra/persistence/models/capacity';

// Command Handlers
import { CreateAppointmentHandler } from './app/commands/create-appointment/handler';
import { CancelAppointmentHandler } from './app/commands/cancel-appointment/handler';
import { ModifyAppointmentHandler } from './app/commands/modify-appointment/handler';

// Query Handlers
import { GetAppointmentHandler } from './app/queries/get-appointment/handler';
import { GetCustomerAppointmentsHandler } from './app/queries/get-customer-appointments/handler';

// Event Handlers
import { OnAppointmentCreatedHandler } from './app/event-handlers/on-appointment-created';
import { OnAppointmentCancelledHandler } from './app/event-handlers/on-appointment-cancelled';

// Sagas
import { AppointmentNotificationSaga } from './app/sagas/appointment-notification';

// Repositories
import { AppointmentWriteRepository } from './infra/persistence/repositories/appointment-write';
import { AppointmentReadRepository } from './infra/persistence/repositories/appointment-read';
import { CapacityReadRepository } from './infra/persistence/repositories/capacity-read';

// Mock implementations for Capacity (will be replaced by AvailabilityModule)
class MockCapacityFactory {
  async loadByOfferingAndDate(offeringId: string, date: Date): Promise<any> {
    // Mock implementation - returns a capacity aggregate with available slots
    return {
      hasAvailableSlots: () => true,
      decrementSlot: () => {},
    };
  }

  async loadById(id: string): Promise<any> {
    return {
      hasAvailableSlots: () => true,
      decrementSlot: () => {},
    };
  }
}

class MockCapacityWriteRepository {
  async save(capacity: any): Promise<void> {
    // Mock implementation - does nothing
  }
}

const CommandHandlers = [
  CreateAppointmentHandler,
  CancelAppointmentHandler,
  ModifyAppointmentHandler,
];

const QueryHandlers = [GetAppointmentHandler, GetCustomerAppointmentsHandler];

const EventHandlers = [OnAppointmentCreatedHandler, OnAppointmentCancelledHandler];

const Sagas = [AppointmentNotificationSaga];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([AppointmentModel, CapacityModel])],
  providers: [
    // Command Handlers
    ...CommandHandlers,

    // Query Handlers
    ...QueryHandlers,

    // Event Handlers
    ...EventHandlers,

    // Sagas
    ...Sagas,

    // Repositories
    {
      provide: 'IAppointmentWriteRepository',
      useClass: AppointmentWriteRepository,
    },
    {
      provide: 'IAppointmentReadRepository',
      useClass: AppointmentReadRepository,
    },
    {
      provide: 'ICapacityFactory',
      useClass: MockCapacityFactory,
    },
    {
      provide: 'ICapacityWriteRepository',
      useClass: MockCapacityWriteRepository,
    },
    {
      provide: 'ICapacityReadRepository',
      useClass: CapacityReadRepository,
    },
  ],
  exports: [
    'IAppointmentWriteRepository',
    'IAppointmentReadRepository',
    'ICapacityFactory',
    'ICapacityWriteRepository',
    'ICapacityReadRepository',
  ],
})
export class BookingModule {}
