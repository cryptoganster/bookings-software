import { ValueObject } from '@shared/kernel/value-object';
import * as bcrypt from 'bcrypt';

export class Password extends ValueObject {
  private constructor(private readonly hashedValue: string) {
    super();
  }

  static async fromPlainText(plainPassword: string): Promise<Password> {
    this.validatePlainPassword(plainPassword);
    const saltRounds = 10;
    const hashed = await bcrypt.hash(plainPassword, saltRounds);
    return new Password(hashed);
  }

  static fromHash(hashedPassword: string): Password {
    return new Password(hashedPassword);
  }

  private static validatePlainPassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
  }

  async compare(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.hashedValue);
  }

  getValue(): string {
    return this.hashedValue;
  }

  protected getEqualityComponents(): unknown[] {
    return [this.hashedValue];
  }
}
