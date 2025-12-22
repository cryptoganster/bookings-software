import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Models
import { AppointmentModel } from '@booking/infra/persistence/models/appointment';

// Modules
import { AvailabilityModule } from '@availability/availability.module';
import { CustomerModule } from '@customer/customer.module';

// Command Handlers
import { CreateAppointmentHandler } from '@booking/app/commands/create-appointment/handler';
import { CancelAppointmentHandler } from '@booking/app/commands/cancel-appointment/handler';
import { ModifyAppointmentHandler } from '@booking/app/commands/modify-appointment/handler';

// Query Handlers
import { GetAppointmentHandler } from '@booking/app/queries/get-appointment/handler';
import { GetCustomerAppointmentsHandler } from '@booking/app/queries/get-customer-appointments/handler';
import { GetBusinessAppointmentsHandler } from '@booking/app/queries/get-business-appointments/handler';
import { GetUpcomingAppointmentsHandler } from '@booking/app/queries/get-upcoming-appointments/handler';
import { GetAppointmentStatsHandler } from '@booking/app/queries/get-appointment-stats/handler';

// Event Handlers
import { OnAppointmentCreatedHandler } from '@booking/app/event-handlers/on-appointment-created';
import { OnAppointmentCancelledHandler } from '@booking/app/event-handlers/on-appointment-cancelled';

// Sagas
import { AppointmentNotificationSaga } from '@booking/app/sagas/appointment-notification';

// Repositories
import { AppointmentWriteRepository } from '@booking/infra/persistence/repositories/appointment-write';
import { AppointmentReadRepository } from '@booking/infra/persistence/repositories/appointment-read';

// Factories
import { AppointmentFactory } from '@booking/infra/persistence/factories/appointment-factory';

// Controllers
import { AppointmentController } from '@booking/presentation/controllers/appointment.controller';

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
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([AppointmentModel]),
    AvailabilityModule,
    forwardRef(() => CustomerModule), // ← Use forwardRef to avoid circular dependency
  ],
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
