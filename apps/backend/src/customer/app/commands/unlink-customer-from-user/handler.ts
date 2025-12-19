import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UnlinkCustomerFromUserCommand } from '@customer/app/commands/unlink-customer-from-user/command';
import { ICustomerFactory } from '@customer/domain/interfaces/factories';
import { ICustomerWriteRepository } from '@customer/domain/interfaces/repositories';
import { CustomerNotFoundException } from '@customer/domain/exceptions';

/**
 * UnlinkCustomerFromUserHandler
 * 
 * Unlinks a registered customer from their User
 * 
 * Flow:
 * 1. Load customer via Factory
 * 2. Call unlinkFromUser() on aggregate
 * 3. Save via Write Repository
 * 4. Event CustomerUnlinkedFromUser is published
 * 
 * @throws CustomerNotFoundException if customer doesn't exist
 * @throws CustomerNotLinkedToUserException if not linked
 * 
 * @see Property 9: Unlinking preserves customer identity
 */
@CommandHandler(UnlinkCustomerFromUserCommand)
export class UnlinkCustomerFromUserHandler
  implements ICommandHandler<UnlinkCustomerFromUserCommand>
{
  constructor(
    @Inject('ICustomerFactory')
    private readonly factory: ICustomerFactory,
    @Inject('ICustomerWriteRepository')
    private readonly writeRepo: ICustomerWriteRepository,
  ) {}

  async execute(command: UnlinkCustomerFromUserCommand): Promise<void> {
    const customer = await this.factory.loadById(command.customerId);

    if (!customer) {
      throw new CustomerNotFoundException(command.customerId);
    }

    customer.unlinkFromUser();

    await this.writeRepo.save(customer);
  }
}
