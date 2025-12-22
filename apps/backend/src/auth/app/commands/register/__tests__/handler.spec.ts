import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RegisterHandler } from '../handler';
import { RegisterCommand } from '../command';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';
import { IUserReadRepository } from '@auth/domain/interfaces/repositories/user-read';
import { UUID } from '@shared/vo/uuid';
import { UserRole } from '@auth/domain/vo/user-role';

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

    const mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
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
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    handler = module.get<RegisterHandler>(RegisterHandler);
    userWriteRepository = module.get('IUserWriteRepository');
    userReadRepository = module.get('IUserReadRepository');
    jwtService = module.get(JwtService);
  });

  it('should register a new user and return userId and token', async () => {
    // Arrange
    const command = new RegisterCommand(
      'test@example.com',
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );
    userReadRepository.findByEmail.mockResolvedValue(null);
    jwtService.sign.mockReturnValue('mock-jwt-token');

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('token');
    expect(result.token).toBe('mock-jwt-token');
    expect(userReadRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(userWriteRepository.save).toHaveBeenCalled();
    expect(jwtService.sign).toHaveBeenCalled();
  });

  it('should throw ConflictException if user already exists', async () => {
    // Arrange
    const command = new RegisterCommand(
      'existing@example.com',
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );
    const existingUserReadModel = {
      id: UUID.generate().getValue(),
      email: 'existing@example.com',
      name: 'Existing User',
      roles: [UserRole.BUSINESS_OWNER],
      isActive: true,
      emailVerified: false,
      createdAt: new Date(),
    };
    userReadRepository.findByEmail.mockResolvedValue(existingUserReadModel);

    // Act & Assert
    await expect(handler.execute(command)).rejects.toThrow(ConflictException);
    expect(userWriteRepository.save).not.toHaveBeenCalled();
  });

  it('should hash password correctly', async () => {
    // Arrange
    const command = new RegisterCommand(
      'test@example.com',
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );
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

  it('should create user with BUSINESS_OWNER role by default', async () => {
    // Arrange
    const command = new RegisterCommand(
      'test@example.com',
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );
    userReadRepository.findByEmail.mockResolvedValue(null);
    jwtService.sign.mockReturnValue('mock-jwt-token');

    // Act
    await handler.execute(command);

    // Assert
    const savedUser = userWriteRepository.save.mock.calls[0][0];
    expect(savedUser.getRoles()).toContain(UserRole.BUSINESS_OWNER);
    expect(savedUser.getRoles()).toHaveLength(1);
  });

  it('should include roles in JWT payload', async () => {
    // Arrange
    const command = new RegisterCommand(
      'test@example.com',
      'Password123',
      'Test User',
      UserRole.BUSINESS_OWNER,
    );
    userReadRepository.findByEmail.mockResolvedValue(null);
    jwtService.sign.mockReturnValue('mock-jwt-token');

    // Act
    await handler.execute(command);

    // Assert
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: [UserRole.BUSINESS_OWNER],
      }),
    );
  });

  it('should register user with CUSTOMER role when specified', async () => {
    // Arrange
    const command = new RegisterCommand(
      'customer@example.com',
      'Password123',
      'Customer User',
      UserRole.CUSTOMER,
    );
    userReadRepository.findByEmail.mockResolvedValue(null);
    jwtService.sign.mockReturnValue('mock-jwt-token');

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('token');
    const savedUser = userWriteRepository.save.mock.calls[0][0];
    expect(savedUser.getRoles()).toContain(UserRole.CUSTOMER);
    expect(savedUser.getRoles()).toHaveLength(1);
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: [UserRole.CUSTOMER],
      }),
    );
  });

  it('should register user with ADMIN role when specified', async () => {
    // Arrange
    const command = new RegisterCommand(
      'admin@example.com',
      'Password123',
      'Admin User',
      UserRole.ADMIN,
    );
    userReadRepository.findByEmail.mockResolvedValue(null);
    jwtService.sign.mockReturnValue('mock-jwt-token');

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('token');
    const savedUser = userWriteRepository.save.mock.calls[0][0];
    expect(savedUser.getRoles()).toContain(UserRole.ADMIN);
    expect(savedUser.getRoles()).toHaveLength(1);
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: [UserRole.ADMIN],
      }),
    );
  });

  it('should verify JWT contains correct role based on initialRole', async () => {
    // Arrange - Test with each role
    const testCases = [
      { role: UserRole.BUSINESS_OWNER, email: 'owner@example.com' },
      { role: UserRole.CUSTOMER, email: 'customer@example.com' },
      { role: UserRole.ADMIN, email: 'admin@example.com' },
    ];

    for (const testCase of testCases) {
      // Reset mocks
      jest.clearAllMocks();
      userReadRepository.findByEmail.mockResolvedValue(null);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const command = new RegisterCommand(
        testCase.email,
        'Password123',
        'Test User',
        testCase.role,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: [testCase.role],
        }),
      );
    }
  });
});
