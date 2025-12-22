import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, CqrsModule, EventPublisher } from '@nestjs/cqrs';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { OnUserRegisteredHandler } from '../on-user-registered.handler';
import { UserRegistered } from '@auth/domain/events/user-registered';
import { UserRole } from '@auth/domain/vo/user-role';
import { CreateBusinessOwnerCommand } from '@account/app/commands/create-business-owner/command';

/**
 * Integration Test for OnUserRegisteredHandler
 *
 * Tests the event handler that creates BusinessOwner when User is registered.
 */
describe('OnUserRegisteredHandler - Integration Test', () => {
  let module: TestingModule;
  let handler: OnUserRegisteredHandler;
  let commandBus: CommandBus;

  beforeEach(async () => {
    const mockEventPublisher = {
      mergeObjectContext: jest.fn((obj: any) => {
        // Return the original object with a mock commit method added
        obj.commit = jest.fn();
        return obj;
      }),
    };

    module = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        OnUserRegisteredHandler,
        {
          provide: EventPublisher,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    handler = module.get<OnUserRegisteredHandler>(OnUserRegisteredHandler);
    commandBus = module.get<CommandBus>(CommandBus);

    // Mock CommandBus.execute
    jest.spyOn(commandBus, 'execute').mockResolvedValue({ businessOwnerId: 'test-id' });
  });

  it('should dispatch CreateBusinessOwnerCommand when User with BUSINESS_OWNER role is registered', async () => {
    // Arrange
    const event = new UserRegistered(
      'user-id-123',
      'test@example.com',
      'John Doe',
      UserRole.BUSINESS_OWNER,
    );

    // Act
    await handler.handle(event);

    // Assert - Now expects 2 calls: CreateBusinessOwner + CompleteOnboarding
    expect(commandBus.execute).toHaveBeenCalledTimes(2);

    // First call: CreateBusinessOwnerCommand
    expect(commandBus.execute).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        userId: 'user-id-123',
        subscriptionPlanName: 'FREE',
      }),
    );

    // Second call: CompleteOnboardingCommand
    expect(commandBus.execute).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        businessOwnerId: 'test-id', // From mock response
      }),
    );
  });

  it('should NOT dispatch CreateBusinessOwnerCommand when User with CUSTOMER role is registered', async () => {
    // Arrange
    const event = new UserRegistered(
      'user-id-456',
      'customer@example.com',
      'Jane Doe',
      UserRole.CUSTOMER,
    );

    // Act
    await handler.handle(event);

    // Assert
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should NOT dispatch CreateBusinessOwnerCommand when User with ADMIN role is registered', async () => {
    // Arrange
    const event = new UserRegistered(
      'user-id-789',
      'admin@example.com',
      'Admin User',
      UserRole.ADMIN,
    );

    // Act
    await handler.handle(event);

    // Assert
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should use FREE plan by default', async () => {
    // Arrange
    const event = new UserRegistered(
      'user-id-123',
      'test@example.com',
      'John Doe',
      UserRole.BUSINESS_OWNER,
    );

    // Act
    await handler.handle(event);

    // Assert
    const executedCommand = (commandBus.execute as jest.Mock).mock
      .calls[0][0] as CreateBusinessOwnerCommand;
    expect(executedCommand.subscriptionPlanName).toBe('FREE');
  });

  it('should handle multiple UserRegistered events independently', async () => {
    // Arrange
    const event1 = new UserRegistered(
      'user-id-1',
      'user1@example.com',
      'User One',
      UserRole.BUSINESS_OWNER,
    );
    const event2 = new UserRegistered(
      'user-id-2',
      'user2@example.com',
      'User Two',
      UserRole.BUSINESS_OWNER,
    );
    const event3 = new UserRegistered(
      'user-id-3',
      'user3@example.com',
      'User Three',
      UserRole.CUSTOMER,
    );

    // Act
    await handler.handle(event1);
    await handler.handle(event2);
    await handler.handle(event3);

    // Assert - Now expects 4 calls: 2 BUSINESS_OWNER events × 2 commands each (CreateBusinessOwner + CompleteOnboarding)
    expect(commandBus.execute).toHaveBeenCalledTimes(4);
  });
});
