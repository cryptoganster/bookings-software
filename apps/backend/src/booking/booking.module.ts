import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Models
import { AppointmentModel } from './infra/persistence/models/appointment';

// Modules
import { AvailabilityModule } from '@availability/availability.module';

// Command Handlers
import { CreateAppointmentHandler } from './app/commands/create-appointment/handler';
import { CancelAppointmentHandler } from './app/commands/cancel-appointment/handler';
import { ModifyAppointmentHandler } from './app/commands/modify-appointment/handler';

// Query Handlers
import { GetAppointmentHandler } from './app/queries/get-appointment/handler';
import { GetCustomerAppointmentsHandler } from './app/queries/get-customer-appointments/handler';
import { GetBusinessAppointmentsHandler } from './app/queries/get-business-appointments/handler';
import { GetUpcomingAppointmentsHandler } from './app/queries/get-upcoming-appointments/handler';
import { GetAppointmentStatsHandler } from './app/queries/get-appointment-stats/handler';

// Event Handlers
import { OnAppointmentCreatedHandler } from './app/event-handlers/on-appointment-created';
import { OnAppointmentCancelledHandler } from './app/event-handlers/on-appointment-cancelled';

// Sagas
import { AppointmentNotificationSaga } from './app/sagas/appointment-notification';

// Repositories
import { AppointmentWriteRepository } from './infra/persistence/repositories/appointment-write';
import { AppointmentReadRepository } from './infra/persistence/repositories/appointment-read';

// Factories
import { AppointmentFactory } from './infra/persistence/factories/appointment-factory';

// Controllers
import { AppointmentController } from './presentation/controllers/appointment.controller';

const CommandHandlers = [
  CreateAppointmentHandler,
  CancelAppointmentHandler,
  ModifyAppointmentHandler,
];

const QueryHandlers = [
  GetAppointmentHandler,
  GetCustomerAppointmentsHandler,
  GetBusinessAppointmentsHandler,
  GetUpcomingAppointmentsHandler,
  GetAppointmentStatsHandler,
];

const EventHandlers = [OnAppointmentCreatedHandler, OnAppointmentCancelledHandler];

const Sagas = [AppointmentNotificationSaga];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([AppointmentModel]), AvailabilityModule],
  controllers: [AppointmentController],
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

    // Factories
    {
      provide: 'IAppointmentFactory',
      useClass: AppointmentFactory,
    },
  ],
  exports: ['IAppointmentWriteRepository', 'IAppointmentReadRepository', 'IAppointmentFactory'],
})
export class BookingModule {}
