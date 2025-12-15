import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';
import { User } from '@auth/domain/aggregates/user';
import { UserModel } from '../models/user';
import { UserWriteMapper } from '../mappers/user-write';
import { UUID } from '@shared/vo/uuid';
import { IUnitOfWork } from '@shared/kernel/uow';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

@Injectable()
export class UserWriteRepository implements IUserWriteRepository {
  constructor(
    @InjectRepository(UserModel)
    private readonly repository: Repository<UserModel>,
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
        .values(model as any)
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

  async findById(id: UUID): Promise<User | null> {
    const model = await this.repository.findOne({
      where: { id: id.getValue() },
    });

    if (!model) return null;

    return UserWriteMapper.toDomain(model);
  }

  async findByEmail(email: string): Promise<User | null> {
    const model = await this.repository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!model) return null;

    return UserWriteMapper.toDomain(model);
  }
}
