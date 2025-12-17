import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';
import { User } from '@auth/domain/aggregates/user';
import { UserModel } from '../models/user';
import { UserWriteMapper } from '../mappers/user-write';
import { IUnitOfWork } from '@shared/kernel/uow';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

@Injectable()
export class UserWriteRepository implements IUserWriteRepository {
  constructor(
    @InjectRepository(UserModel)
    private readonly repository: Repository<UserModel>,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  async save(user: User): Promise<void> {
    await this.uow.transaction(async () => {
      const model = UserWriteMapper.toModel(user);
      const currentVersion = user.getVersion().getValue();
      const newVersion = currentVersion + 1;

      // Try to update with optimistic locking
      const result = await this.repository
        .createQueryBuilder()
        .update(UserModel)
        .set({
          ...model,
          version: newVersion,
        })
        .where('id = :id', { id: user.getId().getValue() })
        .andWhere('version = :version', { version: currentVersion })
        .execute();

      // If no rows affected, either doesn't exist or version mismatch
      if (result.affected === 0) {
        // Check if user exists
        const exists = await this.repository.findOne({
          where: { id: user.getId().getValue() },
        });

        if (!exists) {
          // User doesn't exist, insert it
          await this.repository.save(model);
        } else {
          // Version mismatch - concurrency conflict
          throw new ConcurrencyException(
            `User ${user.getId().getValue()} was modified by another transaction`,
          );
        }
      }
    });
  }

  // ❌ Read methods removed - use IUserFactory to load aggregates for modification
  // ✅ This repository now only handles WRITE operations (save)
}
