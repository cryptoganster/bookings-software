import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserFactory } from '@auth/domain/interfaces/factories/user-factory';
import { User } from '@auth/domain/aggregates/user';
import { UserModel } from '@auth/infra/persistence/models/user';
import { UserWriteMapper } from '@auth/infra/persistence/mappers/user-write';

/**
 * Factory implementation for loading User aggregates.
 *
 * This factory reconstructs User aggregates from persistence
 * with all business logic intact, including version for optimistic locking.
 *
 * Used by Command Handlers when they need to modify existing users.
 */
@Injectable()
export class UserFactory implements IUserFactory {
  constructor(
    @InjectRepository(UserModel)
    private readonly repository: Repository<UserModel>,
  ) {}

  async loadById(id: string): Promise<User | null> {
    const model = await this.repository.findOne({
      where: { id },
    });

    if (!model) {
      return null;
    }

    // Reconstruct aggregate with business logic using fromPersistence
    return UserWriteMapper.toDomain(model);
  }

  async loadByEmail(email: string): Promise<User | null> {
    const model = await this.repository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!model) {
      return null;
    }

    // Reconstruct aggregate with business logic using fromPersistence
    return UserWriteMapper.toDomain(model);
  }
}
