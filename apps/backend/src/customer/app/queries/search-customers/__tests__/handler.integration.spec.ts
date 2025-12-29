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
} from '@test-utils/helpers';
import { v4 as uuidv4 } from 'uuid';

describe('SearchCustomersHandler - Integration Tests', () => {
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
          synchronize: false, // Migrations already run in global setup
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

    // Create test user first
    userId = uuidv4();
    await createTestUserInDb(dataSource, userId);

    // Create test business with the user as owner
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

  describe('Task 5.1: Pagination returns different results on different pages', () => {
    /**
     * Requirement: 1.1, 1.2, 1.3
     * Property: No duplicate records across pages
     */
    it('should return different customers on pages 1, 2, and 3', async () => {
      // Arrange - Create 36 customers
      const customers = [];
      for (let i = 1; i <= 36; i++) {
        customers.push({
          id: uuidv4(),
          business_id: businessId,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: `Customer ${i}`,
          user_id: null,
          created_at: new Date(Date.now() - i * 1000), // Different timestamps for consistent ordering
          updated_at: new Date(),
        });
      }
      await repository.save(customers);

      // Act - Fetch pages 1, 2, 3 with limit 12
      const query1 = new SearchCustomersQuery({
        businessId,
        page: 1,
        limit: 12,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });
      const query2 = new SearchCustomersQuery({
        businessId,
        page: 2,
        limit: 12,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });
      const query3 = new SearchCustomersQuery({
        businessId,
        page: 3,
        limit: 12,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      const result1 = await handler.execute(query1);
      const result2 = await handler.execute(query2);
      const result3 = await handler.execute(query3);

      // Assert - Verify different customers on each page
      expect(result1.customers).toHaveLength(12);
      expect(result2.customers).toHaveLength(12);
      expect(result3.customers).toHaveLength(12);

      // Extract customer IDs
      const ids1 = result1.customers.map((c) => c.id);
      const ids2 = result2.customers.map((c) => c.id);
      const ids3 = result3.customers.map((c) => c.id);

      // Verify no overlaps
      const allIds = [...ids1, ...ids2, ...ids3];
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(36); // All IDs should be unique

      // Verify no customer appears on multiple pages
      ids1.forEach((id) => {
        expect(ids2).not.toContain(id);
        expect(ids3).not.toContain(id);
      });
      ids2.forEach((id) => {
        expect(ids3).not.toContain(id);
      });
    });

    it('should return correct total and totalPages metadata', async () => {
      // Arrange - Create 36 customers
      const customers = [];
      for (let i = 1; i <= 36; i++) {
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
        limit: 12,
      });
      const result = await handler.execute(query);

      // Assert
      expect(result.total).toBe(36);
      expect(result.totalPages).toBe(3); // Math.ceil(36 / 12) = 3
      expect(result.page).toBe(1);
      expect(result.limit).toBe(12);
    });
  });

  describe('Task 5.2: Pagination with search filters', () => {
    /**
     * Requirements: 2.1, 2.2
     * Property: Search consistency
     */
    it('should return different results on different pages with text filter', async () => {
      // Arrange - Create 24 customers with "Smith" in name
      const customers = [];
      for (let i = 1; i <= 24; i++) {
        customers.push({
          id: uuidv4(),
          business_id: businessId,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: `John Smith ${i}`,
          user_id: null,
          created_at: new Date(Date.now() - i * 1000),
          updated_at: new Date(),
        });
      }
      // Add 12 customers without "Smith"
      for (let i = 25; i <= 36; i++) {
        customers.push({
          id: uuidv4(),
          business_id: businessId,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: `Jane Doe ${i}`,
          user_id: null,
          created_at: new Date(Date.now() - i * 1000),
          updated_at: new Date(),
        });
      }
      await repository.save(customers);

      // Act - Search for "Smith" with pagination
      const query1 = new SearchCustomersQuery({
        businessId,
        searchText: 'Smith',
        page: 1,
        limit: 12,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });
      const query2 = new SearchCustomersQuery({
        businessId,
        searchText: 'Smith',
        page: 2,
        limit: 12,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      const result1 = await handler.execute(query1);
      const result2 = await handler.execute(query2);

      // Assert
      expect(result1.total).toBe(24); // Only "Smith" customers
      expect(result1.customers).toHaveLength(12);
      expect(result2.customers).toHaveLength(12);

      // Verify no overlaps
      const ids1 = result1.customers.map((c) => c.id);
      const ids2 = result2.customers.map((c) => c.id);
      ids1.forEach((id) => {
        expect(ids2).not.toContain(id);
      });

      // Verify all results contain "Smith"
      result1.customers.forEach((c) => {
        expect(c.name).toContain('Smith');
      });
      result2.customers.forEach((c) => {
        expect(c.name).toContain('Smith');
      });
    });

    it('should filter by type (anonymous/registered) with pagination', async () => {
      // Arrange - Create a test user for registered customers
      const registeredUserId = uuidv4();
      await createTestUserInDb(dataSource, registeredUserId);

      // Create 12 anonymous and 12 registered customers
      const customers = [];
      for (let i = 1; i <= 12; i++) {
        customers.push({
          id: uuidv4(),
          business_id: businessId,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: `Anonymous ${i}`,
          user_id: null, // Anonymous
          created_at: new Date(Date.now() - i * 1000),
          updated_at: new Date(),
        });
      }
      for (let i = 1; i <= 12; i++) {
        customers.push({
          id: uuidv4(),
          business_id: businessId,
          whatsapp_phone: generateUniqueWhatsAppNumber(),
          name: `Registered ${i}`,
          user_id: registeredUserId, // Registered (all linked to same user for simplicity)
          created_at: new Date(Date.now() - (i + 12) * 1000),
          updated_at: new Date(),
        });
      }
      await repository.save(customers);

      // Act - Filter by anonymous
      const query = new SearchCustomersQuery({
        businessId,
        type: 'anonymous',
        page: 1,
        limit: 12,
      });
      const result = await handler.execute(query);

      // Assert
      expect(result.total).toBe(12);
      expect(result.customers).toHaveLength(12);
      result.customers.forEach((c) => {
        expect(c.userId).toBeNull();
      });
    });
  });

  describe('Task 5.3: Pagination with sorting', () => {
    /**
     * Requirements: 3.1, 3.2, 3.3
     * Property: Stable sorting
     */
    it('should maintain consistent ordering across pages when sorting by name', async () => {
      // Arrange - Create customers with duplicate names
      const customers = [];
      for (let i = 1; i <= 24; i++) {
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

      // Act - Fetch pages 1 and 2 with name sorting
      const query1 = new SearchCustomersQuery({
        businessId,
        page: 1,
        limit: 12,
        sortBy: 'name',
        sortOrder: 'ASC',
      });
      const query2 = new SearchCustomersQuery({
        businessId,
        page: 2,
        limit: 12,
        sortBy: 'name',
        sortOrder: 'ASC',
      });

      const result1 = await handler.execute(query1);
      const result2 = await handler.execute(query2);

      // Assert - Verify no overlaps (stable sorting)
      const ids1 = result1.customers.map((c) => c.id);
      const ids2 = result2.customers.map((c) => c.id);
      ids1.forEach((id) => {
        expect(ids2).not.toContain(id);
      });

      // Verify ordering is consistent (names should be in order)
      const allNames = [
        ...result1.customers.map((c) => c.name),
        ...result2.customers.map((c) => c.name),
      ];
      const sortedNames = [...allNames].sort();
      expect(allNames).toEqual(sortedNames);
    });
  });

  describe('Task 5.4: Edge case - page beyond total', () => {
    /**
     * Requirement: 4.1
     * Property: Page beyond total
     */
    it('should return empty array when requesting page beyond total', async () => {
      // Arrange - Create 10 customers
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

      // Act - Request page 5 with limit 12 (only 1 page exists)
      const query = new SearchCustomersQuery({
        businessId,
        page: 5,
        limit: 12,
      });
      const result = await handler.execute(query);

      // Assert
      expect(result.customers).toHaveLength(0);
      expect(result.total).toBe(10);
      expect(result.totalPages).toBe(1); // Math.ceil(10 / 12) = 1
      expect(result.page).toBe(5);
    });
  });

  describe('Task 5.5: Edge case - no matching records', () => {
    /**
     * Requirement: 4.5
     * Property: Empty results
     */
    it('should return empty array with total=0 when no customers match filter', async () => {
      // Arrange - Create customers without "Nonexistent" in name
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

      // Act - Search for "Nonexistent"
      const query = new SearchCustomersQuery({
        businessId,
        searchText: 'Nonexistent',
        page: 1,
        limit: 12,
      });
      const result = await handler.execute(query);

      // Assert
      expect(result.customers).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should return empty array when business has no customers', async () => {
      // Arrange - No customers for this business
      const emptyBusinessId = uuidv4();

      // Act
      const query = new SearchCustomersQuery({
        businessId: emptyBusinessId,
        page: 1,
        limit: 12,
      });
      const result = await handler.execute(query);

      // Assert
      expect(result.customers).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });
});
