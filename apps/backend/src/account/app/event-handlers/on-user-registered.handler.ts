import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UserRegistered } from '@auth/domain/events/user-registered';
import { UserRole } from '@auth/domain/vo/user-role';
import { CreateBusinessOwnerCommand } from '@account/app/commands/create-business-owner/command';
import { BusinessOwnerAlreadyExistsException } from '@account/domain/exceptions/business-owner-already-exists.exception';

/**
 * OnUserRegisteredHandler
 *
 * Event Handler that listens to UserRegistered events from Auth BC.
 *
 * Purpose: Automatically create a BusinessOwner profile when a User
 * registers with role=BUSINESS_OWNER.
 *
 * Flow:
 * 1. Auth BC publishes UserRegistered event
 * 2. This handler listens to the event
 * 3. If role=BUSINESS_OWNER, executes CreateBusinessOwnerCommand
 * 4. If role!=BUSINESS_OWNER, ignores the event
 * 5. Logs success/failure but doesn't propagate errors (eventual consistency)
 *
 * Requirements: 10.1-10.5
 */
@EventsHandler(UserRegistered)
export class OnUserRegisteredHandler implements IEventHandler<UserRegistered> {
  private readonly logger = new Logger(OnUserRegisteredHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: UserRegistered): Promise<void> {
    this.logger.log(
      `Handling UserRegistered event for userId: ${event.userId}, role: ${event.initialRole}`,
    );

    // Only create BusinessOwner if role is BUSINESS_OWNER
    if (event.initialRole !== UserRole.BUSINESS_OWNER) {
      this.logger.log(
        `Ignoring UserRegistered event - role is ${event.initialRole}, not BUSINESS_OWNER`,
      );
      return;
    }

    try {
      // Execute CreateBusinessOwnerCommand with FREE plan
      const result = await this.commandBus.execute(
        new CreateBusinessOwnerCommand(event.userId, 'FREE'),
      );

      this.logger.log(
        `Successfully created BusinessOwner ${result.businessOwnerId} for user ${event.userId}`,
      );

      // Automatically complete onboarding for new BusinessOwners
      // This allows them to create their first business immediately
      const { CompleteOnboardingCommand } =
        await import('@account/app/commands/complete-onboarding/command');
      await this.commandBus.execute(new CompleteOnboardingCommand(result.businessOwnerId));

      this.logger.log(
        `Successfully completed onboarding for BusinessOwner ${result.businessOwnerId}`,
      );
    } catch (error) {
      // If BusinessOwner already exists, log and continue (idempotent)
      if (error instanceof BusinessOwnerAlreadyExistsException) {
        this.logger.log(
          `BusinessOwner already exists for user ${event.userId} - idempotent operation`,
        );
        return;
      }

      // For other errors, log but don't propagate (event handlers should not fail)
      // This ensures eventual consistency - the system can retry later
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Error creating BusinessOwner for user ${event.userId}: ${errorMessage}`,
        errorStack,
      );
    }
  }
}
