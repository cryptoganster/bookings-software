import { UserReadModel } from '@auth/domain/read-models/user';
import { UserModel } from '@auth/infra/persistence/models/user';
import { UserRole } from '@auth/domain/vo/user-role';

export class UserReadMapper {
  static toReadModel(model: UserModel): UserReadModel {
    return {
      id: model.id,
      email: model.email,
      name: model.name,
      roles: model.roles as UserRole[],
      isActive: model.isActive,
      emailVerified: model.emailVerified,
      createdAt: model.createdAt,
    };
  }
}
