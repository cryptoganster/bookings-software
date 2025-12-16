import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfferingModel } from './infra/persistence/models/offering';
import { OfferingFactory } from './infra/persistence/factories/offering-factory';
import { OfferingWriteRepository } from './infra/persistence/repositories/offering-write';
import { OfferingReadRepository } from './infra/persistence/repositories/offering-read';
import { CreateOfferingHandler } from './app/commands/create-offering/handler';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([OfferingModel])],
  providers: [
    // Factories
    {
      provide: 'IOfferingFactory',
      useClass: OfferingFactory,
    },
    // Repositories
    {
      provide: 'IOfferingWriteRepository',
      useClass: OfferingWriteRepository,
    },
    {
      provide: 'IOfferingReadRepository',
      useClass: OfferingReadRepository,
    },
    // Command Handlers
    CreateOfferingHandler,
  ],
  exports: ['IOfferingFactory', 'IOfferingWriteRepository', 'IOfferingReadRepository'],
})
export class OfferingModule {}
