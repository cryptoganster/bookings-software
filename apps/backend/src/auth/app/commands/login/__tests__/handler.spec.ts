import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { PinoLogger } from 'nestjs-pino';
import { LoginHandler } from '../handler';
import { LoginCommand } from '../command';
import { IUserFactory } from '@auth/domain/interfaces/factories/user-factory';
import { User } from '@auth/domain/aggregates/user';
import { UUID } from '@shared/vo/uuid';
import { Email } from '@auth/domain/vo/email';
import { UserRole } from '@auth/domain/vo/user-role';

describe('LoginHandler', () => {
  let handler: LoginHandler;
  let userFactory: jest.Mocked<IUserFactory>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockUserFactory = {
      loadById: jest.fn(),
      loadByEmail: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const mockQueryBus = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginHandler,
        {
          provide: 'IUserFactory',
          useValue: mockUserFactory,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    handler = module.get<LoginHandler>(LoginHandler);
    userFactory = module.get('IUserFactory');
    jwtService = module.get(JwtService);
  });

  it('should login successfully and return user and token', async () => {
    // Arrange
    const command = new LoginCommand('test@example.com', 'Password123');
    const user = await User.register(
      UUID.generate(),
      Email.fromString('test@example.com'),
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );
    userFactory.loadByEmail.mockResolvedValue(user);
    jwtService.sign.mockReturnValue('mock-jwt-token');

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('user');
    expect(result.token).toBe('mock-jwt-token');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.name).toBe('Test User');
    expect(result.user.roles).toContain(UserRole.BUSINESS_OWNER);
    expect(userFactory.loadByEmail).toHaveBeenCalledWith('test@example.com');
    expect(jwtService.sign).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if user not found', async () => {
    // Arrange
    const command = new LoginCommand('nonexistent@example.com', 'Password123');
    userFactory.loadByEmail.mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(UnauthorizedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if password is invalid', async () => {
    // Arrange
    const command = new LoginCommand('test@example.com', 'WrongPassword');
    const user = await User.register(
      UUID.generate(),
      Email.fromString('test@example.com'),
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );
    userFactory.loadByEmail.mockResolvedValue(user);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(UnauthorizedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('should generate JWT with correct payload including roles', async () => {
    // Arrange
    const command = new LoginCommand('test@example.com', 'Password123');
    const userId = UUID.generate();
    const user = await User.register(
      userId,
      Email.fromString('test@example.com'),
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );
    userFactory.loadByEmail.mockResolvedValue(user);
    jwtService.sign.mockReturnValue('mock-jwt-token');

    // Act
    await handler.execute(command);

    // Assert
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: userId.getValue(),
      email: 'test@example.com',
      roles: [UserRole.BUSINESS_OWNER],
    });
  });
});
