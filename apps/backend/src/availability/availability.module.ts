import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Models
import { CapacityModel } from '@availability/infra/persistence/models/capacity';
import { ScheduleModel } from '@availability/infra/persistence/models/schedule';
import { BlockoutModel } from '@availability/infra/persistence/models/blockout';

// Controllers
import { ScheduleCrudController } from '@availability/presentation/controllers/schedule-crud.controller';
import { BlockoutCrudController } from '@availability/presentation/controllers/blockout-crud.controller';
import { AvailabilityQueryController } from '@availability/presentation/controllers/availability-query.controller';

// Repositories
import { CapacityReadRepository } from '@availability/infra/persistence/repositories/capacity-read';
import { CapacityWriteRepository } from '@availability/infra/persistence/repositories/capacity-write';
import { ScheduleReadRepository } from '@availability/infra/persistence/repositories/schedule-read';
import { ScheduleWriteRepository } from '@availability/infra/persistence/repositories/schedule-write';
import { BlockoutReadRepository } from '@availability/infra/persistence/repositories/blockout-read';
import { BlockoutWriteRepository } from '@availability/infra/persistence/repositories/blockout-write';

// Factories
import { CapacityFactory } from '@availability/infra/persistence/factories/capacity-factory';
import { ScheduleFactory } from '@availability/infra/persistence/factories/schedule-factory';
import { BlockoutFactory } from '@availability/infra/persistence/factories/blockout-factory';

// Domain Services
import { AvailabilityChecker } from '@availability/domain/services/availability-checker.service';

// Command Handlers
import { SetCapacityHandler } from '@availability/app/commands/set-capacity/handler';
import { CreateScheduleHandler } from '@availability/app/commands/create-schedule/handler';
import { UpdateScheduleHandler } from '@availability/app/commands/update-schedule/handler';
import { DeleteScheduleHandler } from '@availability/app/commands/delete-schedule/handler';
import { CreateBlockoutHandler } from '@availability/app/commands/create-blockout/handler';
import { RemoveBlockoutHandler } from '@availability/app/commands/remove-blockout/handler';

// Query Handlers
import { GetAvailableSlotsHandler } from '@availability/app/queries/get-available-slots/handler';
import { GetSchedulesByBusinessHandler } from '@availability/app/queries/get-schedules-by-business/handler';
import { GetBlockoutsByBusinessHandler } from '@availability/app/queries/get-blockouts-by-business/handler';
import { GetAvailableDatesHandler } from '@availability/app/queries/get-available-dates/handler';

const CommandHandlers = [
  SetCapacityHandler,
  CreateScheduleHandler,
  UpdateScheduleHandler,
  DeleteScheduleHandler,
  CreateBlockoutHandler,
  RemoveBlockoutHandler,
];
const QueryHandlers = [
  GetAvailableSlotsHandler,
  GetSchedulesByBusinessHandler,
  GetBlockoutsByBusinessHandler,
  GetAvailableDatesHandler,
];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([CapacityModel, ScheduleModel, BlockoutModel])],
  controllers: [ScheduleCrudController, BlockoutCrudController, AvailabilityQueryController],
  providers: [
    // Repositories
    {
      provide: 'ICapacityReadRepository',
      useClass: CapacityReadRepository,
    },
    {
      provide: 'ICapacityWriteRepository',
      useClass: CapacityWriteRepository,
    },
    {
      provide: 'IScheduleReadRepository',
      useClass: ScheduleReadRepository,
    },
    {
      provide: 'IScheduleWriteRepository',
      useClass: ScheduleWriteRepository,
    },
    {
      provide: 'IBlockoutReadRepository',
      useClass: BlockoutReadRepository,
    },
    {
      provide: 'IBlockoutWriteRepository',
      useClass: BlockoutWriteRepository,
    },
    // Factories
    {
      provide: 'ICapacityFactory',
      useClass: CapacityFactory,
    },
    {
      provide: 'IScheduleFactory',
      useClass: ScheduleFactory,
    },
    {
      provide: 'IBlockoutFactory',
      useClass: BlockoutFactory,
    },
    // Domain Services
    {
      provide: 'IAvailabilityChecker',
      useClass: AvailabilityChecker,
    },
    // Command Handlers
    ...CommandHandlers,
    // Query Handlers
    ...QueryHandlers,
  ],
  exports: [
    'ICapacityReadRepository',
    'ICapacityWriteRepository',
    'ICapacityFactory',
    'IScheduleReadRepository',
    'IScheduleWriteRepository',
    'IScheduleFactory',
    'IBlockoutReadRepository',
    'IBlockoutWriteRepository',
    'IBlockoutFactory',
    'IAvailabilityChecker',
  ],
})
export class AvailabilityModule {}
