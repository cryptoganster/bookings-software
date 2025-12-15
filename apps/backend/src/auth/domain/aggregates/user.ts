import { VersionedAggregateRoot } from '@shared/kernel/versioned-aggregate-root';
import { UUID } from '@shared/vo/uuid';
import { Email } from '../vo/email';
import { Password } from '../vo/password';
import { UserRegistered } from '../events/user-registered';

export class User extends VersionedAggregateRoot {
  private constructor(
    private readonly id: UUID,
    private readonly email: Email,
    private readonly password: Password,
    private readonly name: string,
    private readonly businessId: UUID | null,
    private readonly createdAt: Date,
  ) {
    super();
  }

  static async create(
    id: UUID,
    email: Email,
    plainPassword: string,
    name: string,
    businessId: UUID | null = null,
  ): Promise<User> {
    const password = await Password.fromPlainText(plainPassword);
    const user = new User(id, email, password, name, businessId, new Date());

    // Publicar evento de dominio
    user.apply(new UserRegistered(id.getValue(), email.getValue(), name));
    user.incrementVersion();

    return user;
  }

  static fromPersistence(
    id: UUID,
    email: Email,
    hashedPassword: string,
    name: string,
    businessId: UUID | null,
    createdAt: Date,
    version: number,
  ): User {
    const password = Password.fromHash(hashedPassword);
    const user = new User(id, email, password, name, businessId, createdAt);
    user.setVersion(version);
    return user;
  }

  async validatePassword(plainPassword: string): Promise<boolean> {
    return this.password.compare(plainPassword);
  }

  getId(): UUID {
    return this.id;
  }

  getEmail(): Email {
    return this.email;
  }

  getPassword(): Password {
    return this.password;
  }

  getName(): string {
    return this.name;
  }

  getBusinessId(): UUID | null {
    return this.businessId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
