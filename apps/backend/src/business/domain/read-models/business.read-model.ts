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
  addressStreet!: string;
  addressCity!: string;
  addressState!: string | null;
  addressCountry!: string;
  addressPostalCode!: string | null;
  timezone!: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  version!: number;
}
