/**
 * Business Read Model
 *
 * Optimized for queries and display.
 * Contains denormalized data for efficient reads.
 *
 * Requirements: 9.3, 10.4, 10.5
 */
export class BusinessReadModel {
  id!: string;
  ownerId!: string;
  name!: string;
  whatsappPhone!: string;
  address!: {
    street: string;
    city: string;
    state: string | null;
    country: string;
    postalCode: string | null;
  };
  timezone!: string;
  isActive!: boolean;
  createdAt!: Date;
  version!: number;
}
