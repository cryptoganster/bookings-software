import { Test, TestingModule } from '@nestjs/testing';
import { GetAppointmentHandler } from '../handler';
import { GetAppointmentQuery } from '../query';
import { IAppointmentReadRepository } from '@booking/domain/interfaces/repositories/appointment-read';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';

describe('GetAppointmentHandler', () => {
  let handler: GetAppointmentHandler;
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
        GetAppointmentHandler,
        {
          provide: 'IAppointmentReadRepository',
          useValue: mockReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetAppointmentHandler>(GetAppointmentHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should return specific appointment by id', async () => {
    // Arrange
    const appointmentId = 'appointment-123';
    const mockAppointment: AppointmentReadModel = {
      id: appointmentId,
      businessId: 'business-1',
      customerId: 'customer-1',
      customerName: 'Jane Smith',
      customerPhone: '+9876543210',
      offeringId: 'offering-1',
      offeringName: 'Massage',
      dateTime: new Date('2024-12-22T15:00:00Z'),
      status: 'CONFIRMED',
      createdAt: new Date('2024-12-14T12:00:00Z'),
      cancelledAt: null,
    };

    mockReadRepository.findById.mockResolvedValue(mockAppointment);

    // Act
    const query = new GetAppointmentQuery(appointmentId);
    const result = await handler.execute(query);

    // Assert
    expect(result).toEqual(mockAppointment);
    expect(result?.id).toBe(appointmentId);
    expect(mockReadRepository.findById).toHaveBeenCalledWith(appointmentId);
    expect(mockReadRepository.findById).toHaveBeenCalledTimes(1);
  });

  it('should return null when appointment does not exist', async () => {
    // Arrange
    const appointmentId = 'non-existent-appointment';
    mockReadRepository.findById.mockResolvedValue(null);

    // Act
    const query = new GetAppointmentQuery(appointmentId);
    const result = await handler.execute(query);

    // Assert
    expect(result).toBeNull();
    expect(mockReadRepository.findById).toHaveBeenCalledWith(appointmentId);
  });

  it('should return appointment with cancelled status', async () => {
    // Arrange
    const appointmentId = 'cancelled-appointment';
    const mockCancelledAppointment: AppointmentReadModel = {
      id: appointmentId,
      businessId: 'business-1',
      customerId: 'customer-1',
      customerName: 'Bob Johnson',
      customerPhone: '+1122334455',
      offeringId: 'offering-1',
      offeringName: 'Consultation',
      dateTime: new Date('2024-12-23T09:00:00Z'),
      status: 'CANCELLED',
      createdAt: new Date('2024-12-14T08:00:00Z'),
      cancelledAt: new Date('2024-12-15T10:00:00Z'),
    };

    mockReadRepository.findById.mockResolvedValue(mockCancelledAppointment);

    // Act
    const query = new GetAppointmentQuery(appointmentId);
    const result = await handler.execute(query);

    // Assert
    expect(result).toEqual(mockCancelledAppointment);
    expect(result?.status).toBe('CANCELLED');
    expect(result?.cancelledAt).not.toBeNull();
  });
});
