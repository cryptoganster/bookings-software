import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { AddUserRoleCommand } from '../commands/add-user-role/command';
import { UserRole } from '@auth/domain/vo/user-role';
import { UserAlreadyHasRoleException } from '@auth/domain/exceptions/user-already-has-role';

/**
 * Event from Customer BC
 * Published when a Customer (anonymous) is linked to a User (registered)
 *
 * This event will be published by Customer BC when:
 * - An anonymous customer registers and links their account
 * - A registered user becomes a customer of a business
 */
export class CustomerLinkedToUser {
  constructor(
    public readonly customerId: string,
    public readonly userId: string,
    public readonly businessId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

/**
 * Event Handler: OnCustomerLinkedToUserHandler
 *
 * Purpose: Automatically add CUSTOMER role to User when they are linked to a Customer profile
 *
 * Flow:
 * 1. Customer BC publishes CustomerLinkedToUser event
 * 2. This handler listens to the event
 * 3. Executes AddUserRoleCommand to add CUSTOMER role
 * 4. If role already exists, logs and continues (idempotent)
 *
 * Related to: Auth BC Roles Refactor - Phase 16
 * Requirements: 3.2, 3.3
 */
@EventsHandler(CustomerLinkedToUser)
export class OnCustomerLinkedToUserHandler implements IEventHandler<CustomerLinkedToUser> {
  private readonly logger = new Logger(OnCustomerLinkedToUserHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: CustomerLinkedToUser): Promise<void> {
    this.logger.log(
      `Handling CustomerLinkedToUser event for userId: ${event.userId}, customerId: ${event.customerId}`,
    );

    try {
      // Execute AddUserRoleCommand to add CUSTOMER role
      await this.commandBus.execute(new AddUserRoleCommand(event.userId, UserRole.CUSTOMER));

      this.logger.log(`Successfully added CUSTOMER role to user ${event.userId}`);
    } catch (error) {
      // If user already has CUSTOMER role, log and continue (idempotent)
      if (error instanceof UserAlreadyHasRoleException) {
        this.logger.log(`User ${event.userId} already has CUSTOMER role - idempotent operation`);
        return;
      }

      // For other errors, log but don't propagate (event handlers should not fail)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Error adding CUSTOMER role to user ${event.userId}: ${errorMessage}`,
        errorStack,
      );
    }
  }
}
