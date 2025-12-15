import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserReadRepository } from '@auth/domain/interfaces/repositories/user-read';
import { UserReadModel } from '@auth/domain/read-models/user';
import { UserModel } from '../models/user';
import { UserReadMapper } from '../mappers/user-read';

@Injectable()
export class UserReadRepository implements IUserReadRepository {
  constructor(
    @InjectRepository(UserModel)
    private readonly repository: Repository<UserModel>,
  ) {}

  async findById(id: string): Promise<UserReadModel | null> {
    const model = await this.repository.findOne({
      where: { id },
    });

    if (!model) return null;

    return UserReadMapper.toReadModel(model);
  }

  async findByEmail(email: string): Promise<UserReadModel | null> {
    const model = await this.repository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!model) return null;

    return UserReadMapper.toReadModel(model);
  }
}
