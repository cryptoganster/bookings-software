import { ValueObject } from '@shared/kernel/value-object';

export class Email extends ValueObject {
  private constructor(private readonly value: string) {
    super();
    this.validate(value);
  }

  private validate(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  static fromString(email: string): Email {
    return new Email(email.toLowerCase().trim());
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): unknown[] {
    return [this.value];
  }
}
