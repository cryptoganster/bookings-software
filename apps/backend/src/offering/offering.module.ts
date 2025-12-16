import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfferingModel } from './infra/persistence/models/offering';
import { OfferingFactory } from './infra/persistence/factories/offering-factory';
import { OfferingWriteRepository } from './infra/persistence/repositories/offering-write';
import { OfferingReadRepository } from './infra/persistence/repositories/offering-read';

// Command Handlers
import { CreateOfferingHandler } from './app/commands/create-offering/handler';
import { UpdateOfferingHandler } from './app/commands/update-offering/handler';
import { DeactivateOfferingHandler } from './app/commands/deactivate-offering/handler';
import { ActivateOfferingHandler } from './app/commands/activate-offering/handler';

// Query Handlers
import { GetActiveOfferingsHandler } from './app/queries/get-active-offerings/handler';
import { GetOfferingByIdHandler } from './app/queries/get-offering-by-id/handler';
import { GetOfferingsByBusinessHandler } from './app/queries/get-offerings-by-business/handler';

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
    UpdateOfferingHandler,
    DeactivateOfferingHandler,
    ActivateOfferingHandler,
    // Query Handlers
    GetActiveOfferingsHandler,
    GetOfferingByIdHandler,
    GetOfferingsByBusinessHandler,
  ],
  exports: ['IOfferingFactory', 'IOfferingWriteRepository', 'IOfferingReadRepository'],
})
export class OfferingModule {}
