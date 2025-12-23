import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Capacity } from '@availability/domain/aggregates/capacity';
import { CapacityWriteRepository } from '@availability/infra/persistence/repositories/capacity-write';
import { CapacityFactory } from '@availability/infra/persistence/factories/capacity-factory';
import { CapacityModel } from '@availability/infra/persistence/models/capacity';
import { TypeOrmUnitOfWork } from '@shared/infra/uow';
import { UUID } from '@shared/vo/uuid';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

describe('Capacity - Concurrency Tests', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let capacityWriteRepo: CapacityWriteRepository;
  let capacityFactory: CapacityFactory;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'bookings_test',
          entities: [CapacityModel],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([CapacityModel]),
      ],
      providers: [
        CapacityWriteRepository,
        CapacityFactory,
        {
          provide: 'IUnitOfWork',
          useClass: TypeOrmUnitOfWork,
        },
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    capacityWriteRepo = module.get<CapacityWriteRepository>(CapacityWriteRepository);
    capacityFactory = module.get<CapacityFactory>(CapacityFactory);
  });

  afterEach(async () => {
    await dataSource.destroy();
    await module.close();
  });

  describe('Property 12: Optimistic locking prevents double booking', () => {
    it('should prevent concurrent slot bookings that exceed capacity', async () => {
      // Arrange: Create capacity with 2 available slots
      const id = UUID.generate();
      const offeringId = UUID.generate();
      const date = new Date();
      date.setDate(date.getDate() + 1);
      date.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC

      const capacity = Capacity.create(id, offeringId, date, 2);
      await capacityWriteRepo.save(capacity);

      // Act: Simulate 3 concurrent bookings trying to book the last 2 slots
      const booking1 = async () => {
        const cap = await capacityFactory.loadByOfferingAndDate(offeringId.getValue(), date);
        if (!cap) throw new Error('Capacity not found');
        cap.bookSlot();
        await capacityWriteRepo.save(cap);
      };

      const booking2 = async () => {
        const cap = await capacityFactory.loadByOfferingAndDate(offeringId.getValue(), date);
        if (!cap) throw new Error('Capacity not found');
        cap.bookSlot();
        await capacityWriteRepo.save(cap);
      };

      const booking3 = async () => {
        const cap = await capacityFactory.loadByOfferingAndDate(offeringId.getValue(), date);
        if (!cap) throw new Error('Capacity not found');
        cap.bookSlot();
        await capacityWriteRepo.save(cap);
      };

      // Execute all bookings concurrently
      const results = await Promise.allSettled([booking1(), booking2(), booking3()]);

      // Assert: Only 2 bookings should succeed, 1 should fail with ConcurrencyException
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      expect(succeeded).toBe(2);
      expect(failed).toBe(1);

      // Verify the failed one is due to ConcurrencyException
      const rejectedResult = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
      expect(rejectedResult.reason).toBeInstanceOf(ConcurrencyException);

      // Verify final state: capacity should have 0 available slots
      const finalCapacity = await capacityFactory.loadByOfferingAndDate(
        offeringId.getValue(),
        date,
      );
      expect(finalCapacity).toBeDefined();
      expect(finalCapacity!.getAvailableSlots()).toBe(0);
      expect(finalCapacity!.getBookedSlots()).toBe(2);
    });

    it('should handle race condition with retry logic', async () => {
      // Arrange: Create capacity with 5 available slots
      const id = UUID.generate();
      const offeringId = UUID.generate();
      const date = new Date();
      date.setDate(date.getDate() + 1);
      date.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC

      const capacity = Capacity.create(id, offeringId, date, 5);
      await capacityWriteRepo.save(capacity);

      // Act: Simulate 5 concurrent bookings with retry logic
      const bookWithRetry = async (maxRetries = 3) => {
        let attempt = 0;
        while (attempt < maxRetries) {
          try {
            const cap = await capacityFactory.loadByOfferingAndDate(offeringId.getValue(), date);
            if (!cap) throw new Error('Capacity not found');
            cap.bookSlot();
            await capacityWriteRepo.save(cap);
            return; // Success
          } catch (error) {
            if (error instanceof ConcurrencyException) {
              attempt++;
              if (attempt >= maxRetries) throw error;
              // Wait a bit before retrying (exponential backoff)
              await new Promise((resolve) => setTimeout(resolve, 10 * Math.pow(2, attempt)));
            } else {
              throw error;
            }
          }
        }
      };

      // Execute 5 concurrent bookings with retry
      const bookings = Array.from({ length: 5 }, () => bookWithRetry());
      const results = await Promise.allSettled(bookings);

      // Assert: Most bookings should eventually succeed with retry logic (at least 4 out of 5)
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      expect(succeeded).toBeGreaterThanOrEqual(4);

      // Verify final state: capacity should have correct number of booked slots
      const finalCapacity = await capacityFactory.loadByOfferingAndDate(
        offeringId.getValue(),
        date,
      );
      expect(finalCapacity).toBeDefined();
      expect(finalCapacity!.getBookedSlots()).toBe(succeeded);
      expect(finalCapacity!.getAvailableSlots()).toBe(5 - succeeded);
    });

    it('should verify version increments on each update', async () => {
      // Arrange: Create capacity
      const id = UUID.generate();
      const offeringId = UUID.generate();
      const date = new Date();
      date.setDate(date.getDate() + 1);
      date.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC

      const capacity = Capacity.create(id, offeringId, date, 10);
      await capacityWriteRepo.save(capacity);

      // Act: Load, modify, and save multiple times
      const initialVersion = capacity.getVersion().getValue();

      // First update
      const cap1 = await capacityFactory.loadByOfferingAndDate(offeringId.getValue(), date);
      expect(cap1!.getVersion().getValue()).toBe(initialVersion);
      cap1!.bookSlot();
      await capacityWriteRepo.save(cap1!);

      // Second update
      const cap2 = await capacityFactory.loadByOfferingAndDate(offeringId.getValue(), date);
      expect(cap2!.getVersion().getValue()).toBe(initialVersion + 1);
      cap2!.bookSlot();
      await capacityWriteRepo.save(cap2!);

      // Third update
      const cap3 = await capacityFactory.loadByOfferingAndDate(offeringId.getValue(), date);
      expect(cap3!.getVersion().getValue()).toBe(initialVersion + 2);
      cap3!.bookSlot();
      await capacityWriteRepo.save(cap3!);

      // Assert: Version should have incremented 3 times
      const finalCapacity = await capacityFactory.loadByOfferingAndDate(
        offeringId.getValue(),
        date,
      );
      expect(finalCapacity!.getVersion().getValue()).toBe(initialVersion + 3);
      expect(finalCapacity!.getBookedSlots()).toBe(3);
    });

    it('should fail when trying to save with stale version', async () => {
      // Arrange: Create capacity
      const id = UUID.generate();
      const offeringId = UUID.generate();
      const date = new Date();
      date.setDate(date.getDate() + 1);
      date.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC

      const capacity = Capacity.create(id, offeringId, date, 10);
      await capacityWriteRepo.save(capacity);

      // Act: Load capacity twice (simulating two concurrent operations)
      const cap1 = await capacityFactory.loadByOfferingAndDate(offeringId.getValue(), date);
      const cap2 = await capacityFactory.loadByOfferingAndDate(offeringId.getValue(), date);

      // First operation succeeds
      cap1!.bookSlot();
      await capacityWriteRepo.save(cap1!);

      // Second operation should fail (stale version)
      cap2!.bookSlot();
      await expect(capacityWriteRepo.save(cap2!)).rejects.toThrow(ConcurrencyException);
    });

    it('should handle high concurrency (10 simultaneous bookings)', async () => {
      // Arrange: Create capacity with 10 available slots
      const id = UUID.generate();
      const offeringId = UUID.generate();
      const date = new Date();
      date.setDate(date.getDate() + 1);
      date.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC

      const capacity = Capacity.create(id, offeringId, date, 10);
      await capacityWriteRepo.save(capacity);

      // Act: Simulate 10 concurrent bookings with retry logic
      const bookWithRetry = async (maxRetries = 5) => {
        let attempt = 0;
        while (attempt < maxRetries) {
          try {
            const cap = await capacityFactory.loadByOfferingAndDate(offeringId.getValue(), date);
            if (!cap) throw new Error('Capacity not found');
            cap.bookSlot();
            await capacityWriteRepo.save(cap);
            return; // Success
          } catch (error) {
            if (error instanceof ConcurrencyException) {
              attempt++;
              if (attempt >= maxRetries) throw error;
              await new Promise((resolve) => setTimeout(resolve, 5 * Math.pow(2, attempt)));
            } else {
              throw error;
            }
          }
        }
      };

      // Execute 10 concurrent bookings
      const bookings = Array.from({ length: 10 }, () => bookWithRetry());
      const results = await Promise.allSettled(bookings);

      // Assert: Most bookings should eventually succeed (at least 7 out of 10)
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      expect(succeeded).toBeGreaterThanOrEqual(7);

      // Verify final state
      const finalCapacity = await capacityFactory.loadByOfferingAndDate(
        offeringId.getValue(),
        date,
      );
      expect(finalCapacity!.getBookedSlots()).toBe(succeeded);
      expect(finalCapacity!.getAvailableSlots()).toBe(10 - succeeded);
      expect(finalCapacity!.getVersion().getValue()).toBeGreaterThanOrEqual(succeeded);
    });

    it('should handle mixed operations (book and release) concurrently', async () => {
      // Arrange: Create capacity with 5 available slots
      const id = UUID.generate();
      const offeringId = UUID.generate();
      const date = new Date();
      date.setDate(date.getDate() + 1);
      date.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC

      const capacity = Capacity.create(id, offeringId, date, 5);
      await capacityWriteRepo.save(capacity);

      // Act: Simulate concurrent book and release operations
      const operations = [
        // 3 bookings
        async () => {
          const cap = await capacityFactory.loadByOfferingAndDate(offeringId.getValue(), date);
          cap!.bookSlot();
          await capacityWriteRepo.save(cap!);
        },
        async () => {
          const cap = await capacityFactory.loadByOfferingAndDate(offeringId.getValue(), date);
          cap!.bookSlot();
          await capacityWriteRepo.save(cap!);
        },
        async () => {
          const cap = await capacityFactory.loadByOfferingAndDate(offeringId.getValue(), date);
          cap!.bookSlot();
          await capacityWriteRepo.save(cap!);
        },
        // 2 releases
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 50)); // Wait a bit
          const cap = await capacityFactory.loadByOfferingAndDate(offeringId.getValue(), date);
          cap!.releaseSlot();
          await capacityWriteRepo.save(cap!);
        },
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 50)); // Wait a bit
          const cap = await capacityFactory.loadByOfferingAndDate(offeringId.getValue(), date);
          cap!.releaseSlot();
          await capacityWriteRepo.save(cap!);
        },
      ];

      const results = await Promise.allSettled(operations);

      // Assert: Some operations should succeed, some may fail due to concurrency
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      expect(succeeded).toBeGreaterThan(0);

      // Verify final state is consistent
      const finalCapacity = await capacityFactory.loadByOfferingAndDate(
        offeringId.getValue(),
        date,
      );
      expect(finalCapacity).toBeDefined();

      // Available + Booked should equal Total
      const total = finalCapacity!.getAvailableSlots() + finalCapacity!.getBookedSlots();
      expect(total).toBe(5);
    });
  });
});
