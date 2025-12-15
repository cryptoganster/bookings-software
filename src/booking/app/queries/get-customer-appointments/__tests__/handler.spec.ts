import { Test, TestingModule } from '@nestjs/testing';
import { GetCustomerAppointmentsHandler } from '../handler';
import { GetCustomerAppointmentsQuery } from '../query';
import { IAppointmentReadRepository } from '@booking/domain/interfaces/repositories/appointment-read';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';

describe('GetCustomerAppointmentsHandler', () => {
  let handler: GetCustomerAppointmentsHandler;
  let mockReadRepository: jest.Mocked<IAppointmentReadRepository>;

  beforeEach(async () => {
    mockReadRepository = {
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByBusinessId: jest.fn(),
      findUpcoming: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCustomerAppointmentsHandler,
        {
          provide: 'IAppointmentReadRepository',
          useValue: mockReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetCustomerAppointmentsHandler>(GetCustomerAppointmentsHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should return list of appointments for customer', async () => {
    // Arrange
    const customerId = 'customer-123';
    const mockAppointments: AppointmentReadModel[] = [
      {
        id: 'appointment-1',
        businessId: 'business-1',
        customerId: customerId,
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        offeringId: 'offering-1',
        offeringName: 'Haircut',
        dateTime: new Date('2024-12-20T10:00:00Z'),
        status: 'CONFIRMED',
        createdAt: new Date('2024-12-14T10:00:00Z'),
        cancelledAt: null,
      },
      {
        id: 'appointment-2',
        businessId: 'business-1',
        customerId: customerId,
        customerName: 'John Doe',
        customerPhone: '+1234567890',
        offeringId: 'offering-2',
        offeringName: 'Shave',
        dateTime: new Date('2024-12-21T14:00:00Z'),
        status: 'CONFIRMED',
        createdAt: new Date('2024-12-14T11:00:00Z'),
        cancelledAt: null,
      },
    ];

    mockReadRepository.findByCustomerId.mockResolvedValue(mockAppointments);

    // Act
    const query = new GetCustomerAppointmentsQuery(customerId);
    const result = await handler.execute(query);

    // Assert
    expect(result).toEqual(mockAppointments);
    expect(result).toHaveLength(2);
    expect(mockReadRepository.findByCustomerId).toHaveBeenCalledWith(customerId);
    expect(mockReadRepository.findByCustomerId).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when customer has no appointments', async () => {
    // Arrange
    const customerId = 'customer-without-appointments';
    mockReadRepository.findByCustomerId.mockResolvedValue([]);

    // Act
    const query = new GetCustomerAppointmentsQuery(customerId);
    const result = await handler.execute(query);

    // Assert
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
    expect(mockReadRepository.findByCustomerId).toHaveBeenCalledWith(customerId);
  });
});
