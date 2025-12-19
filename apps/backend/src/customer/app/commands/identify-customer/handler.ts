import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IdentifyCustomerCommand } from './command';
import { ICustomerFactory } from '../../../domain/interfaces/factories';
import { ICustomerWriteRepository } from '../../../domain/interfaces/repositories';
import { Customer } from '../../../domain/aggregates/customer';
import { WhatsAppPhone } from '../../../domain/vo/whatsapp-phone';
import { UUID } from '@shared/vo/uuid';

/**
 * IdentifyCustomerHandler
 * 
 * Identifies or creates a customer based on WhatsApp phone
 * 
 * Flow:
 * 1. Try to load existing customer by (businessId, whatsappPhone)
 * 2. If exists:
 *    - Update name if changed
 *    - Return existing customerId
 * 3. If doesn't exist:
 *    - Create new anonymous customer (userId = null)
 *    - Return new customerId
 * 
 * Idempotent: calling multiple times returns same customerId
 * 
 * @see Property 2: Idempotency
 */
@CommandHandler(IdentifyCustomerCommand)
export class IdentifyCustomerHandler
  implements ICommandHandler<IdentifyCustomerCommand>
{
  constructor(
    @Inject('ICustomerFactory')
    private readonly factory: ICustomerFactory,
    @Inject('ICustomerWriteRepository')
    private readonly writeRepo: ICustomerWriteRepository,
  ) {}

  async execute(
    command: IdentifyCustomerCommand,
  ): Promise<{ customerId: string }> {
    const whatsappPhone = WhatsAppPhone.fromString(command.whatsappPhone);

    // Try to load existing customer
    const existingCustomer = await this.factory.loadByWhatsAppPhone(
      command.businessId,
      whatsappPhone.getValue(),
    );

    if (existingCustomer) {
      // Customer exists - update name if changed
      if (
        command.name &&
        existingCustomer.getName() !== command.name
      ) {
        existingCustomer.updateName(command.name);
        await this.writeRepo.save(existingCustomer);
      }

      return { customerId: existingCustomer.getId().getValue() };
    }

    // Customer doesn't exist - create new anonymous customer
    const newCustomer = Customer.createAnonymous(
      UUID.generate(),
      UUID.fromString(command.businessId),
      whatsappPhone,
      command.name,
    );

    await this.writeRepo.save(newCustomer);

    return { customerId: newCustomer.getId().getValue() };
  }
}
