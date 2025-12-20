import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ForbiddenException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { CustomerCrudController } from '../customer-crud';
import { GetCustomerQuery } from '@customer/app/queries/get-customer/query';
import { GetCustomersByUserIdQuery } from '@customer/app/queries/get-customers-by-user-id/query';
import { ExportCustomerDataQuery } from '@customer/app/queries/export-customer-data/query';
import { DeleteCustomerCommand } from '@customer/app/commands/delete-customer/command';
import { UserPayload } from '@auth/presentation/decorators/current-user';

describe('CustomerCrudController', () => {
  let controller: CustomerCrudController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let logger: jest.Mocked<PinoLogger>;

  const mockUser: UserPayload = {
    userId: 'user-123',
    businessId: 'business-123',
    email: 'test@example.com',
  };

  const mockCustomer = {
    id: 'customer-123',
    businessId: 'business-123',
    userId: null,
    whatsappPhone: '+1234567890',
    name: 'John Doe',
    createdAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockCommandBus = {
      execute: jest.fn(),
    };

    const mockQueryBus = {
      execute: jest.fn(),
    };

    const mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerCrudController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
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

    controller = module.get<CustomerCrudController>(CustomerCrudController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
    logger = module.get(PinoLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getById', () => {
    it('should get customer by id successfully', async () => {
      queryBus.execute.mockResolvedValue(mockCustomer);

      const result = await controller.getById('customer-123', mockUser);

      expect(queryBus.execute).toHaveBeenCalledWith(new GetCustomerQuery('customer-123'));
      expect(result.id).toBe('customer-123');
      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should throw ForbiddenException when customer belongs to different business', async () => {
      const differentBusinessCustomer = { ...mockCustomer, businessId: 'business-999' };
      queryBus.execute.mockResolvedValue(differentBusinessCustomer);

      await expect(controller.getById('customer-123', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.getById('customer-123', mockUser)).rejects.toThrow('Access denied');
    });

    it('should log start, complete, and track duration', async () => {
      queryBus.execute.mockResolvedValue(mockCustomer);

      await controller.getById('customer-123', mockUser);

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'get_customer_by_id_start' }),
        'Starting customer retrieval by ID',
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'get_customer_by_id_complete',
          duration: expect.any(Number),
        }),
        'Customer retrieved successfully',
      );
    });

    it('should log error when query fails', async () => {
      const error = new Error('Query failed');
      queryBus.execute.mockRejectedValue(error);

      try {
        await controller.getById('customer-123', mockUser);
      } catch (err) {
        // Expected
      }

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'get_customer_by_id_error',
          error: 'Query failed',
          stack: expect.any(String),
        }),
        'Customer retrieval failed',
      );
    });
  });

  describe('getByUserId', () => {
    it('should get customers by user id successfully', async () => {
      const customers = [mockCustomer];
      queryBus.execute.mockResolvedValue(customers);

      const result = await controller.getByUserId('user-123', mockUser);

      expect(queryBus.execute).toHaveBeenCalledWith(new GetCustomersByUserIdQuery('user-123'));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('customer-123');
    });

    it('should throw ForbiddenException when requesting different users customers', async () => {
      await expect(controller.getByUserId('user-999', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.getByUserId('user-999', mockUser)).rejects.toThrow('Access denied');
    });

    it('should log start, complete, and track duration', async () => {
      queryBus.execute.mockResolvedValue([mockCustomer]);

      await controller.getByUserId('user-123', mockUser);

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'get_customers_by_user_id_start' }),
        'Starting customer retrieval by user ID',
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'get_customers_by_user_id_complete',
          customersFound: 1,
          duration: expect.any(Number),
        }),
        'Customers retrieved successfully by user ID',
      );
    });
  });

  describe('exportData', () => {
    const mockExportData = {
      customer: mockCustomer,
      appointments: [],
      conversations: [],
    };

    it('should export customer data successfully', async () => {
      queryBus.execute.mockResolvedValueOnce(mockCustomer).mockResolvedValueOnce(mockExportData);

      const result = await controller.exportData('customer-123', mockUser);

      expect(queryBus.execute).toHaveBeenCalledWith(new GetCustomerQuery('customer-123'));
      expect(queryBus.execute).toHaveBeenCalledWith(new ExportCustomerDataQuery('customer-123'));
      expect(result).toEqual(mockExportData);
    });

    it('should throw ForbiddenException when customer belongs to different business', async () => {
      const differentBusinessCustomer = { ...mockCustomer, businessId: 'business-999' };
      queryBus.execute.mockResolvedValue(differentBusinessCustomer);

      await expect(controller.exportData('customer-123', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should log start, complete with counts, and track duration', async () => {
      queryBus.execute.mockResolvedValueOnce(mockCustomer).mockResolvedValueOnce(mockExportData);

      await controller.exportData('customer-123', mockUser);

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'export_customer_data_start' }),
        'Starting customer data export (GDPR)',
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'export_customer_data_complete',
          appointmentsCount: 0,
          conversationsCount: 0,
          duration: expect.any(Number),
        }),
        'Customer data exported successfully',
      );
    });
  });

  describe('delete', () => {
    it('should delete customer successfully', async () => {
      queryBus.execute.mockResolvedValue(mockCustomer);
      commandBus.execute.mockResolvedValue(undefined);

      const result = await controller.delete('customer-123', mockUser);

      expect(queryBus.execute).toHaveBeenCalledWith(new GetCustomerQuery('customer-123'));
      expect(commandBus.execute).toHaveBeenCalledWith(
        new DeleteCustomerCommand('customer-123', 'user-123'),
      );
      expect(result).toEqual({ message: 'Customer deleted successfully' });
    });

    it('should throw ForbiddenException when customer belongs to different business', async () => {
      const differentBusinessCustomer = { ...mockCustomer, businessId: 'business-999' };
      queryBus.execute.mockResolvedValue(differentBusinessCustomer);

      await expect(controller.delete('customer-123', mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('should log start, complete, and track duration', async () => {
      queryBus.execute.mockResolvedValue(mockCustomer);
      commandBus.execute.mockResolvedValue(undefined);

      await controller.delete('customer-123', mockUser);

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'delete_customer_start' }),
        'Starting customer deletion (GDPR anonymization)',
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'delete_customer_complete',
          duration: expect.any(Number),
        }),
        'Customer deleted (anonymized) successfully',
      );
    });

    it('should log error when command fails', async () => {
      queryBus.execute.mockResolvedValue(mockCustomer);
      const error = new Error('Command failed');
      commandBus.execute.mockRejectedValue(error);

      try {
        await controller.delete('customer-123', mockUser);
      } catch (err) {
        // Expected
      }

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'delete_customer_error',
          error: 'Command failed',
          stack: expect.any(String),
        }),
        'Customer deletion failed',
      );
    });
  });
});
