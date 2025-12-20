import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteCustomerCommand } from '@customer/app/commands/delete-customer/command';
import { ICustomerFactory } from '@customer/domain/interfaces/factories/customer-factory';
import { ICustomerWriteRepository } from '@customer/domain/interfaces/repositories/customer-write';
import { IAppointmentReadRepository } from '@booking/domain/interfaces/repositories/appointment-read';
import { IUnitOfWork } from '@shared/kernel/uow';
import {
  CustomerNotFoundException,
  CustomerHasFutureAppointmentsException,
} from '@customer/domain/exceptions';

/**
 * Handler for DeleteCustomerCommand
 *
 * Deletes a customer by anonymizing their data (GDPR compliance).
 * Preserves referential integrity while removing personal information.
 *
 * Business Rules:
 * - Customer must not have future appointments
 * - Data is anonymized: name → null, whatsappPhone → "DELETED_[timestamp]"
 * - Customer is unlinked from User if linked
 * - Operation is idempotent (can be called multiple times)
 *
 * Validates: Requirements 6.1-6.6
 * Property 4: Deletion is idempotent
 * Edge Cases: 3 (no future appointments), 10 (already deleted)
 */
@CommandHandler(DeleteCustomerCommand)
export class DeleteCustomerHandler implements ICommandHandler<DeleteCustomerCommand> {
  constructor(
    @Inject('ICustomerFactory')
    private readonly customerFactory: ICustomerFactory,
    @Inject('ICustomerWriteRepository')
    private readonly customerWriteRepository: ICustomerWriteRepository,
    @Inject('IAppointmentReadRepository')
    private readonly appointmentReadRepository: IAppointmentReadRepository,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: DeleteCustomerCommand): Promise<void> {
    await this.uow.transaction(async () => {
      // 1. Load customer using Factory
      const customer = await this.customerFactory.loadById(command.customerId);

      if (!customer) {
        throw new CustomerNotFoundException(command.customerId);
      }

      // 2. Verify no future appointments exist
      const appointments = await this.appointmentReadRepository.findByCustomerId(
        command.customerId,
      );

      const now = new Date();
      const futureAppointments = appointments.filter(
        (apt) => apt.status === 'CONFIRMED' && new Date(apt.dateTime) > now,
      );

      if (futureAppointments.length > 0) {
        throw new CustomerHasFutureAppointmentsException(
          command.customerId,
          futureAppointments.length,
        );
      }

      // 3. Anonymize customer data (includes unlinking from User)
      // This will throw CustomerAlreadyDeletedException if already deleted (idempotency)
      customer.anonymize(command.deletedBy);

      // 4. Persist changes
      await this.customerWriteRepository.save(customer);

      // 5. Event CustomerDeleted is published automatically via apply()
    });
  }
}
