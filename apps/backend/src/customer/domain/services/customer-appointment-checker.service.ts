import { Inject, Injectable } from '@nestjs/common';
import { ICustomerAppointmentChecker } from '@customer/domain/interfaces/services/customer-appointment-checker.interface';
import { IAppointmentReadRepository } from '@booking/domain/interfaces/repositories/appointment-read';

/**
 * Domain Service: CustomerAppointmentChecker
 *
 * Validates customer appointment status in Customer BC.
 *
 * This service encapsulates cross-BC read operations for validation purposes,
 * allowing command handlers to maintain CQRS strict separation and avoid
 * direct cross-BC dependencies.
 *
 * Cross-BC Dependency:
 * - Depends on IAppointmentReadRepository from Booking BC (via interface only)
 * - This is acceptable as it's a domain service depending on domain interface
 * - Follows Dependency Inversion Principle (depend on abstractions)
 *
 * @implements {ICustomerAppointmentChecker}
 */
@Injectable()
export class CustomerAppointmentChecker implements ICustomerAppointmentChecker {
  constructor(
    @Inject('IAppointmentReadRepository')
    private readonly appointmentReadRepo: IAppointmentReadRepository,
  ) {}

  /**
   * Checks if customer has future appointments
   *
   * Future appointments are:
   * - Status: CONFIRMED (not CANCELLED or COMPLETED)
   * - DateTime: In the future (> now)
   *
   * @param customerId - Customer ID to check
   * @returns true if has future appointments, false otherwise
   */
  async hasFutureAppointments(customerId: string): Promise<boolean> {
    const appointments = await this.appointmentReadRepo.findByCustomerId(customerId);

    const now = new Date();

    // Filter for future CONFIRMED appointments
    const futureAppointments = appointments.filter(
      (appointment) => appointment.status === 'CONFIRMED' && new Date(appointment.dateTime) > now,
    );

    return futureAppointments.length > 0;
  }

  /**
   * Gets count of future appointments for customer
   *
   * @param customerId - Customer ID to check
   * @returns Number of future appointments
   */
  async getFutureAppointmentsCount(customerId: string): Promise<number> {
    const appointments = await this.appointmentReadRepo.findByCustomerId(customerId);

    const now = new Date();

    // Filter for future CONFIRMED appointments
    const futureAppointments = appointments.filter(
      (appointment) => appointment.status === 'CONFIRMED' && new Date(appointment.dateTime) > now,
    );

    return futureAppointments.length;
  }
}
