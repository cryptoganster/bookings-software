import { UserReadModel } from '@auth/domain/read-models/user';
import { UserModel } from '../models/user';

export class UserReadMapper {
  static toReadModel(model: UserModel): UserReadModel {
    return {
      id: model.id,
      email: model.email,
      name: model.name,
      businessId: model.businessId,
      createdAt: model.createdAt,
    };
  }
}
