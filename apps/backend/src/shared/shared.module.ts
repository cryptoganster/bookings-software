import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import { DomainExceptionFilter } from '@shared/infra/filters/domain-exception';
import { HealthController } from '@shared/infra/controllers/health.controller';

@Global()
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
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
