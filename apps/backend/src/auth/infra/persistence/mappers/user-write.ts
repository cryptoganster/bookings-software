import { User } from '@auth/domain/aggregates/user';
import { UserModel } from '@auth/infra/persistence/models/user';
import { UUID } from '@shared/vo/uuid';
import { Email } from '@auth/domain/vo/email';
import { UserRole } from '@auth/domain/vo/user-role';

export class UserWriteMapper {
  static toModel(user: User): Partial<UserModel> {
    return {
      id: user.getId().getValue(),
      email: user.getEmail().getValue(),
      password: user.getPassword().getValue(),
      name: user.getName(),
      roles: user.getRoles(),
      isActive: user.getIsActive(),
      emailVerified: user.getEmailVerified(),
      createdAt: user.getCreatedAt(),
      version: user.getVersion().getValue(),
    };
  }

  static toDomain(model: UserModel): User {
    return User.fromPersistence(
      UUID.fromString(model.id),
      Email.fromString(model.email),
      model.password,
      model.name,
      model.roles as UserRole[],
      model.isActive,
      model.emailVerified,
      model.createdAt,
      model.version,
    );
  }
}
