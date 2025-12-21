import { ValueObject } from '@shared/kernel/value-object';
import { InvalidBusinessAddressException } from '@business/domain/exceptions/invalid-business-address';

/**
 * BusinessAddress Value Object
 *
 * Represents a complete business address with validation
 *
 * Required fields:
 * - street: Street address (cannot be empty)
 * - city: City name (cannot be empty)
 *
 * Optional fields:
 * - state: State/province
 * - country: Country name
 * - postalCode: Postal/ZIP code
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
    this.validate();
  }

  /**
   * Validates the address fields
   * @throws InvalidBusinessAddressException if validation fails
   */
  private validate(): void {
    if (!this.street || this.street.trim().length === 0) {
      throw new InvalidBusinessAddressException('Street address cannot be empty');
    }

    if (!this.city || this.city.trim().length === 0) {
      throw new InvalidBusinessAddressException('City cannot be empty');
    }
  }

  /**
   * Factory method to create BusinessAddress
   * @param street Street address (required)
   * @param city City name (required)
   * @param state State/province (optional)
   * @param country Country name (optional)
   * @param postalCode Postal/ZIP code (optional)
   * @returns BusinessAddress instance
   * @throws InvalidBusinessAddressException if validation fails
   */
  static create(
    street: string,
    city: string,
    state?: string | null,
    country?: string | null,
    postalCode?: string | null,
  ): BusinessAddress {
    return new BusinessAddress(street, city, state ?? null, country ?? null, postalCode ?? null);
  }

  /**
   * Returns the address as a plain object
   * @returns Object with all address fields
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

  /**
   * Gets the street address
   */
  getStreet(): string {
    return this.street;
  }

  /**
   * Gets the city
   */
  getCity(): string {
    return this.city;
  }

  /**
   * Gets the state (optional)
   */
  getState(): string | null {
    return this.state;
  }

  /**
   * Gets the country (optional)
   */
  getCountry(): string | null {
    return this.country;
  }

  /**
   * Gets the postal code (optional)
   */
  getPostalCode(): string | null {
    return this.postalCode;
  }

  /**
   * Returns components for equality comparison
   */
  protected getEqualityComponents(): unknown[] {
    return [this.street, this.city, this.state, this.country, this.postalCode];
  }
}
