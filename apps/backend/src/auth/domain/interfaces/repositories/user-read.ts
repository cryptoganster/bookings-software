import { UserReadModel } from '../../read-models/user';

export interface IUserReadRepository {
  findById(id: string): Promise<UserReadModel | null>;
  findByEmail(email: string): Promise<UserReadModel | null>;
}
