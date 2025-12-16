import { Test, TestingModule } from '@nestjs/testing';
import * as fc from 'fast-check';
import { GetOfferingByIdHandler } from '../handler';
import { GetOfferingByIdQuery } from '../query';
import { IOfferingReadRepository } from '../../../../domain/interfaces/repositories/offering-read';
import { OfferingReadModel } from '../../../../domain/read-models/offering';
import { UUID } from '@shared/vo/uuid';

describe('GetOfferingByIdHandler - Property-Based Tests', () => {
  let handler: GetOfferingByIdHandler;
  let mockReadRepository: jest.Mocked<IOfferingReadRepository>;

  beforeEach(async () => {
    mockReadRepository = {
      findById: jest.fn(),
      findActiveByBusinessId: jest.fn(),
      findByBusinessId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOfferingByIdHandler,
        {
          provide: 'IOfferingReadRepository',
          useValue: mockReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetOfferingByIdHandler>(GetOfferingByIdHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 5: Business isolation
   * Validates: Requirements 6.1, 6.2
   *
   * Property: Query with incorrect businessId should return null
   */
  it('Property 5: should enforce business isolation when businessId provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.constant(UUID.generate().getValue()),
          businessId: fc.constant(UUID.generate().getValue()),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          duration: fc.integer({ min: 15, max: 480 }),
          maxCapacityPerSlot: fc.integer({ min: 1, max: 20 }),
          maxDailyCapacity: fc.oneof(
            fc.constant(null),
            fc.integer({ min: 1, max: 100 }),
          ),
          isActive: fc.boolean(),
          createdAt: fc.constant(new Date()),
          updatedAt: fc.constant(new Date()),
        }),
        async (offering: OfferingReadModel) => {
          // Arrange
          const differentBusinessId = UUID.generate().getValue();

          mockReadRepository.findById.mockResolvedValue(offering);

          const query = new GetOfferingByIdQuery(
            offering.id,
            differentBusinessId,
          );

          // Act
          const result = await handler.execute(query);

          // Assert
          // Property: Should return null when businessId doesn't match
          expect(result).toBeNull();

          jest.clearAllMocks();
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property: Query should return offering when businessId matches
   */
  it('should return offering when businessId matches', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.constant(UUID.generate().getValue()),
          businessId: fc.constant(UUID.generate().getValue()),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          duration: fc.integer({ min: 15, max: 480 }),
          maxCapacityPerSlot: fc.integer({ min: 1, max: 20 }),
          maxDailyCapacity: fc.oneof(
            fc.constant(null),
            fc.integer({ min: 1, max: 100 }),
          ),
          isActive: fc.boolean(),
          createdAt: fc.constant(new Date()),
          updatedAt: fc.constant(new Date()),
        }),
        async (offering: OfferingReadModel) => {
          // Arrange
          mockReadRepository.findById.mockResolvedValue(offering);

          const query = new GetOfferingByIdQuery(
            offering.id,
            offering.businessId,
          );

          // Act
          const result = await handler.execute(query);

          // Assert
          // Property: Should return offering when businessId matches
          expect(result).toEqual(offering);
          expect(result?.businessId).toBe(offering.businessId);

          jest.clearAllMocks();
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property: Query should preserve offering data integrity
   */
  it('should preserve all offering properties', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.constant(UUID.generate().getValue()),
          businessId: fc.constant(UUID.generate().getValue()),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          duration: fc.integer({ min: 15, max: 480 }),
          maxCapacityPerSlot: fc.integer({ min: 1, max: 20 }),
          maxDailyCapacity: fc.oneof(
            fc.constant(null),
            fc.integer({ min: 1, max: 100 }),
          ),
          isActive: fc.boolean(),
          createdAt: fc.constant(new Date()),
          updatedAt: fc.constant(new Date()),
        }),
        async (offering: OfferingReadModel) => {
          // Arrange
          mockReadRepository.findById.mockResolvedValue(offering);

          const query = new GetOfferingByIdQuery(offering.id);

          // Act
          const result = await handler.execute(query);

          // Assert
          // Property: All properties should be preserved
          expect(result).toEqual(offering);
          expect(result?.id).toBe(offering.id);
          expect(result?.businessId).toBe(offering.businessId);
          expect(result?.name).toBe(offering.name);
          expect(result?.duration).toBe(offering.duration);
          expect(result?.maxCapacityPerSlot).toBe(offering.maxCapacityPerSlot);
          expect(result?.maxDailyCapacity).toBe(offering.maxDailyCapacity);
          expect(result?.isActive).toBe(offering.isActive);

          jest.clearAllMocks();
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property: Query should return null for non-existent offerings
   */
  it('should return null for non-existent offerings', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(UUID.generate().getValue()), async (id) => {
        // Arrange
        mockReadRepository.findById.mockResolvedValue(null);

        const query = new GetOfferingByIdQuery(id);

        // Act
        const result = await handler.execute(query);

        // Assert
        expect(result).toBeNull();

        jest.clearAllMocks();
      }),
      { numRuns: 10 },
    );
  });
});
