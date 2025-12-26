import { Test, TestingModule } from '@nestjs/testing';
import { GetTodayAppointmentsHandler } from '../handler';
import { GetTodayAppointmentsQuery } from '../query';
import { IAppointmentReadRepository } from '@booking/domain/interfaces/repositories/appointment-read';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';

describe('GetTodayAppointmentsHandler', () => {
  let handler: GetTodayAppointmentsHandler;
  let mockReadRepository: jest.Mocked<IAppointmentReadRepository>;

  beforeEach(async () => {
    mockReadRepository = {
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByBusinessId: jest.fn(),
      findUpcoming: jest.fn(),
      findToday: jest.fn(),
      findByBusinessAndDateRange: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTodayAppointmentsHandler,
        {
          provide: 'IAppointmentReadRepository',
          useValue: mockReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetTodayAppointmentsHandler>(GetTodayAppointmentsHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should return all appointments for today', async () => {
    // Arrange
    const businessId = 'business-1';
    const today = new Date();
    const mockAppointments: AppointmentReadModel[] = [
      {
        id: 'appointment-1',
        businessId,
        customerId: 'customer-1',
        customerName: 'Jane Smith',
        customerPhone: '+9876543210',
        offeringId: 'offering-1',
        offeringName: 'Massage',
        dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0),
        status: 'CONFIRMED',
        createdAt: new Date('2024-12-14T12:00:00Z'),
        cancelledAt: null,
      },
      {
        id: 'appointment-2',
        businessId,
        customerId: 'customer-2',
        customerName: 'Bob Johnson',
        customerPhone: '+1122334455',
        offeringId: 'offering-2',
        offeringName: 'Consultation',
        dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0, 0),
        status: 'CONFIRMED',
        createdAt: new Date('2024-12-14T08:00:00Z'),
        cancelledAt: null,
      },
    ];

    mockReadRepository.findToday.mockResolvedValue(mockAppointments);

    // Act
    const query = new GetTodayAppointmentsQuery(businessId);
    const result = await handler.execute(query);

    // Assert
    expect(result).toEqual(mockAppointments);
    expect(result).toHaveLength(2);
    expect(mockReadRepository.findToday).toHaveBeenCalledWith(businessId);
    expect(mockReadRepository.findToday).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no appointments today', async () => {
    // Arrange
    const businessId = 'business-1';
    mockReadRepository.findToday.mockResolvedValue([]);

    // Act
    const query = new GetTodayAppointmentsQuery(businessId);
    const result = await handler.execute(query);

    // Assert
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
    expect(mockReadRepository.findToday).toHaveBeenCalledWith(businessId);
  });

  it('should return only confirmed appointments for today', async () => {
    // Arrange
    const businessId = 'business-1';
    const today = new Date();
    const mockAppointments: AppointmentReadModel[] = [
      {
        id: 'appointment-1',
        businessId,
        customerId: 'customer-1',
        customerName: 'Jane Smith',
        customerPhone: '+9876543210',
        offeringId: 'offering-1',
        offeringName: 'Massage',
        dateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0),
        status: 'CONFIRMED',
        createdAt: new Date('2024-12-14T12:00:00Z'),
        cancelledAt: null,
      },
    ];

    mockReadRepository.findToday.mockResolvedValue(mockAppointments);

    // Act
    const query = new GetTodayAppointmentsQuery(businessId);
    const result = await handler.execute(query);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('CONFIRMED');
    expect(mockReadRepository.findToday).toHaveBeenCalledWith(businessId);
  });
});
