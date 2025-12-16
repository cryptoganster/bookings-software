import { User } from '../../aggregates/user';
import { UUID } from '@shared/vo/uuid';

export interface IUserWriteRepository {
  save(user: User): Promise<void>;
  findById(id: UUID): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}
