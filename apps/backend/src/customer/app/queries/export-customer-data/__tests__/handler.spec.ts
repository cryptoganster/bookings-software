import { Test, TestingModule } from '@nestjs/testing';
import { ExportCustomerDataHandler } from '../handler';
import { ExportCustomerDataQuery, CustomerDataExport } from '../query';
import { ICustomerReadRepository } from '@customer/domain/interfaces/repositories/customer-read';
import { CustomerNotFoundException } from '@customer/domain/exceptions';

describe('ExportCustomerDataHandler', () => {
  let handler: ExportCustomerDataHandler;
  let customerReadRepository: jest.Mocked<ICustomerReadRepository>;

  const mockCustomerId = '550e8400-e29b-41d4-a716-446655440001';
  const mockBusinessId = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(async () => {
    // Create mocks
    customerReadRepository = {
      findById: jest.fn(),
      findByBusinessId: jest.fn(),
      findByWhatsAppPhone: jest.fn(),
      findByUserId: jest.fn(),
      getFullData: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportCustomerDataHandler,
        {
          provide: 'ICustomerReadRepository',
          useValue: customerReadRepository,
        },
      ],
    }).compile();

    handler = module.get<ExportCustomerDataHandler>(ExportCustomerDataHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should export customer data with appointments and conversations', async () => {
      // Arrange
      const mockExportData: CustomerDataExport = {
        customer: {
          id: mockCustomerId,
          name: 'John Doe',
          whatsappPhone: '+18095551234',
          createdAt: '2024-01-01T10:00:00.000Z',
          updatedAt: '2024-01-15T14:30:00.000Z',
        },
        appointments: [
          {
            id: 'apt-1',
            offeringName: 'Haircut',
            dateTime: '2024-02-01T10:00:00.000Z',
            status: 'CONFIRMED',
            createdAt: '2024-01-20T09:00:00.000Z',
          },
          {
            id: 'apt-2',
            offeringName: 'Consultation',
            dateTime: '2024-01-10T14:00:00.000Z',
            status: 'COMPLETED',
            createdAt: '2024-01-05T11:00:00.000Z',
          },
        ],
        conversations: [
          {
            id: 'conv-1',
            messages: [
              {
                content: 'Hello, I want to book an appointment',
                direction: 'INBOUND',
                sentAt: '2024-01-20T08:55:00.000Z',
              },
              {
                content: 'Sure! What service would you like?',
                direction: 'OUTBOUND',
                sentAt: '2024-01-20T08:56:00.000Z',
              },
            ],
          },
        ],
        exportedAt: '2024-01-01T00:00:00.000Z',
      };

      customerReadRepository.getFullData.mockResolvedValue(mockExportData);

      const query = new ExportCustomerDataQuery(mockCustomerId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(customerReadRepository.getFullData).toHaveBeenCalledWith(mockCustomerId);
      expect(result).toEqual(mockExportData);
      expect(result.customer.id).toBe(mockCustomerId);
      expect(result.customer.name).toBe('John Doe');
      expect(result.appointments).toHaveLength(2);
      expect(result.conversations).toHaveLength(1);
    });

    it('should export customer data with no appointments or conversations', async () => {
      // Arrange
      const mockExportData: CustomerDataExport = {
        customer: {
          id: mockCustomerId,
          name: 'Jane Smith',
          whatsappPhone: '+18095555678',
          createdAt: '2024-01-15T12:00:00.000Z',
          updatedAt: '2024-01-15T12:00:00.000Z',
        },
        appointments: [], // Empty array
        conversations: [], // Empty array
        exportedAt: '2024-01-15T12:00:00.000Z',
      };

      customerReadRepository.getFullData.mockResolvedValue(mockExportData);

      const query = new ExportCustomerDataQuery(mockCustomerId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(customerReadRepository.getFullData).toHaveBeenCalledWith(mockCustomerId);
      expect(result).toEqual(mockExportData);
      expect(result.appointments).toEqual([]);
      expect(result.conversations).toEqual([]);
    });

    it('should export anonymous customer data (name is null)', async () => {
      // Arrange
      const mockExportData: CustomerDataExport = {
        customer: {
          id: mockCustomerId,
          name: null, // Anonymous customer
          whatsappPhone: '+18095559999',
          createdAt: '2024-01-10T08:00:00.000Z',
          updatedAt: '2024-01-10T08:00:00.000Z',
        },
        appointments: [
          {
            id: 'apt-3',
            offeringName: 'Quick Service',
            dateTime: '2024-01-12T10:00:00.000Z',
            status: 'COMPLETED',
            createdAt: '2024-01-10T08:05:00.000Z',
          },
        ],
        conversations: [],
        exportedAt: '2024-01-10T08:00:00.000Z',
      };

      customerReadRepository.getFullData.mockResolvedValue(mockExportData);

      const query = new ExportCustomerDataQuery(mockCustomerId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.customer.name).toBeNull();
      expect(result.customer.whatsappPhone).toBe('+18095559999');
    });

    it('should format all dates in ISO 8601 format', async () => {
      // Arrange
      const mockExportData: CustomerDataExport = {
        customer: {
          id: mockCustomerId,
          name: 'Date Test Customer',
          whatsappPhone: '+18095551111',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T12:30:45.123Z',
        },
        appointments: [
          {
            id: 'apt-4',
            offeringName: 'Service',
            dateTime: '2024-02-15T14:00:00.000Z',
            status: 'CONFIRMED',
            createdAt: '2024-01-20T10:15:30.456Z',
          },
        ],
        conversations: [
          {
            id: 'conv-2',
            messages: [
              {
                content: 'Test message',
                direction: 'INBOUND',
                sentAt: '2024-01-20T10:00:00.789Z',
              },
            ],
          },
        ],
        exportedAt: '2024-01-20T10:00:00.000Z',
      };

      customerReadRepository.getFullData.mockResolvedValue(mockExportData);

      const query = new ExportCustomerDataQuery(mockCustomerId);

      // Act
      const result = await handler.execute(query);

      // Assert
      // Verify ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
      expect(result.customer.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result.customer.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result.appointments[0].dateTime).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(result.appointments[0].createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(result.conversations[0].messages[0].sentAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should exclude internal system fields', async () => {
      // Arrange
      const mockExportData: CustomerDataExport = {
        customer: {
          id: mockCustomerId,
          name: 'Field Test Customer',
          whatsappPhone: '+18095552222',
          createdAt: '2024-01-01T10:00:00.000Z',
          updatedAt: '2024-01-01T10:00:00.000Z',
        },
        appointments: [
          {
            id: 'apt-5',
            offeringName: 'Service Name',
            dateTime: '2024-02-01T10:00:00.000Z',
            status: 'CONFIRMED',
            createdAt: '2024-01-20T09:00:00.000Z',
          },
        ],
        conversations: [],
        exportedAt: '2024-01-20T09:00:00.000Z',
      };

      customerReadRepository.getFullData.mockResolvedValue(mockExportData);

      const query = new ExportCustomerDataQuery(mockCustomerId);

      // Act
      const result = await handler.execute(query);

      // Assert
      // Verify that internal fields are NOT present
      expect(result.customer).not.toHaveProperty('version');
      expect(result.customer).not.toHaveProperty('businessId');
      expect(result.customer).not.toHaveProperty('userId');

      expect(result.appointments[0]).not.toHaveProperty('version');
      expect(result.appointments[0]).not.toHaveProperty('businessId');
      expect(result.appointments[0]).not.toHaveProperty('customerId');
      expect(result.appointments[0]).not.toHaveProperty('offeringId');

      // Verify that only expected fields are present
      expect(Object.keys(result.customer)).toEqual([
        'id',
        'name',
        'whatsappPhone',
        'createdAt',
        'updatedAt',
      ]);
      expect(Object.keys(result.appointments[0])).toEqual([
        'id',
        'offeringName',
        'dateTime',
        'status',
        'createdAt',
      ]);
    });

    it('should throw CustomerNotFoundException when customer does not exist', async () => {
      // Arrange
      customerReadRepository.getFullData.mockRejectedValue(
        new CustomerNotFoundException(mockCustomerId),
      );

      const query = new ExportCustomerDataQuery(mockCustomerId);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(CustomerNotFoundException);
      expect(customerReadRepository.getFullData).toHaveBeenCalledWith(mockCustomerId);
    });

    it('should export customer with multiple appointments in chronological order', async () => {
      // Arrange
      const mockExportData: CustomerDataExport = {
        customer: {
          id: mockCustomerId,
          name: 'Multi Appointment Customer',
          whatsappPhone: '+18095553333',
          createdAt: '2024-01-01T10:00:00.000Z',
          updatedAt: '2024-01-01T10:00:00.000Z',
        },
        appointments: [
          {
            id: 'apt-6',
            offeringName: 'Service 1',
            dateTime: '2024-01-10T10:00:00.000Z',
            status: 'COMPLETED',
            createdAt: '2024-01-05T09:00:00.000Z',
          },
          {
            id: 'apt-7',
            offeringName: 'Service 2',
            dateTime: '2024-02-15T14:00:00.000Z',
            status: 'CONFIRMED',
            createdAt: '2024-01-20T11:00:00.000Z',
          },
          {
            id: 'apt-8',
            offeringName: 'Service 3',
            dateTime: '2024-03-01T09:00:00.000Z',
            status: 'CONFIRMED',
            createdAt: '2024-02-01T08:00:00.000Z',
          },
        ],
        conversations: [],
        exportedAt: '2024-02-01T08:00:00.000Z',
      };

      customerReadRepository.getFullData.mockResolvedValue(mockExportData);

      const query = new ExportCustomerDataQuery(mockCustomerId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.appointments).toHaveLength(3);
      expect(result.appointments[0].id).toBe('apt-6');
      expect(result.appointments[1].id).toBe('apt-7');
      expect(result.appointments[2].id).toBe('apt-8');
    });

    it('should export customer with multiple conversations and messages', async () => {
      // Arrange
      const mockExportData: CustomerDataExport = {
        customer: {
          id: mockCustomerId,
          name: 'Multi Conversation Customer',
          whatsappPhone: '+18095554444',
          createdAt: '2024-01-01T10:00:00.000Z',
          updatedAt: '2024-01-01T10:00:00.000Z',
        },
        appointments: [],
        conversations: [
          {
            id: 'conv-3',
            messages: [
              {
                content: 'First conversation message 1',
                direction: 'INBOUND',
                sentAt: '2024-01-10T10:00:00.000Z',
              },
              {
                content: 'First conversation message 2',
                direction: 'OUTBOUND',
                sentAt: '2024-01-10T10:01:00.000Z',
              },
            ],
          },
          {
            id: 'conv-4',
            messages: [
              {
                content: 'Second conversation message 1',
                direction: 'INBOUND',
                sentAt: '2024-01-15T14:00:00.000Z',
              },
              {
                content: 'Second conversation message 2',
                direction: 'OUTBOUND',
                sentAt: '2024-01-15T14:01:00.000Z',
              },
              {
                content: 'Second conversation message 3',
                direction: 'INBOUND',
                sentAt: '2024-01-15T14:02:00.000Z',
              },
            ],
          },
        ],
        exportedAt: '2024-01-15T14:02:00.000Z',
      };

      customerReadRepository.getFullData.mockResolvedValue(mockExportData);

      const query = new ExportCustomerDataQuery(mockCustomerId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.conversations).toHaveLength(2);
      expect(result.conversations[0].messages).toHaveLength(2);
      expect(result.conversations[1].messages).toHaveLength(3);
      expect(result.conversations[0].messages[0].direction).toBe('INBOUND');
      expect(result.conversations[0].messages[1].direction).toBe('OUTBOUND');
    });

    it('should handle deleted customer data (anonymized)', async () => {
      // Arrange
      const mockExportData: CustomerDataExport = {
        customer: {
          id: mockCustomerId,
          name: null, // Anonymized
          whatsappPhone: '+9991234567890', // Deleted phone format
          createdAt: '2024-01-01T10:00:00.000Z',
          updatedAt: '2024-02-01T15:00:00.000Z', // Updated when deleted
        },
        appointments: [
          {
            id: 'apt-9',
            offeringName: 'Past Service',
            dateTime: '2024-01-15T10:00:00.000Z',
            status: 'COMPLETED',
            createdAt: '2024-01-10T09:00:00.000Z',
          },
        ],
        conversations: [],
        exportedAt: '2024-02-01T15:00:00.000Z',
      };

      customerReadRepository.getFullData.mockResolvedValue(mockExportData);

      const query = new ExportCustomerDataQuery(mockCustomerId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.customer.name).toBeNull();
      expect(result.customer.whatsappPhone).toMatch(/^\+999\d{10}$/);
      expect(result.appointments).toHaveLength(1); // Past appointments still present
    });
  });
});
