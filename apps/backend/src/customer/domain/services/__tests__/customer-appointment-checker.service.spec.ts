import { CustomerAppointmentChecker } from '../customer-appointment-checker.service';
import { IAppointmentReadRepository } from '@booking/domain/interfaces/repositories/appointment-read';
import { AppointmentReadModel } from '@booking/domain/read-models/appointment';

describe('CustomerAppointmentChecker', () => {
  let checker: CustomerAppointmentChecker;
  let mockAppointmentReadRepo: jest.Mocked<IAppointmentReadRepository>;

  beforeEach(() => {
    mockAppointmentReadRepo = {
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByBusinessId: jest.fn(),
      findUpcoming: jest.fn(),
      findToday: jest.fn(),
      findByBusinessAndDateRange: jest.fn(),
    } as jest.Mocked<IAppointmentReadRepository>;

    checker = new CustomerAppointmentChecker(mockAppointmentReadRepo);
  });

  describe('hasFutureAppointments', () => {
    it('should return true when customer has future CONFIRMED appointments', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days in future

      const appointments: AppointmentReadModel[] = [
        {
          id: 'appointment-1',
          businessId: 'business-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          customerPhone: '+18095551234',
          offeringId: 'offering-1',
          offeringName: 'Haircut',
          dateTime: futureDate,
          status: 'CONFIRMED',
          createdAt: new Date(),
          cancelledAt: null,
        },
      ];

      mockAppointmentReadRepo.findByCustomerId.mockResolvedValue(appointments);

      // Act
      const result = await checker.hasFutureAppointments('customer-1');

      // Assert
      expect(result).toBe(true);
      expect(mockAppointmentReadRepo.findByCustomerId).toHaveBeenCalledWith('customer-1');
      expect(mockAppointmentReadRepo.findByCustomerId).toHaveBeenCalledTimes(1);
    });

    it('should return false when customer has no future appointments', async () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7); // 7 days in past

      const appointments: AppointmentReadModel[] = [
        {
          id: 'appointment-1',
          businessId: 'business-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          customerPhone: '+18095551234',
          offeringId: 'offering-1',
          offeringName: 'Haircut',
          dateTime: pastDate,
          status: 'COMPLETED',
          createdAt: new Date(),
          cancelledAt: null,
        },
      ];

      mockAppointmentReadRepo.findByCustomerId.mockResolvedValue(appointments);

      // Act
      const result = await checker.hasFutureAppointments('customer-1');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when customer has no appointments', async () => {
      // Arrange
      mockAppointmentReadRepo.findByCustomerId.mockResolvedValue([]);

      // Act
      const result = await checker.hasFutureAppointments('customer-1');

      // Assert
      expect(result).toBe(false);
    });

    it('should exclude CANCELLED appointments from future appointments', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const appointments: AppointmentReadModel[] = [
        {
          id: 'appointment-1',
          businessId: 'business-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          customerPhone: '+18095551234',
          offeringId: 'offering-1',
          offeringName: 'Haircut',
          dateTime: futureDate,
          status: 'CANCELLED', // ← Cancelled
          createdAt: new Date(),
          cancelledAt: null,
        },
      ];

      mockAppointmentReadRepo.findByCustomerId.mockResolvedValue(appointments);

      // Act
      const result = await checker.hasFutureAppointments('customer-1');

      // Assert
      expect(result).toBe(false);
    });

    it('should exclude COMPLETED appointments from future appointments', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const appointments: AppointmentReadModel[] = [
        {
          id: 'appointment-1',
          businessId: 'business-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          customerPhone: '+18095551234',
          offeringId: 'offering-1',
          offeringName: 'Haircut',
          dateTime: futureDate,
          status: 'COMPLETED', // ← Completed
          createdAt: new Date(),
          cancelledAt: null,
        },
      ];

      mockAppointmentReadRepo.findByCustomerId.mockResolvedValue(appointments);

      // Act
      const result = await checker.hasFutureAppointments('customer-1');

      // Assert
      expect(result).toBe(false);
    });

    it('should exclude past CONFIRMED appointments', async () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7); // 7 days in past

      const appointments: AppointmentReadModel[] = [
        {
          id: 'appointment-1',
          businessId: 'business-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          customerPhone: '+18095551234',
          offeringId: 'offering-1',
          offeringName: 'Haircut',
          dateTime: pastDate,
          status: 'CONFIRMED', // ← Confirmed but in past
          createdAt: new Date(),
          cancelledAt: null,
        },
      ];

      mockAppointmentReadRepo.findByCustomerId.mockResolvedValue(appointments);

      // Act
      const result = await checker.hasFutureAppointments('customer-1');

      // Assert
      expect(result).toBe(false);
    });

    it('should handle mixed appointments correctly', async () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const appointments: AppointmentReadModel[] = [
        {
          id: 'appointment-1',
          businessId: 'business-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          customerPhone: '+18095551234',
          offeringId: 'offering-1',
          offeringName: 'Haircut',
          dateTime: pastDate,
          status: 'COMPLETED',
          createdAt: new Date(),
          cancelledAt: null,
        },
        {
          id: 'appointment-2',
          businessId: 'business-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          customerPhone: '+18095551234',
          offeringId: 'offering-1',
          offeringName: 'Haircut',
          dateTime: futureDate,
          status: 'CANCELLED',
          createdAt: new Date(),
          cancelledAt: null,
        },
        {
          id: 'appointment-3',
          businessId: 'business-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          customerPhone: '+18095551234',
          offeringId: 'offering-1',
          offeringName: 'Haircut',
          dateTime: futureDate,
          status: 'CONFIRMED', // ← Only this one counts
          createdAt: new Date(),
          cancelledAt: null,
        },
      ];

      mockAppointmentReadRepo.findByCustomerId.mockResolvedValue(appointments);

      // Act
      const result = await checker.hasFutureAppointments('customer-1');

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('getFutureAppointmentsCount', () => {
    it('should return correct count of future CONFIRMED appointments', async () => {
      // Arrange
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 7);

      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 14);

      const appointments: AppointmentReadModel[] = [
        {
          id: 'appointment-1',
          businessId: 'business-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          customerPhone: '+18095551234',
          offeringId: 'offering-1',
          offeringName: 'Haircut',
          dateTime: futureDate1,
          status: 'CONFIRMED',
          createdAt: new Date(),
          cancelledAt: null,
        },
        {
          id: 'appointment-2',
          businessId: 'business-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          customerPhone: '+18095551234',
          offeringId: 'offering-1',
          offeringName: 'Haircut',
          dateTime: futureDate2,
          status: 'CONFIRMED',
          createdAt: new Date(),
          cancelledAt: null,
        },
      ];

      mockAppointmentReadRepo.findByCustomerId.mockResolvedValue(appointments);

      // Act
      const result = await checker.getFutureAppointmentsCount('customer-1');

      // Assert
      expect(result).toBe(2);
    });

    it('should return 0 when customer has no future appointments', async () => {
      // Arrange
      mockAppointmentReadRepo.findByCustomerId.mockResolvedValue([]);

      // Act
      const result = await checker.getFutureAppointmentsCount('customer-1');

      // Assert
      expect(result).toBe(0);
    });

    it('should exclude cancelled and completed appointments from count', async () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const appointments: AppointmentReadModel[] = [
        {
          id: 'appointment-1',
          businessId: 'business-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          customerPhone: '+18095551234',
          offeringId: 'offering-1',
          offeringName: 'Haircut',
          dateTime: futureDate,
          status: 'CONFIRMED',
          createdAt: new Date(),
          cancelledAt: null,
        },
        {
          id: 'appointment-2',
          businessId: 'business-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          customerPhone: '+18095551234',
          offeringId: 'offering-1',
          offeringName: 'Haircut',
          dateTime: futureDate,
          status: 'CANCELLED',
          createdAt: new Date(),
          cancelledAt: null,
        },
        {
          id: 'appointment-3',
          businessId: 'business-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          customerPhone: '+18095551234',
          offeringId: 'offering-1',
          offeringName: 'Haircut',
          dateTime: futureDate,
          status: 'COMPLETED',
          createdAt: new Date(),
          cancelledAt: null,
        },
      ];

      mockAppointmentReadRepo.findByCustomerId.mockResolvedValue(appointments);

      // Act
      const result = await checker.getFutureAppointmentsCount('customer-1');

      // Assert
      expect(result).toBe(1); // Only the CONFIRMED one
    });

    it('should exclude past appointments from count', async () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const appointments: AppointmentReadModel[] = [
        {
          id: 'appointment-1',
          businessId: 'business-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          customerPhone: '+18095551234',
          offeringId: 'offering-1',
          offeringName: 'Haircut',
          dateTime: pastDate,
          status: 'CONFIRMED',
          createdAt: new Date(),
          cancelledAt: null,
        },
        {
          id: 'appointment-2',
          businessId: 'business-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          customerPhone: '+18095551234',
          offeringId: 'offering-1',
          offeringName: 'Haircut',
          dateTime: futureDate,
          status: 'CONFIRMED',
          createdAt: new Date(),
          cancelledAt: null,
        },
      ];

      mockAppointmentReadRepo.findByCustomerId.mockResolvedValue(appointments);

      // Act
      const result = await checker.getFutureAppointmentsCount('customer-1');

      // Assert
      expect(result).toBe(1); // Only the future one
    });
  });
});
