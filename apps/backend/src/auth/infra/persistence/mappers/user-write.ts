import { User } from '@auth/domain/aggregates/user';
import { UserModel } from '../models/user';
import { UUID } from '@shared/vo/uuid';
import { Email } from '@auth/domain/vo/email';

export class UserWriteMapper {
  static toModel(user: User): Partial<UserModel> {
    return {
      id: user.getId().getValue(),
      email: user.getEmail().getValue(),
      password: user.getPassword().getValue(),
      name: user.getName(),
      businessId: user.getBusinessId()?.getValue() || null,
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
      model.businessId ? UUID.fromString(model.businessId) : null,
      model.createdAt,
      model.version,
    );
  }
}
