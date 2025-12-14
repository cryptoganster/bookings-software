import { ValueObject } from '@shared/kernel/value-object';

export class AggregateVersion extends ValueObject {
  constructor(private readonly value: number) {
    super();
    if (value < 0) {
      throw new Error('Version cannot be negative');
    }
  }

  increment(): AggregateVersion {
    return new AggregateVersion(this.value + 1);
  }

  getValue(): number {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
