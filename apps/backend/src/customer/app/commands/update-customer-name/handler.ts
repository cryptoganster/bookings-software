import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateCustomerNameCommand } from '@customer/app/commands/update-customer-name/command';
import { ICustomerFactory } from '@customer/domain/interfaces/factories';
import { ICustomerWriteRepository } from '@customer/domain/interfaces/repositories';
import { CustomerNotFoundException } from '@customer/domain/exceptions';

/**
 * UpdateCustomerNameHandler
 *
 * Updates the name of an existing customer
 *
 * Flow:
 * 1. Load customer via Factory
 * 2. Call updateName() on aggregate
 * 3. Save via Write Repository
 *
 * @throws CustomerNotFoundException if customer doesn't exist
 */
@CommandHandler(UpdateCustomerNameCommand)
export class UpdateCustomerNameHandler implements ICommandHandler<UpdateCustomerNameCommand> {
  constructor(
    @Inject('ICustomerFactory')
    private readonly factory: ICustomerFactory,
    @Inject('ICustomerWriteRepository')
    private readonly writeRepo: ICustomerWriteRepository,
  ) {}

  async execute(command: UpdateCustomerNameCommand): Promise<void> {
    const customer = await this.factory.loadById(command.customerId);

    if (!customer) {
      throw new CustomerNotFoundException(command.customerId);
    }

    customer.updateName(command.name);

    await this.writeRepo.save(customer);
  }
}
