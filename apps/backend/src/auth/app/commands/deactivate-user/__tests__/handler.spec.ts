import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DeactivateUserHandler } from '../handler';
import { DeactivateUserCommand } from '../command';
import { IUserFactory } from '@auth/domain/interfaces/factories/user-factory';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';
import { User } from '@auth/domain/aggregates/user';
import { UUID } from '@shared/vo/uuid';
import { Email } from '@auth/domain/vo/email';
import { UserRole } from '@auth/domain/vo/user-role';
import { UserAlreadyInactiveException } from '@auth/domain/exceptions/user-already-inactive';

describe('DeactivateUserHandler', () => {
  let handler: DeactivateUserHandler;
  let userFactory: jest.Mocked<IUserFactory>;
  let userWriteRepository: jest.Mocked<IUserWriteRepository>;

  beforeEach(async () => {
    const mockUserFactory = {
      loadById: jest.fn(),
      loadByEmail: jest.fn(),
    };

    const mockUserWriteRepository = {
      save: jest.fn(),
    };

    const mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeactivateUserHandler,
        {
          provide: 'IUserFactory',
          useValue: mockUserFactory,
        },
        {
          provide: 'IUserWriteRepository',
          useValue: mockUserWriteRepository,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    handler = module.get<DeactivateUserHandler>(DeactivateUserHandler);
    userFactory = module.get('IUserFactory');
    userWriteRepository = module.get('IUserWriteRepository');
  });

  it('should deactivate user successfully', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new DeactivateUserCommand(userId);

    const user = await User.register(
      UUID.fromString(userId),
      Email.fromString('test@example.com'),
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );

    userFactory.loadById.mockResolvedValue(user);

    // Act
    await handler.execute(command);

    // Assert
    expect(userFactory.loadById).toHaveBeenCalledWith(userId);
    expect(userWriteRepository.save).toHaveBeenCalled();
    const savedUser = userWriteRepository.save.mock.calls[0][0];
    expect(savedUser.getIsActive()).toBe(false);
  });

  it('should throw NotFoundException when user does not exist', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new DeactivateUserCommand(userId);

    userFactory.loadById.mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(userWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should throw UserAlreadyInactiveException when user is already inactive', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new DeactivateUserCommand(userId);

    const user = await User.register(
      UUID.fromString(userId),
      Email.fromString('test@example.com'),
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );
    user.deactivate(); // Deactivate first time

    userFactory.loadById.mockResolvedValue(user);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(UserAlreadyInactiveException);
    expect(userWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should deactivate user with multiple roles', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new DeactivateUserCommand(userId);

    const user = await User.register(
      UUID.fromString(userId),
      Email.fromString('test@example.com'),
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );
    user.addRole(UserRole.CUSTOMER);

    userFactory.loadById.mockResolvedValue(user);

    // Act
    await handler.execute(command);

    // Assert
    const savedUser = userWriteRepository.save.mock.calls[0][0];
    expect(savedUser.getIsActive()).toBe(false);
    expect(savedUser.getRoles()).toHaveLength(2);
  });

  it('should deactivate verified user', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new DeactivateUserCommand(userId);

    const user = await User.register(
      UUID.fromString(userId),
      Email.fromString('test@example.com'),
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );
    user.verifyEmail();

    userFactory.loadById.mockResolvedValue(user);

    // Act
    await handler.execute(command);

    // Assert
    const savedUser = userWriteRepository.save.mock.calls[0][0];
    expect(savedUser.getIsActive()).toBe(false);
    expect(savedUser.getEmailVerified()).toBe(true);
  });
});
