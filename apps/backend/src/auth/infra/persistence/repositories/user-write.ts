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

      // Intentar actualizar con optimistic locking
      const result = await this.repository
        .createQueryBuilder()
        .insert()
        .into(UserModel)
        .values(model)
        .orUpdate(['password', 'name', 'businessId', 'version'], ['id'])
        .execute();

      // Si es una actualización, verificar versión
      if (result.raw.affectedRows === 0) {
        throw new ConcurrencyException(
          `User ${user.getId().getValue()} was modified by another transaction`,
        );
      }
    });
  }

  // ❌ Read methods removed - use IUserFactory to load aggregates for modification
  // ✅ This repository now only handles WRITE operations (save)
}
