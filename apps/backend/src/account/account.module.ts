import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Models
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';

// Command Handlers
import { CreateBusinessOwnerHandler } from '@account/app/commands/create-business-owner/handler';
import { CompleteOnboardingHandler } from '@account/app/commands/complete-onboarding/handler';
import { UpgradeSubscriptionHandler } from '@account/app/commands/upgrade-subscription/handler';
import { SuspendSubscriptionHandler } from '@account/app/commands/suspend-subscription/handler';
import { RestoreSubscriptionHandler } from '@account/app/commands/restore-subscription/handler';

// Query Handlers
import { GetBusinessOwnerHandler } from '@account/app/queries/get-business-owner/handler';
import { GetBusinessOwnerByUserIdHandler } from '@account/app/queries/get-business-owner-by-user-id/handler';

// Event Handlers
import { OnUserRegisteredHandler } from '@account/app/event-handlers/on-user-registered.handler';

// Repositories
import { BusinessOwnerWriteRepository } from '@account/infra/persistence/repositories/business-owner-write.repository';
import { BusinessOwnerReadRepository } from '@account/infra/persistence/repositories/business-owner-read.repository';

// Factory
import { BusinessOwnerFactory } from '@account/infra/persistence/factories/business-owner.factory';

const commandHandlers = [
  CreateBusinessOwnerHandler,
  CompleteOnboardingHandler,
  UpgradeSubscriptionHandler,
  SuspendSubscriptionHandler,
  RestoreSubscriptionHandler,
];

const queryHandlers = [GetBusinessOwnerHandler, GetBusinessOwnerByUserIdHandler];

const eventHandlers = [OnUserRegisteredHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([BusinessOwnerModel])],
  providers: [
    // Command Handlers
    ...commandHandlers,

    // Query Handlers
    ...queryHandlers,

    // Event Handlers
    ...eventHandlers,

    // Repositories
    {
      provide: 'IBusinessOwnerWriteRepository',
      useClass: BusinessOwnerWriteRepository,
    },
    {
      provide: 'IBusinessOwnerReadRepository',
      useClass: BusinessOwnerReadRepository,
    },

    // Factory
    {
      provide: 'IBusinessOwnerFactory',
      useClass: BusinessOwnerFactory,
    },
  ],
  exports: [
    'IBusinessOwnerWriteRepository',
    'IBusinessOwnerReadRepository',
    'IBusinessOwnerFactory',
  ],
})
export class AccountModule {}
