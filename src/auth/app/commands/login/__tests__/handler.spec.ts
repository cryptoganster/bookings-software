import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { LoginHandler } from '../handler';
import { LoginCommand } from '../command';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';
import { User } from '@auth/domain/aggregates/user';
import { UUID } from '@shared/vo/uuid';
import { Email } from '@auth/domain/vo/email';

describe('LoginHandler', () => {
  let handler: LoginHandler;
  let userWriteRepository: jest.Mocked<IUserWriteRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockUserWriteRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginHandler,
        {
          provide: 'IUserWriteRepository',
          useValue: mockUserWriteRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    handler = module.get<LoginHandler>(LoginHandler);
    userWriteRepository = module.get('IUserWriteRepository');
    jwtService = module.get(JwtService);
  });

  it('should login successfully and return accessToken', async () => {
    // Arrange
    const command = new LoginCommand('test@example.com', 'Password123');
    const user = await User.create(
      UUID.generate(),
      Email.fromString('test@example.com'),
      'Password123',
      'Test User',
    );
    userWriteRepository.findByEmail.mockResolvedValue(user);
    jwtService.sign.mockReturnValue('mock-jwt-token');

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toHaveProperty('accessToken');
    expect(result.accessToken).toBe('mock-jwt-token');
    expect(userWriteRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(jwtService.sign).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if user not found', async () => {
    // Arrange
    const command = new LoginCommand('nonexistent@example.com', 'Password123');
    userWriteRepository.findByEmail.mockResolvedValue(null);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(UnauthorizedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if password is invalid', async () => {
    // Arrange
    const command = new LoginCommand('test@example.com', 'WrongPassword');
    const user = await User.create(
      UUID.generate(),
      Email.fromString('test@example.com'),
      'Password123',
      'Test User',
    );
    userWriteRepository.findByEmail.mockResolvedValue(user);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(UnauthorizedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('should generate JWT with correct payload', async () => {
    // Arrange
    const command = new LoginCommand('test@example.com', 'Password123');
    const userId = UUID.generate();
    const user = await User.create(
      userId,
      Email.fromString('test@example.com'),
      'Password123',
      'Test User',
    );
    userWriteRepository.findByEmail.mockResolvedValue(user);
    jwtService.sign.mockReturnValue('mock-jwt-token');

    // Act
    await handler.execute(command);

    // Assert
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: userId.getValue(),
      email: 'test@example.com',
      businessId: undefined,
    });
  });
});
