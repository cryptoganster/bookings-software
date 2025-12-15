import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Models
import { CapacityModel } from './infra/persistence/models/capacity';

// Repositories
import { CapacityReadRepository } from './infra/persistence/repositories/capacity-read';
import { CapacityWriteRepository } from './infra/persistence/repositories/capacity-write';

// Factories
import { CapacityFactory } from './infra/persistence/factories/capacity-factory';

// Query Handlers
import { GetAvailableSlotsHandler } from './app/queries/get-available-slots/handler';

const QueryHandlers = [GetAvailableSlotsHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([CapacityModel])],
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
    // Query Handlers
    ...QueryHandlers,
  ],
  exports: ['ICapacityReadRepository', 'ICapacityWriteRepository', 'ICapacityFactory'],
})
export class AvailabilityModule {}
