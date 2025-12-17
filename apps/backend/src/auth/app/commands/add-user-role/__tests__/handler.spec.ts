import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AddUserRoleHandler } from '../handler';
import { AddUserRoleCommand } from '../command';
import { IUserFactory } from '@auth/domain/interfaces/factories/user-factory';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';
import { User } from '@auth/domain/aggregates/user';
import { UUID } from '@shared/vo/uuid';
import { Email } from '@auth/domain/vo/email';
import { UserRole } from '@auth/domain/vo/user-role';
import { UserAlreadyHasRoleException } from '@auth/domain/exceptions/user-already-has-role';

describe('AddUserRoleHandler', () => {
  let handler: AddUserRoleHandler;
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
        AddUserRoleHandler,
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

    handler = module.get<AddUserRoleHandler>(AddUserRoleHandler);
    userFactory = module.get('IUserFactory');
    userWriteRepository = module.get('IUserWriteRepository');
  });

  it('should add role to user successfully', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new AddUserRoleCommand(userId, UserRole.CUSTOMER);

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
    expect(savedUser.getRoles()).toContain(UserRole.CUSTOMER);
    expect(savedUser.getRoles()).toContain(UserRole.BUSINESS_OWNER);
    expect(savedUser.getRoles()).toHaveLength(2);
  });

  it('should throw NotFoundException when user does not exist', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new AddUserRoleCommand(userId, UserRole.CUSTOMER);

    userFactory.loadById.mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(userWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should throw UserAlreadyHasRoleException when user already has the role', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new AddUserRoleCommand(userId, UserRole.BUSINESS_OWNER);

    const user = await User.register(
      UUID.fromString(userId),
      Email.fromString('test@example.com'),
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );

    userFactory.loadById.mockResolvedValue(user);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(UserAlreadyHasRoleException);
    expect(userWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should add ADMIN role to user with BUSINESS_OWNER role', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new AddUserRoleCommand(userId, UserRole.ADMIN);

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
    const savedUser = userWriteRepository.save.mock.calls[0][0];
    expect(savedUser.getRoles()).toContain(UserRole.ADMIN);
    expect(savedUser.getRoles()).toContain(UserRole.BUSINESS_OWNER);
    expect(savedUser.getRoles()).toHaveLength(2);
  });
});
