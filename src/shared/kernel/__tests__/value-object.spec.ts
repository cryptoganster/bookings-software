import { ValueObject } from '../value-object';

// Implementación concreta para testing
class TestValueObject extends ValueObject {
  constructor(private readonly value: string) {
    super();
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }

  getValue(): string {
    return this.value;
  }
}

class AnotherValueObject extends ValueObject {
  constructor(private readonly value: string) {
    super();
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}

describe('ValueObject', () => {
  describe('equals', () => {
    it('should return true for value objects with same values', () => {
      const vo1 = new TestValueObject('test');
      const vo2 = new TestValueObject('test');

      expect(vo1.equals(vo2)).toBe(true);
    });

    it('should return false for value objects with different values', () => {
      const vo1 = new TestValueObject('test1');
      const vo2 = new TestValueObject('test2');

      expect(vo1.equals(vo2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      const vo = new TestValueObject('test');

      expect(vo.equals(null as any)).toBe(false);
    });

    it('should return false when comparing different types', () => {
      const vo1 = new TestValueObject('test');
      const vo2 = new AnotherValueObject('test');

      expect(vo1.equals(vo2)).toBe(false);
    });

    it('should return false when equality components have different lengths', () => {
      class MultiComponentVO extends ValueObject {
        constructor(
          private readonly value1: string,
          private readonly value2: string,
        ) {
          super();
        }

        protected getEqualityComponents(): any[] {
          return [this.value1, this.value2];
        }
      }

      const vo1 = new TestValueObject('test');
      const vo2 = new MultiComponentVO('test', 'test2');

      expect(vo1.equals(vo2 as any)).toBe(false);
    });
  });
});
