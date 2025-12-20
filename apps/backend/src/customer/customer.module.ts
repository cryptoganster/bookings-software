import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// External Modules
import { BookingModule } from '@booking/booking.module';

// Models
import { CustomerModel } from '@customer/infra/persistence/models';

// Factories
import { CustomerFactory } from '@customer/infra/persistence/factories';

// Repositories
import {
  CustomerWriteRepository,
  CustomerReadRepository,
} from '@customer/infra/persistence/repositories';

// Command Handlers
import { IdentifyCustomerHandler } from '@customer/app/commands/identify-customer/handler';
import { UpdateCustomerNameHandler } from '@customer/app/commands/update-customer-name/handler';
import { LinkCustomerToUserHandler } from '@customer/app/commands/link-customer-to-user/handler';
import { UnlinkCustomerFromUserHandler } from '@customer/app/commands/unlink-customer-from-user/handler';
import { MergeCustomersHandler } from '@customer/app/commands/merge-customers/handler';
import { DeleteCustomerHandler } from '@customer/app/commands/delete-customer/handler';

// Query Handlers
import { GetCustomerHandler } from '@customer/app/queries/get-customer/handler';
import { GetCustomerByPhoneHandler } from '@customer/app/queries/get-customer-by-phone/handler';
import { GetCustomersByUserIdHandler } from '@customer/app/queries/get-customers-by-user-id/handler';
import { SearchCustomersHandler } from '@customer/app/queries/search-customers/handler';
import { GetCustomerStatsHandler } from '@customer/app/queries/get-customer-stats/handler';
import { DetectDuplicateCustomersHandler } from '@customer/app/queries/detect-duplicate-customers/handler';
import { ExportCustomerDataHandler } from '@customer/app/queries/export-customer-data/handler';

// Domain Services
import { CustomerDeduplicationService } from '@customer/domain/services/customer-deduplication.service';

// Controllers
import { CustomerController } from '@customer/presentation/controllers/customer.controller';

const commandHandlers = [
  IdentifyCustomerHandler,
  UpdateCustomerNameHandler,
  LinkCustomerToUserHandler,
  UnlinkCustomerFromUserHandler,
  MergeCustomersHandler,
  DeleteCustomerHandler,
];

const queryHandlers = [
  GetCustomerHandler,
  GetCustomerByPhoneHandler,
  GetCustomersByUserIdHandler,
  SearchCustomersHandler,
  GetCustomerStatsHandler,
  DetectDuplicateCustomersHandler,
  ExportCustomerDataHandler,
];

const domainServices = [CustomerDeduplicationService];

const factories = [
  {
    provide: 'ICustomerFactory',
    useClass: CustomerFactory,
  },
];

const repositories = [
  {
    provide: 'ICustomerWriteRepository',
    useClass: CustomerWriteRepository,
  },
  {
    provide: 'ICustomerReadRepository',
    useClass: CustomerReadRepository,
  },
];

/**
 * CustomerModule
 *
 * Customer Bounded Context Module
 * Manages customer profiles (anonymous and registered)
 *
 * Exports:
 * - ICustomerFactory - For loading Customer aggregates
 * - ICustomerWriteRepository - For persisting Customer aggregates
 * - ICustomerReadRepository - For querying Customer data
 *
 * @see .kiro/steering/user-customer-businessowner-architecture.md
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([CustomerModel]),
    forwardRef(() => BookingModule), // ← Use forwardRef to avoid circular dependency
  ],
  controllers: [CustomerController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    ...domainServices,
    ...factories,
    ...repositories,
  ],
  exports: ['ICustomerFactory', 'ICustomerWriteRepository', 'ICustomerReadRepository'],
})
export class CustomerModule {}
