import { Appointment } from '@booking/domain/aggregates/appointment';

/**
 * Write Repository for Appointment aggregate
 *
 * Responsibilities:
 * - Persist aggregates (save, delete)
 * - Uses optimistic locking with version field
 *
 * This is separate from:
 * - IAppointmentFactory: Loads aggregates for modification
 * - IAppointmentReadRepository: Returns read models (DTOs) for queries
 *
 * @see .kiro/steering/factory-pattern.md for complete documentation
 */
export interface IAppointmentWriteRepository {
  /**
   * Persists an appointment aggregate
   * Uses optimistic locking with version field
   */
  save(appointment: Appointment): Promise<void>;

  // ❌ NO incluir métodos de lectura como findById()
  // ✅ Usar IAppointmentFactory para cargar aggregates
}
