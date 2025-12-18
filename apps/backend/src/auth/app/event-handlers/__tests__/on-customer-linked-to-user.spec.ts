import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import {
  OnCustomerLinkedToUserHandler,
  CustomerLinkedToUser,
} from '../on-customer-linked-to-user';
import { AddUserRoleCommand } from '../../commands/add-user-role/command';
import { UserRole } from '@auth/domain/vo/user-role';
import { UserAlreadyHasRoleException } from '@auth/domain/exceptions/user-already-has-role';

describe('OnCustomerLinkedToUserHandler', () => {
  let handler: OnCustomerLinkedToUserHandler;
  let commandBus: CommandBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnCustomerLinkedToUserHandler,
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<OnCustomerLinkedToUserHandler>(
      OnCustomerLinkedToUserHandler,
    );
    commandBus = module.get<CommandBus>(CommandBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should execute AddUserRoleCommand with CUSTOMER role', async () => {
      // Arrange
      const event = new CustomerLinkedToUser(
        'customer-id',
        'user-id',
        'business-id',
      );

      // Act
      await handler.handle(event);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-id',
          role: UserRole.CUSTOMER,
        }),
      );

      // Verify it's an AddUserRoleCommand instance
      const command = (commandBus.execute as jest.Mock).mock.calls[0][0];
      expect(command).toBeInstanceOf(AddUserRoleCommand);
    });

    it('should be idempotent - not fail if user already has CUSTOMER role', async () => {
      // Arrange
      const event = new CustomerLinkedToUser(
        'customer-id',
        'user-id',
        'business-id',
      );

      // Simulate UserAlreadyHasRoleException
      (commandBus.execute as jest.Mock).mockRejectedValueOnce(
        new UserAlreadyHasRoleException('user-id', UserRole.CUSTOMER),
      );

      // Act & Assert - should not throw
      await expect(handler.handle(event)).resolves.not.toThrow();

      // Verify command was still executed
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
    });

    it('should not propagate other errors', async () => {
      // Arrange
      const event = new CustomerLinkedToUser(
        'customer-id',
        'user-id',
        'business-id',
      );

      // Simulate generic error
      const genericError = new Error('Database connection failed');
      (commandBus.execute as jest.Mock).mockRejectedValueOnce(genericError);

      // Act & Assert - should not throw (event handlers should not fail)
      await expect(handler.handle(event)).resolves.not.toThrow();

      // Verify command was executed
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
    });

    it('should handle non-Error exceptions gracefully', async () => {
      // Arrange
      const event = new CustomerLinkedToUser(
        'customer-id',
        'user-id',
        'business-id',
      );

      // Simulate non-Error exception (e.g., string thrown)
      (commandBus.execute as jest.Mock).mockRejectedValueOnce(
        'Something went wrong',
      );

      // Act & Assert - should not throw
      await expect(handler.handle(event)).resolves.not.toThrow();

      // Verify command was executed
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
    });

    it('should log success when role is added successfully', async () => {
      // Arrange
      const event = new CustomerLinkedToUser(
        'customer-id',
        'user-id',
        'business-id',
      );

      const loggerSpy = jest.spyOn(handler['logger'], 'log');

      // Act
      await handler.handle(event);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Handling CustomerLinkedToUser event'),
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Successfully added CUSTOMER role'),
      );
    });

    it('should log when user already has role (idempotent)', async () => {
      // Arrange
      const event = new CustomerLinkedToUser(
        'customer-id',
        'user-id',
        'business-id',
      );

      (commandBus.execute as jest.Mock).mockRejectedValueOnce(
        new UserAlreadyHasRoleException('user-id', UserRole.CUSTOMER),
      );

      const loggerSpy = jest.spyOn(handler['logger'], 'log');

      // Act
      await handler.handle(event);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('already has CUSTOMER role'),
      );
    });

    it('should log error for unexpected exceptions', async () => {
      // Arrange
      const event = new CustomerLinkedToUser(
        'customer-id',
        'user-id',
        'business-id',
      );

      const genericError = new Error('Unexpected error');
      (commandBus.execute as jest.Mock).mockRejectedValueOnce(genericError);

      const loggerErrorSpy = jest.spyOn(handler['logger'], 'error');

      // Act
      await handler.handle(event);

      // Assert
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error adding CUSTOMER role'),
        expect.any(String),
      );
    });
  });
});
