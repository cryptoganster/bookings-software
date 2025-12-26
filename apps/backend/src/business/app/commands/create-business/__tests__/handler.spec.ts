import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { CreateBusinessHandler } from '@business/app/commands/create-business/handler';
import { CreateBusinessCommand } from '@business/app/commands/create-business/command';
import { IBusinessWriteRepository } from '@business/domain/interfaces/repositories/business-write';
import { IBusinessUniquenessChecker } from '@business/domain/interfaces/services/business-uniqueness-checker.interface';
import { IBusinessLimitChecker } from '@business/domain/interfaces/services/business-limit-checker.interface';
import { WhatsAppPhoneAlreadyExistsException } from '@shared/kernel/exceptions/whatsapp-phone-already-exists';
import { OnboardingNotCompletedException } from '@business/domain/exceptions/onboarding-not-completed';
import { MaxBusinessesExceededException } from '@business/domain/exceptions/max-businesses-exceeded';
import { BusinessOwnerNotFoundException } from '@business/domain/exceptions/business-owner-not-found';
import { GetBusinessOwnerByUserIdQuery } from '@account/app/queries/get-business-owner-by-user-id/query';

describe('CreateBusinessHandler', () => {
  let handler: CreateBusinessHandler;
  let writeRepository: jest.Mocked<IBusinessWriteRepository>;
  let uniquenessChecker: jest.Mocked<IBusinessUniquenessChecker>;
  let limitChecker: jest.Mocked<IBusinessLimitChecker>;
  let queryBus: jest.Mocked<QueryBus>;

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockBusinessOwnerId = '550e8400-e29b-41d4-a716-446655440001';

  const mockBusinessOwner = {
    id: mockBusinessOwnerId,
    userId: mockUserId,
    onboardingCompleted: true,
    subscriptionPlan: 'PRO',
  };

  const validCommand = new CreateBusinessCommand(
    mockUserId,
    'Test Business',
    '+18095551234',
    {
      street: '123 Main St',
      city: 'Santo Domingo',
      state: 'Distrito Nacional',
      country: 'Dominican Republic',
      postalCode: '10001',
    },
    'America/Santo_Domingo',
  );

  beforeEach(async () => {
    const mockWriteRepository: Partial<IBusinessWriteRepository> = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    const mockUniquenessChecker: Partial<IBusinessUniquenessChecker> = {
      isWhatsAppPhoneUnique: jest.fn().mockResolvedValue(true),
    };

    const mockLimitChecker: Partial<IBusinessLimitChecker> = {
      canCreateBusiness: jest.fn().mockResolvedValue(true),
      getBusinessCount: jest.fn().mockResolvedValue(0),
      getMaxBusinessesAllowed: jest.fn().mockResolvedValue(3),
    };

    const mockQueryBus: Partial<QueryBus> = {
      execute: jest.fn().mockResolvedValue(mockBusinessOwner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBusinessHandler,
        {
          provide: 'IBusinessWriteRepository',
          useValue: mockWriteRepository,
        },
        {
          provide: 'IBusinessUniquenessChecker',
          useValue: mockUniquenessChecker,
        },
        {
          provide: 'IBusinessLimitChecker',
          useValue: mockLimitChecker,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    }).compile();

    handler = module.get<CreateBusinessHandler>(CreateBusinessHandler);
    writeRepository = module.get('IBusinessWriteRepository');
    uniquenessChecker = module.get('IBusinessUniquenessChecker');
    limitChecker = module.get('IBusinessLimitChecker');
    queryBus = module.get(QueryBus);
  });

  describe('execute', () => {
    it('should create business successfully when all validations pass', async () => {
      // Act
      const result = await handler.execute(validCommand);

      // Assert
      expect(result).toHaveProperty('businessId');
      expect(typeof result.businessId).toBe('string');
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetBusinessOwnerByUserIdQuery));
      expect(limitChecker.canCreateBusiness).toHaveBeenCalledWith(mockUserId);
      expect(uniquenessChecker.isWhatsAppPhoneUnique).toHaveBeenCalledWith('+18095551234');
      expect(writeRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw BusinessOwnerNotFoundException when business owner not found', async () => {
      // Arrange
      queryBus.execute.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(BusinessOwnerNotFoundException);
      expect(limitChecker.canCreateBusiness).not.toHaveBeenCalled();
      expect(uniquenessChecker.isWhatsAppPhoneUnique).not.toHaveBeenCalled();
      expect(writeRepository.save).not.toHaveBeenCalled();
    });

    it('should throw OnboardingNotCompletedException when onboarding not completed', async () => {
      // Arrange
      queryBus.execute.mockResolvedValueOnce({
        ...mockBusinessOwner,
        onboardingCompleted: false,
      });

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(OnboardingNotCompletedException);
      expect(limitChecker.canCreateBusiness).not.toHaveBeenCalled();
      expect(uniquenessChecker.isWhatsAppPhoneUnique).not.toHaveBeenCalled();
      expect(writeRepository.save).not.toHaveBeenCalled();
    });

    it('should throw MaxBusinessesExceededException when business limit reached', async () => {
      // Arrange
      limitChecker.canCreateBusiness.mockResolvedValueOnce(false);
      limitChecker.getBusinessCount.mockResolvedValueOnce(3);
      limitChecker.getMaxBusinessesAllowed.mockResolvedValueOnce(3);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(MaxBusinessesExceededException);
      expect(limitChecker.canCreateBusiness).toHaveBeenCalledWith(mockUserId);
      expect(limitChecker.getBusinessCount).toHaveBeenCalledWith(mockUserId);
      expect(limitChecker.getMaxBusinessesAllowed).toHaveBeenCalledWith(mockUserId);
      expect(uniquenessChecker.isWhatsAppPhoneUnique).not.toHaveBeenCalled();
      expect(writeRepository.save).not.toHaveBeenCalled();
    });

    it('should throw WhatsAppPhoneAlreadyExistsException when phone not unique', async () => {
      // Arrange
      uniquenessChecker.isWhatsAppPhoneUnique.mockResolvedValueOnce(false);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        WhatsAppPhoneAlreadyExistsException,
      );
      expect(queryBus.execute).toHaveBeenCalled();
      expect(limitChecker.canCreateBusiness).toHaveBeenCalled();
      expect(uniquenessChecker.isWhatsAppPhoneUnique).toHaveBeenCalledWith('+18095551234');
      expect(writeRepository.save).not.toHaveBeenCalled();
    });

    it('should validate business owner before checking limits', async () => {
      // Arrange
      const executionOrder: string[] = [];
      queryBus.execute.mockImplementation(async () => {
        executionOrder.push('businessOwner');
        return mockBusinessOwner;
      });
      limitChecker.canCreateBusiness.mockImplementation(async () => {
        executionOrder.push('limitCheck');
        return true;
      });

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(executionOrder).toEqual(['businessOwner', 'limitCheck']);
    });

    it('should validate limits before checking uniqueness', async () => {
      // Arrange
      const executionOrder: string[] = [];
      limitChecker.canCreateBusiness.mockImplementation(async () => {
        executionOrder.push('limitCheck');
        return true;
      });
      uniquenessChecker.isWhatsAppPhoneUnique.mockImplementation(async () => {
        executionOrder.push('uniquenessCheck');
        return true;
      });

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(executionOrder).toEqual(['limitCheck', 'uniquenessCheck']);
    });

    it('should create business with correct data', async () => {
      // Act
      await handler.execute(validCommand);

      // Assert
      expect(writeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Business',
        }),
      );
    });

    it('should handle multiple businesses for same owner', async () => {
      // Arrange
      limitChecker.getBusinessCount.mockResolvedValueOnce(2);
      limitChecker.getMaxBusinessesAllowed.mockResolvedValueOnce(3);

      // Act
      const result = await handler.execute(validCommand);

      // Assert
      expect(result).toHaveProperty('businessId');
      expect(limitChecker.canCreateBusiness).toHaveBeenCalledWith(mockUserId);
    });

    it('should use domain services instead of read repositories', async () => {
      // Act
      await handler.execute(validCommand);

      // Assert
      // Verify domain services were used
      expect(uniquenessChecker.isWhatsAppPhoneUnique).toHaveBeenCalled();
      expect(limitChecker.canCreateBusiness).toHaveBeenCalled();

      // Verify only write repository was used for persistence
      expect(writeRepository.save).toHaveBeenCalled();
    });
  });
});
