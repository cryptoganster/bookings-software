import { Appointment } from '@booking/domain/aggregates/appointment';

/**
 * Factory interface for loading Appointment aggregates from persistence
 *
 * Responsibilities:
 * - Load domain aggregates (with business logic) from database
 * - Reconstruct aggregate state for modification
 *
 * This is separate from:
 * - IAppointmentReadRepository: Returns read models (DTOs) for queries
 * - IAppointmentWriteRepository: Only persists aggregates
 *
 * @see .kiro/steering/factory-pattern.md for complete documentation
 */
export interface IAppointmentFactory {
  /**
   * Loads an Appointment aggregate by ID for modification
   *
   * @param id - Appointment UUID
   * @returns Domain aggregate with business logic (not a read model)
   * @usage Used in command handlers to load aggregates before modification
   * @example
   * const appointment = await factory.loadById(appointmentId);
   * appointment.cancel(); // Business logic
   * await writeRepo.save(appointment); // Persist
   */
  loadById(id: string): Promise<Appointment | null>;
}
