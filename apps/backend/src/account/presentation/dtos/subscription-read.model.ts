/**
 * Subscription Read Model DTO
 * Datos de suscripción para el cliente
 */
export class SubscriptionReadModel {
  plan!: string;
  status!: string;
  maxBusinesses!: number;
  currentBusinessCount!: number;
  maxAppointmentsPerMonth!: number;
  price!: number;
}
