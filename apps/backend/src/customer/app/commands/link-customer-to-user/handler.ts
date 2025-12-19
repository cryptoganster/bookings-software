import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { LinkCustomerToUserCommand } from '@customer/app/commands/link-customer-to-user/command';
import { ICustomerFactory } from '@customer/domain/interfaces/factories';
import { ICustomerWriteRepository } from '@customer/domain/interfaces/repositories';
import { CustomerNotFoundException } from '@customer/domain/exceptions';
import { UUID } from '@shared/vo/uuid';

/**
 * LinkCustomerToUserHandler
 * 
 * Links an anonymous customer to a registered User
 * 
 * Flow:
 * 1. Load customer via Factory
 * 2. Call linkToUser() on aggregate
 * 3. Save via Write Repository
 * 4. Event CustomerLinkedToUser is published
 * 5. Auth BC event handler adds CUSTOMER role to User
 * 
 * @throws CustomerNotFoundException if customer doesn't exist
 * @throws CustomerAlreadyLinkedToUserException if already linked
 * 
 * @see Property 8: Linking preserves customer identity
 */
@CommandHandler(LinkCustomerToUserCommand)
export class LinkCustomerToUserHandler
  implements ICommandHandler<LinkCustomerToUserCommand>
{
  constructor(
    @Inject('ICustomerFactory')
    private readonly factory: ICustomerFactory,
    @Inject('ICustomerWriteRepository')
    private readonly writeRepo: ICustomerWriteRepository,
  ) {}

  async execute(command: LinkCustomerToUserCommand): Promise<void> {
    const customer = await this.factory.loadById(command.customerId);

    if (!customer) {
      throw new CustomerNotFoundException(command.customerId);
    }

    const userId = UUID.fromString(command.userId);
    customer.linkToUser(userId);

    await this.writeRepo.save(customer);
  }
}
