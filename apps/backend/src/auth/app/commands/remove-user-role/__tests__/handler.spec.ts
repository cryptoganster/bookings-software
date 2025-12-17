import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RemoveUserRoleHandler } from '../handler';
import { RemoveUserRoleCommand } from '../command';
import { IUserFactory } from '@auth/domain/interfaces/factories/user-factory';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';
import { User } from '@auth/domain/aggregates/user';
import { UUID } from '@shared/vo/uuid';
import { Email } from '@auth/domain/vo/email';
import { UserRole } from '@auth/domain/vo/user-role';
import { UserDoesNotHaveRoleException } from '@auth/domain/exceptions/user-does-not-have-role';
import { CannotRemoveLastRoleException } from '@auth/domain/exceptions/cannot-remove-last-role';

describe('RemoveUserRoleHandler', () => {
  let handler: RemoveUserRoleHandler;
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
        RemoveUserRoleHandler,
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

    handler = module.get<RemoveUserRoleHandler>(RemoveUserRoleHandler);
    userFactory = module.get('IUserFactory');
    userWriteRepository = module.get('IUserWriteRepository');
  });

  it('should remove role from user successfully', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new RemoveUserRoleCommand(userId, UserRole.CUSTOMER);

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
    expect(userFactory.loadById).toHaveBeenCalledWith(userId);
    expect(userWriteRepository.save).toHaveBeenCalled();
    const savedUser = userWriteRepository.save.mock.calls[0][0];
    expect(savedUser.getRoles()).not.toContain(UserRole.CUSTOMER);
    expect(savedUser.getRoles()).toContain(UserRole.BUSINESS_OWNER);
    expect(savedUser.getRoles()).toHaveLength(1);
  });

  it('should throw NotFoundException when user does not exist', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new RemoveUserRoleCommand(userId, UserRole.CUSTOMER);

    userFactory.loadById.mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(userWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should throw UserDoesNotHaveRoleException when user does not have the role', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new RemoveUserRoleCommand(userId, UserRole.CUSTOMER);

    const user = await User.register(
      UUID.fromString(userId),
      Email.fromString('test@example.com'),
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );

    userFactory.loadById.mockResolvedValue(user);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(UserDoesNotHaveRoleException);
    expect(userWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should throw CannotRemoveLastRoleException when trying to remove last role', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new RemoveUserRoleCommand(userId, UserRole.BUSINESS_OWNER);

    const user = await User.register(
      UUID.fromString(userId),
      Email.fromString('test@example.com'),
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );

    userFactory.loadById.mockResolvedValue(user);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(CannotRemoveLastRoleException);
    expect(userWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should allow removing role when user has multiple roles', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new RemoveUserRoleCommand(userId, UserRole.ADMIN);

    const user = await User.register(
      UUID.fromString(userId),
      Email.fromString('test@example.com'),
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );
    user.addRole(UserRole.CUSTOMER);
    user.addRole(UserRole.ADMIN);

    userFactory.loadById.mockResolvedValue(user);

    // Act
    await handler.execute(command);

    // Assert
    const savedUser = userWriteRepository.save.mock.calls[0][0];
    expect(savedUser.getRoles()).not.toContain(UserRole.ADMIN);
    expect(savedUser.getRoles()).toContain(UserRole.BUSINESS_OWNER);
    expect(savedUser.getRoles()).toContain(UserRole.CUSTOMER);
    expect(savedUser.getRoles()).toHaveLength(2);
  });
});
