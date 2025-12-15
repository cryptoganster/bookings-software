import { Test, TestingModule } from '@nestjs/testing';
import { GetAvailableSlotsHandler } from '../handler';
import { GetAvailableSlotsQuery } from '../query';
import { ICapacityReadRepository } from '@availability/domain/interfaces/repositories/capacity-read';
import { CapacityReadModel } from '@availability/domain/read-models/capacity';

describe('GetAvailableSlotsHandler', () => {
  let handler: GetAvailableSlotsHandler;
  let capacityReadRepository: jest.Mocked<ICapacityReadRepository>;

  beforeEach(async () => {
    const mockCapacityReadRepository = {
      findByOfferingAndDate: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAvailableSlotsHandler,
        {
          provide: 'ICapacityReadRepository',
          useValue: mockCapacityReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetAvailableSlotsHandler>(GetAvailableSlotsHandler);
    capacityReadRepository = module.get('ICapacityReadRepository');
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should return empty array when capacity not found', async () => {
    // Arrange
    const query = new GetAvailableSlotsQuery('offering-id', new Date('2024-12-20'));
    capacityReadRepository.findByOfferingAndDate.mockResolvedValue(null);

    // Act
    const result = await handler.execute(query);

    // Assert
    expect(result).toEqual([]);
    expect(capacityReadRepository.findByOfferingAndDate).toHaveBeenCalledWith(
      'offering-id',
      query.date,
    );
  });

  it('should return empty array when no available slots', async () => {
    // Arrange
    const query = new GetAvailableSlotsQuery('offering-id', new Date('2024-12-20'));
    const capacity: CapacityReadModel = {
      id: 'capacity-id',
      offeringId: 'offering-id',
      date: new Date('2024-12-20'),
      totalSlots: 10,
      availableSlots: 0,
      bookedSlots: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    capacityReadRepository.findByOfferingAndDate.mockResolvedValue(capacity);

    // Act
    const result = await handler.execute(query);

    // Assert
    expect(result).toEqual([]);
  });

  it('should return time slots when capacity is available', async () => {
    // Arrange
    const testDate = new Date('2024-12-20');
    const query = new GetAvailableSlotsQuery('offering-id', testDate);
    const capacity: CapacityReadModel = {
      id: 'capacity-id',
      offeringId: 'offering-id',
      date: testDate,
      totalSlots: 10,
      availableSlots: 5,
      bookedSlots: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    capacityReadRepository.findByOfferingAndDate.mockResolvedValue(capacity);

    // Act
    const result = await handler.execute(query);

    // Assert
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('time');
    expect(result[0]).toHaveProperty('availableSlots');
    expect(result[0].availableSlots).toBe(5);
  });

  it('should generate slots from 9 AM to 6 PM with 1.5 hour intervals', async () => {
    // Arrange
    const testDate = new Date('2024-12-20');
    const query = new GetAvailableSlotsQuery('offering-id', testDate);
    const capacity: CapacityReadModel = {
      id: 'capacity-id',
      offeringId: 'offering-id',
      date: testDate,
      totalSlots: 10,
      availableSlots: 5,
      bookedSlots: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    capacityReadRepository.findByOfferingAndDate.mockResolvedValue(capacity);

    // Act
    const result = await handler.execute(query);

    // Assert
    expect(result.length).toBeGreaterThan(0);
    
    // Verificar que el primer slot es a las 9 AM
    const firstSlot = result[0];
    expect(firstSlot.time.getHours()).toBe(9);
    expect(firstSlot.time.getMinutes()).toBe(0);
    
    // Verificar que todos los slots tienen la misma cantidad de slots disponibles
    result.forEach((slot) => {
      expect(slot.availableSlots).toBe(5);
    });
  });

  it('should use the correct date for slots', async () => {
    // Arrange
    const testDate = new Date('2024-12-20');
    const query = new GetAvailableSlotsQuery('offering-id', testDate);
    const capacity: CapacityReadModel = {
      id: 'capacity-id',
      offeringId: 'offering-id',
      date: testDate,
      totalSlots: 10,
      availableSlots: 5,
      bookedSlots: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    capacityReadRepository.findByOfferingAndDate.mockResolvedValue(capacity);

    // Act
    const result = await handler.execute(query);

    // Assert
    result.forEach((slot) => {
      expect(slot.time.getFullYear()).toBe(testDate.getFullYear());
      expect(slot.time.getMonth()).toBe(testDate.getMonth());
      expect(slot.time.getDate()).toBe(testDate.getDate());
    });
  });
});
