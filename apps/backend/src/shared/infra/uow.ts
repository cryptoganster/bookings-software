import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { IUnitOfWork, TransactionOptions } from '@shared/kernel/uow';

@Injectable()
export class TypeOrmUnitOfWork implements IUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  async transaction<T>(work: () => Promise<T>, options?: TransactionOptions): Promise<T> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    // Iniciar transacción con isolation level si se especifica
    await queryRunner.startTransaction(options?.isolationLevel);

    try {
      const result = await work();
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  getQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }
}
