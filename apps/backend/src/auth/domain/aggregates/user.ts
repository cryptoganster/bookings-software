import { VersionedAggregateRoot } from '@shared/kernel/versioned-aggregate-root';
import { UUID } from '@shared/vo/uuid';
import { Email } from '../vo/email';
import { Password } from '../vo/password';
import { UserRole } from '../vo/user-role';
import { UserRegistered } from '../events/user-registered';
import { UserRoleAdded } from '../events/user-role-added';
import { UserRoleRemoved } from '../events/user-role-removed';
import { UserEmailVerified } from '../events/user-email-verified';
import { UserActivated } from '../events/user-activated';
import { UserDeactivated } from '../events/user-deactivated';
import { UserAlreadyHasRoleException } from '../exceptions/user-already-has-role';
import { UserDoesNotHaveRoleException } from '../exceptions/user-does-not-have-role';
import { CannotRemoveLastRoleException } from '../exceptions/cannot-remove-last-role';
import { EmailAlreadyVerifiedException } from '../exceptions/email-already-verified';
import { UserAlreadyActiveException } from '../exceptions/user-already-active';
import { UserAlreadyInactiveException } from '../exceptions/user-already-inactive';

/**
 * User Aggregate - Identidad Universal del Sistema
 *
 * Representa la identidad de autenticación con roles múltiples.
 * Un User puede tener múltiples roles simultáneamente (marketplace).
 *
 * @requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */
export class User extends VersionedAggregateRoot {
  private constructor(
    private readonly id: UUID,
    private readonly email: Email,
    private password: Password,
    private name: string,
    private roles: UserRole[],
    private isActive: boolean,
    private emailVerified: boolean,
    private readonly createdAt: Date,
  ) {
    super();
  }

  /**
   * Factory method para crear un nuevo usuario
   * @requirements 1.2, 9.1, 9.2, 9.3
   * @property 7
   */
  static async register(
    id: UUID,
    email: Email,
    plainPassword: string,
    name: string,
    initialRole: UserRole,
  ): Promise<User> {
    const password = await Password.fromPlainText(plainPassword);
    const user = new User(
      id,
      email,
      password,
      name,
      [initialRole],
      true, // isActive por defecto
      false, // emailVerified por defecto
      new Date(),
    );

    user.apply(new UserRegistered(id.getValue(), email.getValue(), name, initialRole));
    user.incrementVersion();

    return user;
  }

  /**
   * Reconstruye un User desde persistencia
   * @requirements 8.1, 8.2
   */
  static fromPersistence(
    id: UUID,
    email: Email,
    hashedPassword: string,
    name: string,
    roles: UserRole[],
    isActive: boolean,
    emailVerified: boolean,
    createdAt: Date,
    version: number,
  ): User {
    const password = Password.fromHash(hashedPassword);
    const user = new User(id, email, password, name, roles, isActive, emailVerified, createdAt);
    user.setVersion(version);
    return user;
  }

  /**
   * Agrega un rol al usuario
   * @requirements 2.1, 2.2, 5.1, 5.4
   * @property 2
   */
  addRole(role: UserRole): void {
    if (this.hasRole(role)) {
      throw new UserAlreadyHasRoleException(this.id.getValue(), role);
    }

    this.roles.push(role);
    this.incrementVersion();
    this.apply(new UserRoleAdded(this.id.getValue(), role));
  }

  /**
   * Remueve un rol del usuario
   * @requirements 2.3, 2.4, 5.2, 5.5
   * @property 1, 3
   */
  removeRole(role: UserRole): void {
    if (!this.hasRole(role)) {
      throw new UserDoesNotHaveRoleException(this.id.getValue(), role);
    }

    if (this.roles.length === 1) {
      throw new CannotRemoveLastRoleException(this.id.getValue());
    }

    this.roles = this.roles.filter((r) => r !== role);
    this.incrementVersion();
    this.apply(new UserRoleRemoved(this.id.getValue(), role));
  }

  /**
   * Verifica si el usuario tiene un rol específico
   * @requirements 1.4, 5.3
   */
  hasRole(role: UserRole): boolean {
    return this.roles.includes(role);
  }

  /**
   * Verifica el email del usuario
   * @requirements 6.2, 6.4, 6.5
   * @property 4
   */
  verifyEmail(): void {
    if (this.emailVerified) {
      throw new EmailAlreadyVerifiedException(this.id.getValue());
    }

    this.emailVerified = true;
    this.incrementVersion();
    this.apply(new UserEmailVerified(this.id.getValue()));
  }

  /**
   * Activa el usuario
   * @requirements 7.4
   */
  activate(): void {
    if (this.isActive) {
      throw new UserAlreadyActiveException(this.id.getValue());
    }

    this.isActive = true;
    this.incrementVersion();
    this.apply(new UserActivated(this.id.getValue()));
  }

  /**
   * Desactiva el usuario
   * @requirements 7.3, 7.5
   */
  deactivate(): void {
    if (!this.isActive) {
      throw new UserAlreadyInactiveException(this.id.getValue());
    }

    this.isActive = false;
    this.incrementVersion();
    this.apply(new UserDeactivated(this.id.getValue()));
  }

  /**
   * Valida la contraseña del usuario
   */
  async validatePassword(plainPassword: string): Promise<boolean> {
    return this.password.compare(plainPassword);
  }

  // Getters

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

  /**
   * Retorna una copia del array de roles (inmutabilidad)
   * @requirements 1.3
   */
  getRoles(): UserRole[] {
    return [...this.roles];
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getEmailVerified(): boolean {
    return this.emailVerified;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
