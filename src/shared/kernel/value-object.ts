export abstract class ValueObject {
  protected abstract getEqualityComponents(): unknown[];

  equals(other: ValueObject): boolean {
    if (!other) return false;
    if (this.constructor !== other.constructor) return false;

    const components = this.getEqualityComponents();
    const otherComponents = other.getEqualityComponents();

    if (components.length !== otherComponents.length) return false;

    return components.every((component, index) => component === otherComponents[index]);
  }
}
