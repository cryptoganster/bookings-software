import { ValueObject } from '@shared/kernel/value-object';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class UUID extends ValueObject {
  private constructor(private readonly value: string) {
    super();
    if (!uuidValidate(value)) {
      throw new Error(`Invalid UUID: ${value}`);
    }
  }

  static generate(): UUID {
    return new UUID(uuidv4());
  }

  static fromString(value: string): UUID {
    return new UUID(value);
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }

  toString(): string {
    return this.value;
  }
}
