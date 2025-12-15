import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';
import { RegisterHandler } from '../handler';
import { RegisterCommand } from '../command';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';
import { IUserReadRepository } from '@auth/domain/interfaces/repositories/user-read';
import { UUID } from '@shared/vo/uuid';

describe('RegisterHandler', () => {
  let handler: RegisterHandler;
  let userWriteRepository: jest.Mocked<IUserWriteRepository>;
  let userReadRepository: jest.Mocked<IUserReadRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockUserWriteRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };

    const mockUserReadRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterHandler,
        {
          provide: 'IUserWriteRepository',
          useValue: mockUserWriteRepository,
        },
        {
          provide: 'IUserReadRepository',
          useValue: mockUserReadRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    handler = module.get<RegisterHandler>(RegisterHandler);
    userWriteRepository = module.get('IUserWriteRepository');
    userReadRepository = module.get('IUserReadRepository');
    jwtService = module.get(JwtService);
  });

  it('should register a new user and return userId and accessToken', async () => {
    // Arrange
    const command = new RegisterCommand('test@example.com', 'Password123', 'Test User');
    userReadRepository.findByEmail.mockResolvedValue(null);
    jwtService.sign.mockReturnValue('mock-jwt-token');

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('accessToken');
    expect(result.accessToken).toBe('mock-jwt-token');
    expect(userReadRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(userWriteRepository.save).toHaveBeenCalled();
    expect(jwtService.sign).toHaveBeenCalled();
  });

  it('should throw ConflictException if user already exists', async () => {
    // Arrange
    const command = new RegisterCommand('existing@example.com', 'Password123', 'Test User');
    const existingUserReadModel = {
      id: UUID.generate().getValue(),
      email: 'existing@example.com',
      name: 'Existing User',
      businessId: null,
      createdAt: new Date(),
    };
    userReadRepository.findByEmail.mockResolvedValue(existingUserReadModel);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(ConflictException);
    expect(userWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should hash password correctly', async () => {
    // Arrange
    const command = new RegisterCommand('test@example.com', 'Password123', 'Test User');
    userReadRepository.findByEmail.mockResolvedValue(null);
    jwtService.sign.mockReturnValue('mock-jwt-token');

    // Act
    await handler.execute(command);

    // Assert
    const savedUser = userWriteRepository.save.mock.calls[0][0];
    const hashedPassword = savedUser.getPassword().getValue();
    expect(hashedPassword).not.toBe('Password123');
    expect(hashedPassword.length).toBeGreaterThan(20); // bcrypt hashes are long
  });
});
