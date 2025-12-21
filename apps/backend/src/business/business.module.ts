import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessModel } from '@business/infra/persistence/models/business.model';

// Command Handlers
import { CreateBusinessHandler } from '@business/app/commands/create-business/handler';
import { UpdateBusinessInfoHandler } from '@business/app/commands/update-business-info/handler';
import { ConfigureWhatsAppHandler } from '@business/app/commands/configure-whatsapp/handler';
import { DeactivateBusinessHandler } from '@business/app/commands/deactivate-business/handler';
import { ActivateBusinessHandler } from '@business/app/commands/activate-business/handler';

// Query Handlers
import { GetBusinessHandler } from '@business/app/queries/get-business/handler';
import { GetBusinessesByOwnerIdHandler } from '@business/app/queries/get-businesses-by-owner-id/handler';
import { GetBusinessByWhatsAppPhoneHandler } from '@business/app/queries/get-business-by-whatsapp-phone/handler';

// Repositories
import { BusinessWriteRepository } from '@business/infra/persistence/repositories/business-write.repository';
import { BusinessReadRepository } from '@business/infra/persistence/repositories/business-read.repository';

// Factory
import { BusinessFactory } from '@business/infra/persistence/factories/business.factory';

// Shared
import { SharedModule } from '@shared/shared.module';

// Controllers
import { BusinessController } from '@business/presentation/controllers/business.controller';

const commandHandlers = [
  CreateBusinessHandler,
  UpdateBusinessInfoHandler,
  ConfigureWhatsAppHandler,
  DeactivateBusinessHandler,
  ActivateBusinessHandler,
];

const queryHandlers = [
  GetBusinessHandler,
  GetBusinessesByOwnerIdHandler,
  GetBusinessByWhatsAppPhoneHandler,
];

const repositories = [
  {
    provide: 'IBusinessWriteRepository',
    useClass: BusinessWriteRepository,
  },
  {
    provide: 'IBusinessReadRepository',
    useClass: BusinessReadRepository,
  },
];

const factories = [
  {
    provide: 'IBusinessFactory',
    useClass: BusinessFactory,
  },
];

/**
 * BusinessModule
 *
 * Configures the Business Bounded Context with:
 * - Command handlers for write operations
 * - Query handlers for read operations
 * - Repositories with DI tokens
 * - Factory for loading aggregates
 *
 * Requirements: All (Phase 8.1)
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([BusinessModel]),
    SharedModule,
    // TODO: Import AccountModule when implemented for BusinessOwner validation
    // AccountModule,
  ],
  controllers: [BusinessController],
  providers: [...commandHandlers, ...queryHandlers, ...repositories, ...factories],
  exports: [
    'IBusinessReadRepository', // Export for other BCs to query businesses
    'IBusinessFactory', // Export for other BCs to load businesses
  ],
})
export class BusinessModule {}
