import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmUnitOfWork } from './infra/uow';
import { DomainExceptionFilter } from './infra/filters/domain-exception';

@Global()
@Module({
  providers: [
    {
      provide: 'IUnitOfWork',
      useClass: TypeOrmUnitOfWork,
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
  exports: ['IUnitOfWork'],
})
export class SharedModule {}
