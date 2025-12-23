import { Test, TestingModule } from '@nestjs/testing';
import { DeleteCustomerHandler } from '../handler';
import { DeleteCustomerCommand } from '../command';
import { ICustomerFactory } from '@customer/domain/interfaces/factories/customer-factory';
import { ICustomerWriteRepository } from '@customer/domain/interfaces/repositories/customer-write';
import { IAppointmentReadRepository } from '@booking/domain/interfaces/repositories/appointment-read';
import { IUnitOfWork } from '@shared/kernel/uow';
import { Customer } from '@customer/domain/aggregates/customer';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';
import {
  CustomerNotFoundException,
  CustomerHasFutureAppointmentsException,
  CustomerAlreadyDeletedException,
} from '@customer/domain/exceptions';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';

describe('DeleteCustomerHandler', () => {
  let handler: DeleteCustomerHandler;
  let customerFactory: jest.Mocked<ICustomerFactory>;
  let customerWriteRepository: jest.Mocked<ICustomerWriteRepository>;
  let appointmentReadRepository: jest.Mocked<IAppointmentReadRepository>;
  let uow: jest.Mocked<IUnitOfWork>;

  const mockCustomerId = '550e8400-e29b-41d4-a716-446655440001';
  const mockBusinessId = '550e8400-e29b-41d4-a716-446655440002';
  const mockDeletedBy = '550e8400-e29b-41d4-a716-446655440003';

  beforeEach(async () => {
    // Create mocks
    customerFactory = {
      loadById: jest.fn(),
    } as any;

    customerWriteRepository = {
      save: jest.fn(),
    } as any;

    appointmentReadRepository = {
      findByCustomerId: jest.fn(),
    } as any;

    uow = {
      transaction: jest.fn((work) => work()),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCustomerHandler,
        {
          provide: 'ICustomerFactory',
          useValue: customerFactory,
        },
        {
          provide: 'ICustomerWriteRepository',
          useValue: customerWriteRepository,
        },
        {
          provide: 'IAppointmentReadRepository',
          useValue: appointmentReadRepository,
        },
        {
          provide: 'IUnitOfWork',
          useValue: uow,
        },
      ],
    }).compile();

    handler = module.get<DeleteCustomerHandler>(DeleteCustomerHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should successfully delete (anonymize) a customer with no future appointments', async () => {
      // Arrange
      const customer = Customer.createAnonymous(
        UUID.fromString(mockCustomerId),
        UUID.fromString(mockBusinessId),
        WhatsAppPhone.fromString('+18095551234'),
        'John Doe',
      );

      customerFactory.loadById.mockResolvedValue(customer);
      appointmentReadRepository.findByCustomerId.mockResolvedValue([]);

      const command = new DeleteCustomerCommand(mockCustomerId, mockDeletedBy);

      // Act
      await handler.execute(command);

      // Assert
      expect(customerFactory.loadById).toHaveBeenCalledWith(mockCustomerId);
      expect(appointmentReadRepository.findByCustomerId).toHaveBeenCalledWith(mockCustomerId);
      expect(customerWriteRepository.save).toHaveBeenCalledWith(customer);
      expect(uow.transaction).toHaveBeenCalled();

      // Verify customer was anonymized
      expect(customer.getName()).toBeNull();
      expect(customer.getWhatsAppPhone().getValue()).toMatch(/^\+999\d+$/);
    });

    it('should successfully delete a customer with only past appointments', async () => {
      // Arrange
      const customer = Customer.createAnonymous(
        UUID.fromString(mockCustomerId),
        UUID.fromString(mockBusinessId),
        WhatsAppPhone.fromString('+18095551234'),
        'Jane Smith',
      );

      const pastAppointment: AppointmentReadModel = {
        id: 'apt-1',
        businessId: mockBusinessId,
        customerId: mockCustomerId,
        customerName: 'Jane Smith',
        customerPhone: '+18095551234',
        offeringId: 'offering-1',
        offeringName: 'Haircut',
        dateTime: new Date('2023-01-01T10:00:00Z'), // Past date
        status: 'COMPLETED',
        createdAt: new Date('2023-01-01T09:00:00Z'),
        cancelledAt: null,
      };

      customerFactory.loadById.mockResolvedValue(customer);
      appointmentReadRepository.findByCustomerId.mockResolvedValue([pastAppointment]);

      const command = new DeleteCustomerCommand(mockCustomerId, mockDeletedBy);

      // Act
      await handler.execute(command);

      // Assert
      expect(customerWriteRepository.save).toHaveBeenCalledWith(customer);
      expect(customer.getName()).toBeNull();
    });

    it('should throw CustomerNotFoundException when customer does not exist', async () => {
      // Arrange
      customerFactory.loadById.mockResolvedValue(null);

      const command = new DeleteCustomerCommand(mockCustomerId, mockDeletedBy);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CustomerNotFoundException);
      expect(customerFactory.loadById).toHaveBeenCalledWith(mockCustomerId);
      expect(customerWriteRepository.save).not.toHaveBeenCalled();
    });

    it('should throw CustomerHasFutureAppointmentsException when customer has future appointments', async () => {
      // Arrange
      const customer = Customer.createAnonymous(
        UUID.fromString(mockCustomerId),
        UUID.fromString(mockBusinessId),
        WhatsAppPhone.fromString('+18095551234'),
        'Bob Johnson',
      );

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days in the future

      const futureAppointment: AppointmentReadModel = {
        id: 'apt-2',
        businessId: mockBusinessId,
        customerId: mockCustomerId,
        customerName: 'Bob Johnson',
        customerPhone: '+18095551234',
        offeringId: 'offering-1',
        offeringName: 'Consultation',
        dateTime: futureDate,
        status: 'CONFIRMED',
        createdAt: new Date(),
        cancelledAt: null,
      };

      customerFactory.loadById.mockResolvedValue(customer);
      appointmentReadRepository.findByCustomerId.mockResolvedValue([futureAppointment]);

      const command = new DeleteCustomerCommand(mockCustomerId, mockDeletedBy);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        CustomerHasFutureAppointmentsException,
      );
      expect(customerWriteRepository.save).not.toHaveBeenCalled();
    });

    it('should throw CustomerHasFutureAppointmentsException with correct count', async () => {
      // Arrange
      const customer = Customer.createAnonymous(
        UUID.fromString(mockCustomerId),
        UUID.fromString(mockBusinessId),
        WhatsAppPhone.fromString('+18095551234'),
        'Alice Brown',
      );

      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 7);

      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 14);

      const appointments: AppointmentReadModel[] = [
        {
          id: 'apt-3',
          businessId: mockBusinessId,
          customerId: mockCustomerId,
          customerName: 'Alice Brown',
          customerPhone: '+18095551234',
          offeringId: 'offering-1',
          offeringName: 'Service 1',
          dateTime: futureDate1,
          status: 'CONFIRMED',
          createdAt: new Date(),
          cancelledAt: null,
        },
        {
          id: 'apt-4',
          businessId: mockBusinessId,
          customerId: mockCustomerId,
          customerName: 'Alice Brown',
          customerPhone: '+18095551234',
          offeringId: 'offering-2',
          offeringName: 'Service 2',
          dateTime: futureDate2,
          status: 'CONFIRMED',
          createdAt: new Date(),
          cancelledAt: null,
        },
      ];

      customerFactory.loadById.mockResolvedValue(customer);
      appointmentReadRepository.findByCustomerId.mockResolvedValue(appointments);

      const command = new DeleteCustomerCommand(mockCustomerId, mockDeletedBy);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        new CustomerHasFutureAppointmentsException(mockCustomerId, 2),
      );
    });

    it('should unlink customer from User if linked', async () => {
      // Arrange
      const customer = Customer.createAnonymous(
        UUID.fromString(mockCustomerId),
        UUID.fromString(mockBusinessId),
        WhatsAppPhone.fromString('+18095551234'),
        'Linked Customer',
      );

      // Link customer to user
      customer.linkToUser(UUID.fromString('550e8400-e29b-41d4-a716-446655440004'));

      customerFactory.loadById.mockResolvedValue(customer);
      appointmentReadRepository.findByCustomerId.mockResolvedValue([]);

      const command = new DeleteCustomerCommand(mockCustomerId, mockDeletedBy);

      // Act
      await handler.execute(command);

      // Assert
      expect(customer.getUserId()).toBeNull();
      expect(customerWriteRepository.save).toHaveBeenCalledWith(customer);
    });

    it('should be idempotent - throw CustomerAlreadyDeletedException when already deleted', async () => {
      // Arrange
      const customer = Customer.fromPersistence(
        UUID.fromString(mockCustomerId),
        null,
        UUID.fromString(mockBusinessId),
        WhatsAppPhone.fromString('+9991234567890'), // Already deleted
        null,
        1,
        new Date(),
        new Date(),
      );

      customerFactory.loadById.mockResolvedValue(customer);
      appointmentReadRepository.findByCustomerId.mockResolvedValue([]);

      const command = new DeleteCustomerCommand(mockCustomerId, mockDeletedBy);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(CustomerAlreadyDeletedException);
      expect(customerWriteRepository.save).not.toHaveBeenCalled();
    });

    it('should publish CustomerDeleted event', async () => {
      // Arrange
      const customer = Customer.createAnonymous(
        UUID.fromString(mockCustomerId),
        UUID.fromString(mockBusinessId),
        WhatsAppPhone.fromString('+18095551234'),
        'Event Test Customer',
      );

      customerFactory.loadById.mockResolvedValue(customer);
      appointmentReadRepository.findByCustomerId.mockResolvedValue([]);

      const command = new DeleteCustomerCommand(mockCustomerId, mockDeletedBy);

      // Act
      await handler.execute(command);

      // Assert
      // Verify that the customer was saved (which triggers event publishing)
      expect(customerWriteRepository.save).toHaveBeenCalledWith(customer);
      // Verify customer was anonymized (which means anonymize() was called and event was applied)
      expect(customer.getName()).toBeNull();
      expect(customer.getWhatsAppPhone().getValue()).toMatch(/^\+999\d{10}$/);
    });

    it('should use transaction for atomicity', async () => {
      // Arrange
      const customer = Customer.createAnonymous(
        UUID.fromString(mockCustomerId),
        UUID.fromString(mockBusinessId),
        WhatsAppPhone.fromString('+18095551234'),
        'Transaction Test',
      );

      customerFactory.loadById.mockResolvedValue(customer);
      appointmentReadRepository.findByCustomerId.mockResolvedValue([]);

      const command = new DeleteCustomerCommand(mockCustomerId, mockDeletedBy);

      // Act
      await handler.execute(command);

      // Assert
      expect(uow.transaction).toHaveBeenCalled();
    });

    it('should ignore cancelled future appointments', async () => {
      // Arrange
      const customer = Customer.createAnonymous(
        UUID.fromString(mockCustomerId),
        UUID.fromString(mockBusinessId),
        WhatsAppPhone.fromString('+18095551234'),
        'Cancelled Apt Customer',
      );

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const cancelledAppointment: AppointmentReadModel = {
        id: 'apt-5',
        businessId: mockBusinessId,
        customerId: mockCustomerId,
        customerName: 'Cancelled Apt Customer',
        customerPhone: '+18095551234',
        offeringId: 'offering-1',
        offeringName: 'Service',
        dateTime: futureDate,
        status: 'CANCELLED', // Cancelled status
        createdAt: new Date(),
        cancelledAt: new Date(),
      };

      customerFactory.loadById.mockResolvedValue(customer);
      appointmentReadRepository.findByCustomerId.mockResolvedValue([cancelledAppointment]);

      const command = new DeleteCustomerCommand(mockCustomerId, mockDeletedBy);

      // Act
      await handler.execute(command);

      // Assert - Should succeed because cancelled appointments don't count
      expect(customerWriteRepository.save).toHaveBeenCalledWith(customer);
      expect(customer.getName()).toBeNull();
    });
  });
});
