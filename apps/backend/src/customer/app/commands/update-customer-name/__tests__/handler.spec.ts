import { Test, TestingModule } from '@nestjs/testing';
import { UpdateCustomerNameHandler } from '../handler';
import { UpdateCustomerNameCommand } from '../command';
import { ICustomerFactory } from '@customer/domain/interfaces/factories/customer-factory';
import { ICustomerWriteRepository } from '@customer/domain/interfaces/repositories/customer-write';
import { Customer } from '@customer/domain/aggregates/customer';
import { CustomerNotFoundException } from '@customer/domain/exceptions/customer-not-found';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';

/**
 * Unit tests for UpdateCustomerNameHandler
 *
 * Tests the handler logic for updating customer names including:
 * - Successful name updates
 * - Error handling for non-existent customers
 * - Proper interaction with factory and repository
 *
 * **Validates: Requirements 2.2, 2.3, 6.3**
 */
describe('UpdateCustomerNameHandler', () => {
  let handler: UpdateCustomerNameHandler;
  let mockFactory: jest.Mocked<ICustomerFactory>;
  let mockWriteRepo: jest.Mocked<ICustomerWriteRepository>;

  beforeEach(async () => {
    // Create mocks
    mockFactory = {
      loadById: jest.fn(),
      loadByWhatsAppPhone: jest.fn(),
    } as jest.Mocked<ICustomerFactory>;

    mockWriteRepo = {
      save: jest.fn(),
    } as jest.Mocked<ICustomerWriteRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCustomerNameHandler,
        {
          provide: 'ICustomerFactory',
          useValue: mockFactory,
        },
        {
          provide: 'ICustomerWriteRepository',
          useValue: mockWriteRepo,
        },
      ],
    }).compile();

    handler = module.get<UpdateCustomerNameHandler>(UpdateCustomerNameHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update customer name successfully', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095551234');

      const customer = Customer.createAnonymous(
        UUID.fromString(customerId),
        businessId,
        phone,
        'Old Name',
      );

      mockFactory.loadById.mockResolvedValue(customer);
      mockWriteRepo.save.mockResolvedValue();

      const command = new UpdateCustomerNameCommand(customerId, 'New Name');

      // Act
      await handler.execute(command);

      // Assert
      expect(mockFactory.loadById).toHaveBeenCalledWith(customerId);
      expect(mockWriteRepo.save).toHaveBeenCalledWith(customer);
      expect(customer.getName()).toBe('New Name');
    });

    it('should throw CustomerNotFoundException when customer does not exist', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      mockFactory.loadById.mockResolvedValue(null);

      const command = new UpdateCustomerNameCommand(customerId, 'New Name');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CustomerNotFoundException);
      expect(mockFactory.loadById).toHaveBeenCalledWith(customerId);
      expect(mockWriteRepo.save).not.toHaveBeenCalled();
    });

    it('should throw InvalidCustomerNameException for empty name', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095555678');

      const customer = Customer.createAnonymous(
        UUID.fromString(customerId),
        businessId,
        phone,
        'Old Name',
      );

      mockFactory.loadById.mockResolvedValue(customer);

      const command = new UpdateCustomerNameCommand(customerId, '');

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow();
      expect(mockWriteRepo.save).not.toHaveBeenCalled();
    });

    it('should increment version when updating name', async () => {
      // Arrange
      const customerId = UUID.generate().getValue();
      const businessId = UUID.generate();
      const phone = WhatsAppPhone.fromString('+18095559999');

      const customer = Customer.createAnonymous(
        UUID.fromString(customerId),
        businessId,
        phone,
        'Old Name',
      );

      const initialVersion = customer.getVersion().getValue();

      mockFactory.loadById.mockResolvedValue(customer);
      mockWriteRepo.save.mockResolvedValue();

      const command = new UpdateCustomerNameCommand(customerId, 'New Name');

      // Act
      await handler.execute(command);

      // Assert
      expect(customer.getVersion().getValue()).toBe(initialVersion + 1);
    });
  });
});
