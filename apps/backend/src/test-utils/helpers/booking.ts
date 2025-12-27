import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppointmentModel } from '@booking/infra/persistence/models/appointment';
import { CreateAppointmentDto } from '@test-utils/helpers/types';

/**
 * TestBookingHelper - Helper for Booking BC in E2E tests
 *
 * Provides methods to create and manage appointments for testing purposes.
 * Automatically tracks created entities for cleanup.
 *
 * @example
 * ```typescript
 * const bookingHelper = new TestBookingHelper(dataSource);
 * const appointment = await bookingHelper.createAppointment({
 *   businessId: business.id,
 *   customerId: customer.id,
 *   offeringId: offering.id,
 * });
 * await bookingHelper.cleanup(); // Removes all created appointments
 * ```
 */
export class TestBookingHelper {
  private createdAppointments: string[] = [];

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Creates an appointment for testing
   *
   * @param dto - Appointment creation data
   * @returns Created appointment model
   *
   * @example
   * ```typescript
   * const appointment = await bookingHelper.createAppointment({
   *   businessId: business.id,
   *   customerId: customer.id,
   *   offeringId: offering.id,
   *   dateTime: new Date('2025-12-27T10:00:00Z'),
   *   status: 'CONFIRMED',
   * });
   * ```
   */
  async createAppointment(dto: CreateAppointmentDto): Promise<AppointmentModel> {
    const repo = this.dataSource.getRepository(AppointmentModel);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const appointment = repo.create({
      id: dto.id || uuidv4(),
      businessId: dto.businessId,
      customerId: dto.customerId,
      offeringId: dto.offeringId,
      dateTime: dto.dateTime || tomorrow,
      status: dto.status || 'CONFIRMED',
      version: dto.version || 0,
      cancelledAt: dto.cancelledAt || null,
    });

    const saved = await repo.save(appointment);
    this.createdAppointments.push(saved.id);

    return saved;
  }

  /**
   * Cancels an appointment (updates status and cancelledAt)
   *
   * @param appointmentId - ID of appointment to cancel
   * @returns Updated appointment model
   *
   * @example
   * ```typescript
   * const cancelled = await bookingHelper.cancelAppointment(appointment.id);
   * expect(cancelled.status).toBe('CANCELLED');
   * ```
   */
  async cancelAppointment(appointmentId: string): Promise<AppointmentModel> {
    const repo = this.dataSource.getRepository(AppointmentModel);

    const appointment = await repo.findOne({ where: { id: appointmentId } });
    if (!appointment) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    appointment.status = 'CANCELLED';
    appointment.cancelledAt = new Date();
    appointment.version += 1;

    return repo.save(appointment);
  }

  /**
   * Modifies an appointment (updates dateTime and version)
   *
   * @param appointmentId - ID of appointment to modify
   * @param newDateTime - New date and time for the appointment
   * @returns Updated appointment model
   *
   * @example
   * ```typescript
   * const newDate = new Date('2025-12-28T14:00:00Z');
   * const modified = await bookingHelper.modifyAppointment(appointment.id, newDate);
   * expect(modified.dateTime).toEqual(newDate);
   * ```
   */
  async modifyAppointment(appointmentId: string, newDateTime: Date): Promise<AppointmentModel> {
    const repo = this.dataSource.getRepository(AppointmentModel);

    const appointment = await repo.findOne({ where: { id: appointmentId } });
    if (!appointment) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    appointment.dateTime = newDateTime;
    appointment.version += 1;

    return repo.save(appointment);
  }

  /**
   * Cleans up all appointments created by this helper
   *
   * @example
   * ```typescript
   * afterEach(async () => {
   *   await bookingHelper.cleanup();
   * });
   * ```
   */
  async cleanup(): Promise<void> {
    if (this.createdAppointments.length === 0) {
      return;
    }

    try {
      const repo = this.dataSource.getRepository(AppointmentModel);
      await repo.delete(this.createdAppointments);
      this.createdAppointments = [];
    } catch (error) {
      console.error('Failed to cleanup appointments:', error);
      // Don't throw - cleanup should be best-effort
    }
  }
}

/**
 * Creates an appointment directly in the database (for integration tests)
 *
 * This is a standalone function that doesn't track entities for cleanup.
 * Use TestBookingHelper for E2E tests that need automatic cleanup.
 *
 * @param dataSource - TypeORM DataSource
 * @param dto - Appointment creation data
 * @returns Created appointment model
 *
 * @example
 * ```typescript
 * const appointment = await createAppointmentInDb(dataSource, {
 *   businessId: 'business-uuid',
 *   customerId: 'customer-uuid',
 *   offeringId: 'offering-uuid',
 * });
 * ```
 */
export async function createAppointmentInDb(
  dataSource: DataSource,
  dto: CreateAppointmentDto,
): Promise<AppointmentModel> {
  const repo = dataSource.getRepository(AppointmentModel);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const appointment = repo.create({
    id: dto.id || uuidv4(),
    businessId: dto.businessId,
    customerId: dto.customerId,
    offeringId: dto.offeringId,
    dateTime: dto.dateTime || tomorrow,
    status: dto.status || 'CONFIRMED',
    version: dto.version || 0,
    cancelledAt: dto.cancelledAt || null,
  });

  return repo.save(appointment);
}
