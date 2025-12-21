/**
 * BusinessOwner Read Model
 * DTO optimizado para queries (CQRS Read side)
 */
export class BusinessOwnerReadModel {
  id!: string;
  userId!: string;
  subscriptionPlan!: string;
  subscriptionStatus!: string;
  maxBusinesses!: number;
  maxAppointmentsPerMonth!: number;
  price!: number;
  onboardingCompleted!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
