import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfferingModel } from '@offering/infra/persistence/models/offering';
import { OfferingFactory } from '@offering/infra/persistence/factories/offering-factory';
import { OfferingWriteRepository } from '@offering/infra/persistence/repositories/offering-write';
import { OfferingReadRepository } from '@offering/infra/persistence/repositories/offering-read';

// Controllers
import { OfferingCrudController } from '@offering/presentation/controllers/offering-crud.controller';

// Command Handlers
import { CreateOfferingHandler } from '@offering/app/commands/create-offering/handler';
import { UpdateOfferingHandler } from '@offering/app/commands/update-offering/handler';
import { DeactivateOfferingHandler } from '@offering/app/commands/deactivate-offering/handler';
import { ActivateOfferingHandler } from '@offering/app/commands/activate-offering/handler';

// Query Handlers
import { GetActiveOfferingsHandler } from '@offering/app/queries/get-active-offerings/handler';
import { GetOfferingByIdHandler } from '@offering/app/queries/get-offering-by-id/handler';
import { GetOfferingsByBusinessHandler } from '@offering/app/queries/get-offerings-by-business/handler';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([OfferingModel])],
  controllers: [OfferingCrudController],
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
