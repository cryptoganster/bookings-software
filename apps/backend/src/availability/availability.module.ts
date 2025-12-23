import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Models
import { CapacityModel } from '@availability/infra/persistence/models/capacity';

// Controllers
import { ScheduleCrudController } from '@availability/presentation/controllers/schedule-crud.controller';
import { BlockoutCrudController } from '@availability/presentation/controllers/blockout-crud.controller';
import { AvailabilityQueryController } from '@availability/presentation/controllers/availability-query.controller';

// Repositories
import { CapacityReadRepository } from '@availability/infra/persistence/repositories/capacity-read';
import { CapacityWriteRepository } from '@availability/infra/persistence/repositories/capacity-write';

// Factories
import { CapacityFactory } from '@availability/infra/persistence/factories/capacity-factory';

// Domain Services
import { AvailabilityChecker } from '@availability/domain/services/availability-checker.service';

// Command Handlers
import { SetCapacityHandler } from '@availability/app/commands/set-capacity/handler';

// Query Handlers
import { GetAvailableSlotsHandler } from '@availability/app/queries/get-available-slots/handler';

const CommandHandlers = [SetCapacityHandler];
const QueryHandlers = [GetAvailableSlotsHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([CapacityModel])],
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
    // Factory
    {
      provide: 'ICapacityFactory',
      useClass: CapacityFactory,
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
    'IAvailabilityChecker',
  ],
})
export class AvailabilityModule {}
