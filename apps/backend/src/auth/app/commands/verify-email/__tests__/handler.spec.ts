import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { VerifyEmailHandler } from '../handler';
import { VerifyEmailCommand } from '../command';
import { IUserFactory } from '@auth/domain/interfaces/factories/user-factory';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';
import { User } from '@auth/domain/aggregates/user';
import { UUID } from '@shared/vo/uuid';
import { Email } from '@auth/domain/vo/email';
import { UserRole } from '@auth/domain/vo/user-role';
import { EmailAlreadyVerifiedException } from '@auth/domain/exceptions/email-already-verified';

describe('VerifyEmailHandler', () => {
  let handler: VerifyEmailHandler;
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
        VerifyEmailHandler,
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

    handler = module.get<VerifyEmailHandler>(VerifyEmailHandler);
    userFactory = module.get('IUserFactory');
    userWriteRepository = module.get('IUserWriteRepository');
  });

  it('should verify email successfully', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new VerifyEmailCommand(userId);

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
    expect(savedUser.getEmailVerified()).toBe(true);
  });

  it('should throw NotFoundException when user does not exist', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new VerifyEmailCommand(userId);

    userFactory.loadById.mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(userWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should throw EmailAlreadyVerifiedException when email is already verified', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new VerifyEmailCommand(userId);

    const user = await User.register(
      UUID.fromString(userId),
      Email.fromString('test@example.com'),
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );
    user.verifyEmail(); // Verify email first time

    userFactory.loadById.mockResolvedValue(user);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(EmailAlreadyVerifiedException);
    expect(userWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should verify email for user with multiple roles', async () => {
    // Arrange
    const userId = UUID.generate().getValue();
    const command = new VerifyEmailCommand(userId);

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
    expect(savedUser.getEmailVerified()).toBe(true);
    expect(savedUser.getRoles()).toHaveLength(2);
  });
});
