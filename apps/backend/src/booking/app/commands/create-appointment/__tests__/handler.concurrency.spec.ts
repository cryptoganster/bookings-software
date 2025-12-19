import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { CreateAppointmentHandler } from '../handler';
import { CreateAppointmentCommand } from '../command';
import { IAppointmentWriteRepository } from '@booking/domain/interfaces/repositories/appointment-write';
import { IUnitOfWork } from '@shared/kernel/uow';
import { NoAvailableSlotsException } from '@booking/domain/exceptions/no-available-slots';

describe('CreateAppointmentHandler Concurrency', () => {
  let handler: CreateAppointmentHandler;
  let appointmentRepository: jest.Mocked<IAppointmentWriteRepository>;
  let capacityFactory: any;
  let capacityWriteRepository: any;
  let customerReadRepository: any;
  let uow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    // Mock repositories
    appointmentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    capacityFactory = {
      loadByOfferingAndDate: jest.fn(),
      loadById: jest.fn(),
    };

    capacityWriteRepository = {
      save: jest.fn(),
    };

    customerReadRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'mock-customer-id' }), // Mock customer exists for all tests
      findByWhatsAppPhone: jest.fn(),
      findByBusinessId: jest.fn(),
      findByUserId: jest.fn(),
      findAnonymousByBusinessId: jest.fn(),
    };

    uow = {
      transaction: jest.fn((work) => work()),
      getQueryRunner: jest.fn(),
    } as any;

    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      setContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAppointmentHandler,
        {
          provide: 'IAppointmentWriteRepository',
          useValue: appointmentRepository,
        },
        {
          provide: 'ICapacityFactory',
          useValue: capacityFactory,
        },
        {
          provide: 'ICapacityWriteRepository',
          useValue: capacityWriteRepository,
        },
        {
          provide: 'ICustomerReadRepository',
          useValue: customerReadRepository,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
        {
          provide: 'IUnitOfWork',
          useValue: uow,
        },
      ],
    }).compile();

    handler = module.get<CreateAppointmentHandler>(CreateAppointmentHandler);
  });

  it('should handle concurrent bookings for same slot - only one succeeds', async () => {
    // Arrange
    let availableSlots = 1;
    let callCount = 0;

    // Mock capacity that simulates race condition
    const mockCapacity = {
      hasAvailableSlots: jest.fn(() => {
        // Both requests see 1 available slot initially
        return availableSlots > 0;
      }),
      bookSlot: jest.fn(() => {
        // Simulate decrement
        availableSlots--;
        callCount++;
      }),
    };

    // First call sees capacity available
    // Second call also sees capacity available (race condition)
    capacityFactory.loadByOfferingAndDate.mockResolvedValue(mockCapacity);

    // However, we need to simulate that the second save fails
    // In real scenario, optimistic locking would catch this
    capacityWriteRepository.save.mockImplementation(() => {
      if (callCount > 1) {
        // Second save should fail due to optimistic locking
        throw new Error('Concurrency conflict detected');
      }
      return Promise.resolve();
    });

    // Use a future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const command1 = new CreateAppointmentCommand(
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001', // customer 1
      '550e8400-e29b-41d4-a716-446655440002',
      futureDate,
    );

    const command2 = new CreateAppointmentCommand(
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440003', // customer 2
      '550e8400-e29b-41d4-a716-446655440002',
      futureDate,
    );

    // Act - Simulate concurrent execution
    const results = await Promise.allSettled([
      handler.execute(command1),
      handler.execute(command2),
    ]);

    // Assert
    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    // At least one should succeed
    expect(succeeded.length).toBeGreaterThanOrEqual(1);

    // At least one should fail (due to concurrency)
    expect(failed.length).toBeGreaterThanOrEqual(1);

    // Total should be 2
    expect(succeeded.length + failed.length).toBe(2);
  });

  it('should throw NoAvailableSlotsException when both requests see no capacity', async () => {
    // Arrange
    const mockCapacity = {
      hasAvailableSlots: jest.fn().mockReturnValue(false),
      bookSlot: jest.fn(),
    };

    capacityFactory.loadByOfferingAndDate.mockResolvedValue(mockCapacity);

    // Use a future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const command1 = new CreateAppointmentCommand(
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
      futureDate,
    );

    const command2 = new CreateAppointmentCommand(
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440003',
      '550e8400-e29b-41d4-a716-446655440002',
      futureDate,
    );

    // Act
    const results = await Promise.allSettled([
      handler.execute(command1),
      handler.execute(command2),
    ]);

    // Assert - Both should fail
    const failed = results.filter((r) => r.status === 'rejected');
    expect(failed).toHaveLength(2);

    // Both should throw NoAvailableSlotsException
    failed.forEach((result) => {
      if (result.status === 'rejected') {
        expect(result.reason).toBeInstanceOf(NoAvailableSlotsException);
      }
    });
  });

  it('should handle multiple concurrent requests with limited capacity', async () => {
    // Arrange
    let availableSlots = 2; // Only 2 slots available
    let successfulBookings = 0;

    const mockCapacity = {
      hasAvailableSlots: jest.fn(() => availableSlots > 0),
      bookSlot: jest.fn(() => {
        if (availableSlots > 0) {
          availableSlots--;
          successfulBookings++;
        }
      }),
    };

    capacityFactory.loadByOfferingAndDate.mockResolvedValue(mockCapacity);

    // Simulate that saves succeed only for first 2 requests
    capacityWriteRepository.save.mockImplementation(() => {
      if (successfulBookings > 2) {
        throw new Error('Concurrency conflict - capacity exhausted');
      }
      return Promise.resolve();
    });

    // Use a future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    // Create 4 concurrent requests for 2 available slots
    const commands = [
      new CreateAppointmentCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        futureDate,
      ),
      new CreateAppointmentCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440002',
        futureDate,
      ),
      new CreateAppointmentCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440004',
        '550e8400-e29b-41d4-a716-446655440002',
        futureDate,
      ),
      new CreateAppointmentCommand(
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440005',
        '550e8400-e29b-41d4-a716-446655440002',
        futureDate,
      ),
    ];

    // Act
    const results = await Promise.allSettled(commands.map((cmd) => handler.execute(cmd)));

    // Assert
    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    // At most 2 should succeed (capacity limit)
    expect(succeeded.length).toBeLessThanOrEqual(2);

    // At least 2 should fail
    expect(failed.length).toBeGreaterThanOrEqual(2);

    // Total should be 4
    expect(succeeded.length + failed.length).toBe(4);
  });
});
