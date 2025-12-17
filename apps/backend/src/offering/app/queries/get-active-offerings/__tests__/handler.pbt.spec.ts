import { Test, TestingModule } from '@nestjs/testing';
import * as fc from 'fast-check';
import { GetActiveOfferingsHandler } from '../handler';
import { GetActiveOfferingsQuery } from '../query';
import { IOfferingReadRepository } from '../../../../domain/interfaces/repositories/offering-read';
import { OfferingReadModel } from '../../../../domain/read-models/offering';
import { UUID } from '@shared/vo/uuid';

describe('GetActiveOfferingsHandler - Property-Based Tests', () => {
  let handler: GetActiveOfferingsHandler;
  let mockReadRepository: jest.Mocked<IOfferingReadRepository>;

  beforeEach(async () => {
    mockReadRepository = {
      findById: jest.fn(),
      findActiveByBusinessId: jest.fn(),
      findByBusinessId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetActiveOfferingsHandler,
        {
          provide: 'IOfferingReadRepository',
          useValue: mockReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetActiveOfferingsHandler>(GetActiveOfferingsHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 4: Active offerings query
   * Validates: Requirements 4.1, 4.3
   *
   * Property: Query should only return offerings where isActive = true
   */
  it('Property 4: should only return active offerings regardless of input', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.constant(UUID.generate().getValue()),
            businessId: fc.constant(UUID.generate().getValue()),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            duration: fc.integer({ min: 15, max: 480 }),
            maxCapacityPerSlot: fc.integer({ min: 1, max: 20 }),
            maxDailyCapacity: fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 100 })),
            isActive: fc.boolean(), // Random active/inactive
            createdAt: fc.constant(new Date()),
            updatedAt: fc.constant(new Date()),
          }),
          { minLength: 0, maxLength: 10 },
        ),
        async (offerings: OfferingReadModel[]) => {
          // Arrange
          const businessId = UUID.generate().getValue();
          const activeOfferings = offerings.filter((o) => o.isActive);

          mockReadRepository.findActiveByBusinessId.mockResolvedValue(activeOfferings);

          const query = new GetActiveOfferingsQuery(businessId);

          // Act
          const result = await handler.execute(query);

          // Assert
          // Property: All returned offerings must be active
          expect(result.every((o) => o.isActive)).toBe(true);

          // Property: Result should match filtered active offerings
          expect(result).toEqual(activeOfferings);

          jest.clearAllMocks();
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property: Query should return empty array when no active offerings exist
   */
  it('should return empty array when all offerings are inactive', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.constant(UUID.generate().getValue()),
            businessId: fc.constant(UUID.generate().getValue()),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            duration: fc.integer({ min: 15, max: 480 }),
            maxCapacityPerSlot: fc.integer({ min: 1, max: 20 }),
            maxDailyCapacity: fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 100 })),
            isActive: fc.constant(false), // All inactive
            createdAt: fc.constant(new Date()),
            updatedAt: fc.constant(new Date()),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        async (offerings: OfferingReadModel[]) => {
          // Arrange
          const businessId = UUID.generate().getValue();

          mockReadRepository.findActiveByBusinessId.mockResolvedValue([]);

          const query = new GetActiveOfferingsQuery(businessId);

          // Act
          const result = await handler.execute(query);

          // Assert
          expect(result).toEqual([]);
          expect(result).toHaveLength(0);

          jest.clearAllMocks();
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property: Query should preserve offering data integrity
   */
  it('should preserve all offering properties in returned data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.constant(UUID.generate().getValue()),
            businessId: fc.constant(UUID.generate().getValue()),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            duration: fc.integer({ min: 15, max: 480 }),
            maxCapacityPerSlot: fc.integer({ min: 1, max: 20 }),
            maxDailyCapacity: fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 100 })),
            isActive: fc.constant(true), // All active
            createdAt: fc.constant(new Date()),
            updatedAt: fc.constant(new Date()),
          }),
          { minLength: 1, maxLength: 5 },
        ),
        async (offerings: OfferingReadModel[]) => {
          // Arrange
          const businessId = UUID.generate().getValue();

          mockReadRepository.findActiveByBusinessId.mockResolvedValue(offerings);

          const query = new GetActiveOfferingsQuery(businessId);

          // Act
          const result = await handler.execute(query);

          // Assert
          // Property: All properties should be preserved
          result.forEach((offering, index) => {
            expect(offering.id).toBe(offerings[index].id);
            expect(offering.businessId).toBe(offerings[index].businessId);
            expect(offering.name).toBe(offerings[index].name);
            expect(offering.duration).toBe(offerings[index].duration);
            expect(offering.maxCapacityPerSlot).toBe(offerings[index].maxCapacityPerSlot);
            expect(offering.maxDailyCapacity).toBe(offerings[index].maxDailyCapacity);
            expect(offering.isActive).toBe(offerings[index].isActive);
          });

          jest.clearAllMocks();
        },
      ),
      { numRuns: 10 },
    );
  });
});
