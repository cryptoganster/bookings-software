export class OfferingReadModel {
  id!: string;
  businessId!: string;
  name!: string;
  duration!: number; // in minutes
  maxCapacityPerSlot!: number;
  maxDailyCapacity!: number | null;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
