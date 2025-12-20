import { ValueObject } from '@shared/kernel/value-object';
import { InvalidBusinessAddressException } from '../exceptions/invalid-business-address';

/**
 * BusinessAddress Value Object
 * Represents a complete business address
 * Required: street, city
 * Optional: state, country, postalCode
 */
export class BusinessAddress extends ValueObject {
  private constructor(
    private readonly street: string,
    private readonly city: string,
    private readonly state: string | null,
    private readonly country: string | null,
    private readonly postalCode: string | null,
  ) {
    super();
  }

  /**
   * Creates a BusinessAddress
   * Validates required fields (street, city)
   */
  static create(
    street: string,
    city: string,
    state?: string,
    country?: string,
    postalCode?: string,
  ): BusinessAddress {
    if (!street || street.trim().length === 0) {
      throw new InvalidBusinessAddressException('Street is required');
    }

    if (!city || city.trim().length === 0) {
      throw new InvalidBusinessAddressException('City is required');
    }

    return new BusinessAddress(
      street.trim(),
      city.trim(),
      state?.trim() || null,
      country?.trim() || null,
      postalCode?.trim() || null,
    );
  }

  /**
   * Returns address as plain object
   */
  toObject(): {
    street: string;
    city: string;
    state: string | null;
    country: string | null;
    postalCode: string | null;
  } {
    return {
      street: this.street,
      city: this.city,
      state: this.state,
      country: this.country,
      postalCode: this.postalCode,
    };
  }

  protected getEqualityComponents(): any[] {
    return [this.street, this.city, this.state, this.country, this.postalCode];
  }
}
