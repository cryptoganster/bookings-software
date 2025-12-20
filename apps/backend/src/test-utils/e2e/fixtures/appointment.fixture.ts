/**
 * Appointment Fixture
 *
 * Provides utilities for creating test appointments in E2E tests
 */

import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UUID } from '@shared/vo/uuid';

export interface Appointment {
  id: string;
  business_id: string;
  customer_id: string;
  offering_id: string;
  date_time: Date;
  status: string;
}

export class AppointmentFixture {
  private createdAppointments: string[] = [];

  constructor(
    private readonly app: INestApplication,
    private readonly businessId: string,
  ) {}

  /**
   * Create a test appointment
   */
  async createAppointment(
    customerId: string,
    offeringId: string,
    dateTime?: Date,
  ): Promise<Appointment> {
    const dataSource = this.app.get(DataSource);
    const appointment: Appointment = {
      id: UUID.generate().getValue(),
      business_id: this.businessId,
      customer_id: customerId,
      offering_id: offeringId,
      date_time: dateTime || new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow by default
      status: 'CONFIRMED',
    };

    await dataSource.query(
      'INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        appointment.id,
        appointment.business_id,
        appointment.customer_id,
        appointment.offering_id,
        appointment.date_time,
        appointment.status,
      ],
    );

    this.createdAppointments.push(appointment.id);
    return appointment;
  }

  /**
   * Create multiple appointments
   */
  async createMultipleAppointments(
    customerId: string,
    offeringId: string,
    count: number,
  ): Promise<Appointment[]> {
    const appointments: Appointment[] = [];
    for (let i = 0; i < count; i++) {
      const dateTime = new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000); // Each day ahead
      const appointment = await this.createAppointment(customerId, offeringId, dateTime);
      appointments.push(appointment);
    }
    return appointments;
  }

  /**
   * Clean up all created appointments
   */
  async cleanup(): Promise<void> {
    const dataSource = this.app.get(DataSource);
    const errors: Error[] = [];

    for (const appointmentId of this.createdAppointments) {
      try {
        await dataSource.query('DELETE FROM appointments WHERE id = $1', [appointmentId]);
      } catch (error) {
        errors.push(error as Error);
        console.error(`Failed to cleanup appointment ${appointmentId}:`, error);
      }
    }

    this.createdAppointments = [];

    if (errors.length > 0) {
      console.warn(`Appointment cleanup completed with ${errors.length} errors`);
    }
  }

  /**
   * Get list of created appointment IDs
   */
  getCreatedAppointmentIds(): string[] {
    return [...this.createdAppointments];
  }
}
