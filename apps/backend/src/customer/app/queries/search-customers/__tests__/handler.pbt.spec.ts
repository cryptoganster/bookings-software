/**
 * Property-Based Tests for SearchCustomersHandler
 *
 * These tests verify universal properties that should hold for all possible inputs.
 * Each property is tested with 100+ random iterations using fast-check.
 *
 * Properties tested:
 * 1. Offset calculation accuracy
 * 2. Metadata accuracy
 * 3. No duplicate records across pages
 * 4. Complete coverage
 * 5. Stable sorting
 * 6. Page beyond total
 * 7. Invalid page numbers
 * 8. Invalid limits
 * 9. Empty results
 *
 * @see .kiro/specs/customer-pagination-fix/design.md
 * @see .kiro/specs/customer-pagination-fix/tasks.md - Task 6
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchCustomersHandler } from '../handler';
import { SearchCustomersQuery } from '../query';
import { CustomerReadRepository } from '@customer/infra/persistence/repositories/customer-read.repository';
import { CustomerModel } from '@customer/infra/persistence/models';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  generateUniqueWhatsAppNumber,
  createTestBusinessInDb,
  createTestUserInDb,
  ensureMigrationsRun,
} from '@test-utils/helpers';
import { v4 as uuidv4 } from 'uuid';
import * as fc from 'fast-check';

describe('SearchCustomersHandler - Property-Based Tests', () => {
  let module: TestingModule;
  let handler: SearchCustomersHandler;
  let repository: Repository<CustomerModel>;
  let dataSource: DataSource;
  let businessId: string;
  let userId: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'bookings_test',
          entities: [CustomerModel],
          synchronize: false,
          autoLoadEntities: true,
        }),
        TypeOrmModule.forFeature([CustomerModel]),
      ],
      providers: [
        SearchCustomersHandler,
        {
          provide: 'ICustomerReadRepository',
          useClass: CustomerReadRepository,
        },
      ],
    }).compile();

    handler = module.get<SearchCustomersHandler>(SearchCustomersHandler);
    repository = module.get<Repository<CustomerModel>>(getRepositoryToken(CustomerModel));
    dataSource = module.get<DataSource>(DataSource);

    // Create test user and business
    userId = uuidv4();
    await createTestUserInDb(dataSource, userId);

    businessId = uuidv4();
    await createTestBusinessInDb(dataSource, businessId, userId);
  });

  afterAll(async () => {
    // Clean up test data
    await repository.delete({ business_id: businessId });
    await dataSource.query('DELETE FROM businesses WHERE id = $1', [businessId]);
    await dataSource.query('DELETE FROM business_owners WHERE user_id = $1', [userId]);
    await dataSource.query('DELETE FROM users WHERE id = $1', [userId]);
    await module.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await repository.delete({ business_id: businessId });
  });

  /**
   * Property 1: Offset Calculation Accuracy
   *
   * Requirements: 1.1, 1.2, 1.3, 1.4
   * Property: offset = (page - 1) × limit for all valid page/limit combinations
   * Iterations: 100+
   */
  describe('Property 1: Offset Calculation Accuracy', () => {
    it('should calculate correct offset for any valid page and limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }), // page
          fc.integer({ min: 1, max: 100 }), // limit
          async (page, limit) => {
            // Arrange - Create enough customers to test pagination
            const totalCustomers = Math.min(page * limit + 10, 200); // Cap at 200 for performance
            const customers = [];
            for (let i = 1; i <= totalCustomers; i++) {
              customers.push({
                id: uuidv4(),
                business_id: businessId,
                whatsapp_phone: generateUniqueWhatsAppNumber(),
                name: `Customer ${i}`,
                user_id: null,
                created_at: new Date(Date.now() - i * 1000),
                updated_at: new Date(),
              });
            }
            await repository.save(customers);

            // Act
            const query = new SearchCustomersQuery({
              businessId,
              page,
              limit,
              sortBy: 'createdAt',
              sortOrder: 'DESC',
            });
            const result = await handler.execute(query);

            // Assert - Property: offset = (page - 1) × limit
            const expectedOffset = (page - 1) * limit;
            const expectedCustomersOnPage = Math.min(
              limit,
              Math.max(0, totalCustomers - expectedOffset),
            );

            expect(result.page).toBe(page);
            expect(result.limit).toBe(limit);
            expect(result.customers.length).toBe(expectedCustomersOnPage);

            // Clean up
            await repository.delete({ business_id: businessId });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 2: Metadata Accuracy
   *
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   * Properties:
   * - totalPages = Math.ceil(total / limit)
   * - hasNextPage = page < totalPages (not returned but can be calculated)
   * - hasPreviousPage = page > 1 (not returned but can be calculated)
   * Iterations: 100+
   */
  describe('Property 2: Metadata Accuracy', () => {
    it('should calculate correct metadata for any total, page, and limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 100 }), // total customers
          fc.integer({ min: 1, max: 50 }), // page
          fc.integer({ min: 1, max: 20 }), // limit
          async (total, page, limit) => {
            // Arrange - Create exact number of customers
            const customers = [];
            for (let i = 1; i <= total; i++) {
              customers.push({
                id: uuidv4(),
                business_id: businessId,
                whatsapp_phone: generateUniqueWhatsAppNumber(),
                name: `Customer ${i}`,
                user_id: null,
                created_at: new Date(Date.now() - i * 1000),
                updated_at: new Date(),
              });
            }
            if (customers.length > 0) {
              await repository.save(customers);
            }

            // Act
            const query = new SearchCustomersQuery({
              businessId,
              page,
              limit,
            });
            const result = await handler.execute(query);

            // Assert - Properties
            const expectedTotalPages = total === 0 ? 0 : Math.ceil(total / limit);
            const expectedHasNextPage = page < expectedTotalPages;
            const expectedHasPreviousPage = page > 1;

            expect(result.total).toBe(total);
            expect(result.totalPages).toBe(expectedTotalPages);
            expect(result.page).toBe(page);
            expect(result.limit).toBe(limit);

            // Verify hasNextPage property (calculated)
            const actualHasNextPage = result.page < result.totalPages;
            expect(actualHasNextPage).toBe(expectedHasNextPage);

            // Verify hasPreviousPage property (calculated)
            const actualHasPreviousPage = result.page > 1;
            expect(actualHasPreviousPage).toBe(expectedHasPreviousPage);

            // Clean up
            await repository.delete({ business_id: businessId });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 3: No Duplicate Records Across Pages
   *
   * Requirements: 1.5, 3.4
   * Property: No customer ID should appear on multiple pages
   * Iterations: 100+
   */
  describe('Property 3: No Duplicate Records Across Pages', () => {
    it('should never return duplicate customers across pages', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 20, max: 60 }), // total customers
          fc.integer({ min: 5, max: 15 }), // limit per page
          async (total, limit) => {
            // Arrange - Create customers
            const customers = [];
            for (let i = 1; i <= total; i++) {
              customers.push({
                id: uuidv4(),
                business_id: businessId,
                whatsapp_phone: generateUniqueWhatsAppNumber(),
                name: `Customer ${i}`,
                user_id: null,
                created_at: new Date(Date.now() - i * 1000),
                updated_at: new Date(),
              });
            }
            await repository.save(customers);

            // Act - Fetch all pages
            const totalPages = Math.ceil(total / limit);
            const allCustomerIds: string[] = [];

            for (let page = 1; page <= totalPages; page++) {
              const query = new SearchCustomersQuery({
                businessId,
                page,
                limit,
                sortBy: 'createdAt',
                sortOrder: 'DESC',
              });
              const result = await handler.execute(query);
              allCustomerIds.push(...result.customers.map((c) => c.id));
            }

            // Assert - Property: No duplicates
            const uniqueIds = new Set(allCustomerIds);
            expect(uniqueIds.size).toBe(allCustomerIds.length);

            // Clean up
            await repository.delete({ business_id: businessId });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 4: Complete Coverage
   *
   * Requirements: 1.5, 3.4
   * Property: Union of all pages equals complete dataset (no missing records)
   * Iterations: 100+
   */
  describe('Property 4: Complete Coverage', () => {
    it('should return all customers when fetching all pages', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10, max: 50 }), // total customers
          fc.integer({ min: 5, max: 15 }), // limit per page
          async (total, limit) => {
            // Arrange - Create customers
            const customers = [];
            const expectedIds = new Set<string>();
            for (let i = 1; i <= total; i++) {
              const id = uuidv4();
              expectedIds.add(id);
              customers.push({
                id,
                business_id: businessId,
                whatsapp_phone: generateUniqueWhatsAppNumber(),
                name: `Customer ${i}`,
                user_id: null,
                created_at: new Date(Date.now() - i * 1000),
                updated_at: new Date(),
              });
            }
            await repository.save(customers);

            // Act - Fetch all pages
            const totalPages = Math.ceil(total / limit);
            const actualIds = new Set<string>();

            for (let page = 1; page <= totalPages; page++) {
              const query = new SearchCustomersQuery({
                businessId,
                page,
                limit,
                sortBy: 'createdAt',
                sortOrder: 'DESC',
              });
              const result = await handler.execute(query);
              result.customers.forEach((c) => actualIds.add(c.id));
            }

            // Assert - Property: Complete coverage
            expect(actualIds.size).toBe(expectedIds.size);
            expectedIds.forEach((id) => {
              expect(actualIds.has(id)).toBe(true);
            });

            // Clean up
            await repository.delete({ business_id: businessId });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 5: Stable Sorting
   *
   * Requirements: 3.2, 3.3, 3.4
   * Property: Querying multiple times with same sort should produce consistent ordering
   * Iterations: 100+
   */
  describe('Property 5: Stable Sorting', () => {
    it('should maintain consistent ordering across multiple queries', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 20, max: 40 }), // total customers
          fc.constantFrom('name', 'createdAt'), // sortBy
          fc.constantFrom('ASC', 'DESC'), // sortOrder
          async (total, sortBy, sortOrder) => {
            // Arrange - Create customers with some duplicate names
            const customers = [];
            for (let i = 1; i <= total; i++) {
              customers.push({
                id: uuidv4(),
                business_id: businessId,
                whatsapp_phone: generateUniqueWhatsAppNumber(),
                name: `Customer ${Math.floor(i / 3)}`, // Duplicate names
                user_id: null,
                created_at: new Date(Date.now() - i * 1000),
                updated_at: new Date(),
              });
            }
            await repository.save(customers);

            // Act - Query twice with same parameters
            const query = new SearchCustomersQuery({
              businessId,
              page: 1,
              limit: total,
              sortBy: sortBy as 'name' | 'createdAt',
              sortOrder: sortOrder as 'ASC' | 'DESC',
            });

            const result1 = await handler.execute(query);
            const result2 = await handler.execute(query);

            // Assert - Property: Stable sorting (same order both times)
            const ids1 = result1.customers.map((c) => c.id);
            const ids2 = result2.customers.map((c) => c.id);

            expect(ids1).toEqual(ids2);

            // Clean up
            await repository.delete({ business_id: businessId });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 6: Page Beyond Total
   *
   * Requirements: 4.1
   * Property: Requesting page > totalPages should return empty array with correct metadata
   * Iterations: 100+
   */
  describe('Property 6: Page Beyond Total', () => {
    it('should return empty array when page exceeds totalPages', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 5, max: 30 }), // total customers
          fc.integer({ min: 5, max: 15 }), // limit
          fc.integer({ min: 1, max: 10 }), // extra pages beyond total
          async (total, limit, extraPages) => {
            // Arrange - Create customers
            const customers = [];
            for (let i = 1; i <= total; i++) {
              customers.push({
                id: uuidv4(),
                business_id: businessId,
                whatsapp_phone: generateUniqueWhatsAppNumber(),
                name: `Customer ${i}`,
                user_id: null,
                created_at: new Date(Date.now() - i * 1000),
                updated_at: new Date(),
              });
            }
            await repository.save(customers);

            // Act - Request page beyond total
            const totalPages = Math.ceil(total / limit);
            const pageBeyondTotal = totalPages + extraPages;

            const query = new SearchCustomersQuery({
              businessId,
              page: pageBeyondTotal,
              limit,
            });
            const result = await handler.execute(query);

            // Assert - Property: Empty array with correct metadata
            expect(result.customers).toHaveLength(0);
            expect(result.total).toBe(total);
            expect(result.totalPages).toBe(totalPages);
            expect(result.page).toBe(pageBeyondTotal);

            // Clean up
            await repository.delete({ business_id: businessId });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7: Invalid Page Numbers
   *
   * Requirements: 4.2
   * Property: Invalid page numbers (0, negative) should be normalized to 1
   * Iterations: 100+
   */
  describe('Property 7: Invalid Page Numbers', () => {
    it('should normalize invalid page numbers to 1', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: -100, max: 0 }), // invalid page numbers
          async (invalidPage) => {
            // Arrange - Create some customers
            const customers = [];
            for (let i = 1; i <= 10; i++) {
              customers.push({
                id: uuidv4(),
                business_id: businessId,
                whatsapp_phone: generateUniqueWhatsAppNumber(),
                name: `Customer ${i}`,
                user_id: null,
                created_at: new Date(Date.now() - i * 1000),
                updated_at: new Date(),
              });
            }
            await repository.save(customers);

            // Act
            const query = new SearchCustomersQuery({
              businessId,
              page: invalidPage,
              limit: 5,
            });
            const result = await handler.execute(query);

            // Assert - Property: Page normalized to 1
            expect(result.page).toBe(1);
            expect(result.customers.length).toBeGreaterThan(0);

            // Clean up
            await repository.delete({ business_id: businessId });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 8: Invalid Limits
   *
   * Requirements: 4.3, 4.4
   * Property: Invalid limits should be normalized (min 1, max 100)
   * Iterations: 100+
   */
  describe('Property 8: Invalid Limits', () => {
    it('should normalize limits below 1 to 1', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: -100, max: 0 }), // invalid limits
          async (invalidLimit) => {
            // Arrange - Create some customers
            const customers = [];
            for (let i = 1; i <= 10; i++) {
              customers.push({
                id: uuidv4(),
                business_id: businessId,
                whatsapp_phone: generateUniqueWhatsAppNumber(),
                name: `Customer ${i}`,
                user_id: null,
                created_at: new Date(Date.now() - i * 1000),
                updated_at: new Date(),
              });
            }
            await repository.save(customers);

            // Act
            const query = new SearchCustomersQuery({
              businessId,
              page: 1,
              limit: invalidLimit,
            });
            const result = await handler.execute(query);

            // Assert - Property: Limit normalized to 1
            expect(result.limit).toBe(1);
            expect(result.customers.length).toBeLessThanOrEqual(1);

            // Clean up
            await repository.delete({ business_id: businessId });
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should cap limits above 100 at 100', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 101, max: 1000 }), // limits above max
          async (excessiveLimit) => {
            // Arrange - Create many customers
            const customers = [];
            for (let i = 1; i <= 150; i++) {
              customers.push({
                id: uuidv4(),
                business_id: businessId,
                whatsapp_phone: generateUniqueWhatsAppNumber(),
                name: `Customer ${i}`,
                user_id: null,
                created_at: new Date(Date.now() - i * 1000),
                updated_at: new Date(),
              });
            }
            await repository.save(customers);

            // Act
            const query = new SearchCustomersQuery({
              businessId,
              page: 1,
              limit: excessiveLimit,
            });
            const result = await handler.execute(query);

            // Assert - Property: Limit capped at 100
            expect(result.limit).toBe(100);
            expect(result.customers.length).toBeLessThanOrEqual(100);

            // Clean up
            await repository.delete({ business_id: businessId });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 9: Empty Results
   *
   * Requirements: 4.5
   * Property: Searches with no matches should return empty array with total=0, totalPages=0
   * Iterations: 100+
   */
  describe('Property 9: Empty Results', () => {
    it('should return correct metadata for empty results', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 30 }), // random search text that won't match
          fc.integer({ min: 1, max: 50 }), // page
          fc.integer({ min: 1, max: 50 }), // limit
          async (searchText, page, limit) => {
            // Arrange - Create customers with predictable names
            const customers = [];
            for (let i = 1; i <= 20; i++) {
              customers.push({
                id: uuidv4(),
                business_id: businessId,
                whatsapp_phone: generateUniqueWhatsAppNumber(),
                name: `Customer ${i}`,
                user_id: null,
                created_at: new Date(Date.now() - i * 1000),
                updated_at: new Date(),
              });
            }
            await repository.save(customers);

            // Act - Search with text that won't match
            const nonMatchingSearch = `NONEXISTENT_${searchText}`;
            const query = new SearchCustomersQuery({
              businessId,
              searchText: nonMatchingSearch,
              page,
              limit,
            });
            const result = await handler.execute(query);

            // Assert - Property: Empty results with correct metadata
            expect(result.customers).toHaveLength(0);
            expect(result.total).toBe(0);
            expect(result.totalPages).toBe(0);
            expect(result.page).toBe(page);
            expect(result.limit).toBe(limit);

            // Clean up
            await repository.delete({ business_id: businessId });
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
