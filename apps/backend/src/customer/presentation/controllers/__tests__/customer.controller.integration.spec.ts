import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Module } from '@nestjs/common';
import { CqrsModule, CommandBus, QueryBus } from '@nestjs/cqrs';
import * as request from 'supertest';
import { CustomerModule } from '../../../customer.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from '@shared/shared.module';
import { LoggerModule } from 'nestjs-pino';

// Mock BookingModule to avoid loading its dependencies in tests
@Module({
  providers: [
    {
      provide: 'IAppointmentReadRepository',
      useValue: {
        // Mock implementation - just enough to satisfy DI
        findByCustomerId: jest.fn().mockResolvedValue([]),
      },
    },
  ],
  exports: ['IAppointmentReadRepository'],
})
class MockBookingModule {}

describe('CustomerController (Integration)', () => {
  let app: INestApplication;
  let authToken: string;
  let businessId: string;
  let userId: string;
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let commandBusSpy: jest.SpyInstance;
  let queryBusSpy: jest.SpyInstance;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        LoggerModule.forRoot({
          pinoHttp: {
            level: 'silent', // Disable logging in tests
          },
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'bookings_test',
          autoLoadEntities: true,
          synchronize: true, // Only for tests
        }),
        JwtModule.register({
          secret: process.env.JWT_SECRET || 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        CqrsModule,
        SharedModule, // ← Provides IUnitOfWork
        CustomerModule,
      ],
    })
      .overrideModule(require('@booking/booking.module').BookingModule)
      .useModule(MockBookingModule)
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply global pipes (same as main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    // Get CommandBus and QueryBus instances
    commandBus = moduleFixture.get<CommandBus>(CommandBus);
    queryBus = moduleFixture.get<QueryBus>(QueryBus);

    // Generate test JWT token
    const { JwtService } = require('@nestjs/jwt');
    const jwtService = moduleFixture.get(JwtService);
    businessId = '123e4567-e89b-12d3-a456-426614174000';
    userId = '123e4567-e89b-12d3-a456-426614174001';

    authToken = jwtService.sign({
      sub: userId,
      email: 'test@example.com',
      businessId,
      roles: ['BUSINESS_OWNER'],
    });
  });

  beforeEach(() => {
    // Spy on CommandBus and QueryBus execute methods
    if (commandBus && queryBus) {
      commandBusSpy = jest.spyOn(commandBus, 'execute');
      queryBusSpy = jest.spyOn(queryBus, 'execute');
    }
  });

  afterEach(() => {
    // Clear spies after each test
    if (commandBusSpy) {
      commandBusSpy.mockClear();
    }
    if (queryBusSpy) {
      queryBusSpy.mockClear();
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Authentication', () => {
    it('should return 401 without auth token', async () => {
      const response = await request(app.getHttpServer()).get('/customers/search').expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/search')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });
  });

  describe('GET /customers/search', () => {
    it('should return paginated customers', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('customers');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.customers)).toBe(true);
    });

    it('should filter by search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Juan', page: 1, limit: 10 })
        .expect(200);

      expect(response.body.customers).toBeDefined();
    });

    it('should filter by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'anonymous', page: 1, limit: 10 })
        .expect(200);

      expect(response.body.customers).toBeDefined();
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 0, limit: 10 }) // Invalid page
        .expect(400);

      expect(response.body.message).toContain('page');
    });

    it('should validate limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 101 }) // Exceeds max
        .expect(400);

      expect(response.body.message).toContain('limit');
    });
  });

  describe('GET /customers/stats', () => {
    it('should return customer statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalCustomers');
      expect(response.body).toHaveProperty('anonymousCount');
      expect(response.body).toHaveProperty('registeredCount');
      expect(response.body).toHaveProperty('newThisWeek');
      expect(response.body).toHaveProperty('newThisMonth');
      expect(response.body).toHaveProperty('topCustomers');
      expect(Array.isArray(response.body.topCustomers)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer()).get('/customers/stats').expect(401);
    });
  });

  describe('GET /customers/:id', () => {
    it('should validate UUID format', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain('uuid');
    });

    it('should return 404 for non-existent customer', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
      await request(app.getHttpServer())
        .get(`/customers/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /customers/duplicates', () => {
    it('should return duplicate pairs', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/duplicates')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ threshold: 0.8 })
        .expect(200);

      expect(response.body).toHaveProperty('pairs');
      expect(Array.isArray(response.body.pairs)).toBe(true);
    });

    it('should validate threshold parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/duplicates')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ threshold: 1.5 }) // Invalid threshold
        .expect(400);

      expect(response.body.message).toContain('threshold');
    });

    it('should use default threshold if not provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/duplicates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pairs).toBeDefined();
    });
  });

  describe('POST /customers/merge', () => {
    it('should validate request body', async () => {
      const response = await request(app.getHttpServer())
        .post('/customers/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Missing required fields
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should validate UUID format for sourceId', async () => {
      const response = await request(app.getHttpServer())
        .post('/customers/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sourceId: 'invalid-uuid',
          targetId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .expect(400);

      expect(response.body.message).toContain('uuid');
    });

    it('should validate UUID format for targetId', async () => {
      const response = await request(app.getHttpServer())
        .post('/customers/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sourceId: '123e4567-e89b-12d3-a456-426614174000',
          targetId: 'invalid-uuid',
        })
        .expect(400);

      expect(response.body.message).toContain('uuid');
    });
  });

  describe('DELETE /customers/:id', () => {
    it('should validate UUID format', async () => {
      const response = await request(app.getHttpServer())
        .delete('/customers/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain('uuid');
    });

    it('should return 404 for non-existent customer', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
      await request(app.getHttpServer())
        .delete(`/customers/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /customers/:id/export', () => {
    it('should validate UUID format', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/invalid-uuid/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain('uuid');
    });

    it('should return 404 for non-existent customer', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
      await request(app.getHttpServer())
        .get(`/customers/${nonExistentId}/export`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /customers/by-user/:userId', () => {
    it('should validate UUID format', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/by-user/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain('uuid');
    });

    it('should return empty array for user with no customers', async () => {
      const nonExistentUserId = '123e4567-e89b-12d3-a456-426614174999';
      const response = await request(app.getHttpServer())
        .get(`/customers/by-user/${nonExistentUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('CQRS Integration - Query Dispatching', () => {
    it('should dispatch SearchCustomersQuery with correct parameters', async () => {
      await request(app.getHttpServer())
        .get('/customers/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Juan', page: 1, limit: 10, type: 'anonymous' })
        .expect(200);

      expect(queryBusSpy).toHaveBeenCalledTimes(1);
      const query = queryBusSpy.mock.calls[0][0];
      expect(query.constructor.name).toBe('SearchCustomersQuery');
      expect(query.businessId).toBe(businessId);
      expect(query.filters.search).toBe('Juan');
      expect(query.filters.type).toBe('anonymous');
      expect(query.pagination.page).toBe(1);
      expect(query.pagination.limit).toBe(10);
    });

    it('should dispatch GetCustomerStatsQuery with correct businessId', async () => {
      await request(app.getHttpServer())
        .get('/customers/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(queryBusSpy).toHaveBeenCalledTimes(1);
      const query = queryBusSpy.mock.calls[0][0];
      expect(query.constructor.name).toBe('GetCustomerStatsQuery');
      expect(query.businessId).toBe(businessId);
    });

    it('should dispatch GetCustomerByIdQuery with correct parameters', async () => {
      const customerId = '123e4567-e89b-12d3-a456-426614174002';
      await request(app.getHttpServer())
        .get(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404); // Will 404 but query should be dispatched

      expect(queryBusSpy).toHaveBeenCalledTimes(1);
      const query = queryBusSpy.mock.calls[0][0];
      expect(query.constructor.name).toBe('GetCustomerByIdQuery');
      expect(query.customerId).toBe(customerId);
    });

    it('should dispatch GetCustomersByUserIdQuery with correct parameters', async () => {
      const testUserId = '123e4567-e89b-12d3-a456-426614174003';
      await request(app.getHttpServer())
        .get(`/customers/by-user/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(queryBusSpy).toHaveBeenCalledTimes(1);
      const query = queryBusSpy.mock.calls[0][0];
      expect(query.constructor.name).toBe('GetCustomersByUserIdQuery');
      expect(query.userId).toBe(testUserId);
    });

    it('should dispatch ExportCustomerDataQuery with correct parameters', async () => {
      const customerId = '123e4567-e89b-12d3-a456-426614174004';
      await request(app.getHttpServer())
        .get(`/customers/${customerId}/export`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404); // Will 404 but query should be dispatched

      expect(queryBusSpy).toHaveBeenCalledTimes(1);
      const query = queryBusSpy.mock.calls[0][0];
      expect(query.constructor.name).toBe('ExportCustomerDataQuery');
      expect(query.customerId).toBe(customerId);
    });

    it('should dispatch DetectDuplicateCustomersQuery with correct parameters', async () => {
      await request(app.getHttpServer())
        .get('/customers/duplicates')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ threshold: 0.85 })
        .expect(200);

      expect(queryBusSpy).toHaveBeenCalledTimes(1);
      const query = queryBusSpy.mock.calls[0][0];
      expect(query.constructor.name).toBe('DetectDuplicateCustomersQuery');
      expect(query.businessId).toBe(businessId);
      expect(query.threshold).toBe(0.85);
    });
  });

  describe('CQRS Integration - Command Dispatching', () => {
    it('should dispatch MergeCustomersCommand with correct parameters', async () => {
      const sourceId = '123e4567-e89b-12d3-a456-426614174005';
      const targetId = '123e4567-e89b-12d3-a456-426614174006';

      await request(app.getHttpServer())
        .post('/customers/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sourceId, targetId })
        .expect(404); // Will 404 but command should be dispatched

      expect(commandBusSpy).toHaveBeenCalledTimes(1);
      const command = commandBusSpy.mock.calls[0][0];
      expect(command.constructor.name).toBe('MergeCustomersCommand');
      expect(command.sourceCustomerId).toBe(sourceId);
      expect(command.targetCustomerId).toBe(targetId);
    });

    it('should dispatch DeleteCustomerCommand with correct parameters', async () => {
      const customerId = '123e4567-e89b-12d3-a456-426614174007';

      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404); // Will 404 but command should be dispatched

      expect(commandBusSpy).toHaveBeenCalledTimes(1);
      const command = commandBusSpy.mock.calls[0][0];
      expect(command.constructor.name).toBe('DeleteCustomerCommand');
      expect(command.customerId).toBe(customerId);
    });
  });

  describe('Response Transformation', () => {
    it('should transform search response correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Verify response structure matches SearchCustomersResponseDto
      expect(response.body).toHaveProperty('customers');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('hasNextPage');
      expect(response.body).toHaveProperty('hasPreviousPage');

      // Verify pagination calculations
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.page).toBe('number');
      expect(typeof response.body.limit).toBe('number');
      expect(typeof response.body.totalPages).toBe('number');
      expect(typeof response.body.hasNextPage).toBe('boolean');
      expect(typeof response.body.hasPreviousPage).toBe('boolean');
    });

    it('should transform stats response correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify response structure matches CustomerStatsResponseDto
      expect(response.body).toHaveProperty('totalCustomers');
      expect(response.body).toHaveProperty('anonymousCount');
      expect(response.body).toHaveProperty('registeredCount');
      expect(response.body).toHaveProperty('newThisWeek');
      expect(response.body).toHaveProperty('newThisMonth');
      expect(response.body).toHaveProperty('topCustomers');

      // Verify types
      expect(typeof response.body.totalCustomers).toBe('number');
      expect(typeof response.body.anonymousCount).toBe('number');
      expect(typeof response.body.registeredCount).toBe('number');
      expect(typeof response.body.newThisWeek).toBe('number');
      expect(typeof response.body.newThisMonth).toBe('number');
      expect(Array.isArray(response.body.topCustomers)).toBe(true);
    });

    it('should transform duplicates response correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers/duplicates')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ threshold: 0.8 })
        .expect(200);

      // Verify response structure matches DetectDuplicatesResponseDto
      expect(response.body).toHaveProperty('pairs');
      expect(Array.isArray(response.body.pairs)).toBe(true);

      // If there are pairs, verify their structure
      if (response.body.pairs.length > 0) {
        const pair = response.body.pairs[0];
        expect(pair).toHaveProperty('customer1');
        expect(pair).toHaveProperty('customer2');
        expect(pair).toHaveProperty('similarityScore');
        expect(typeof pair.similarityScore).toBe('number');
      }
    });

    it('should transform merge response correctly', async () => {
      const sourceId = '123e4567-e89b-12d3-a456-426614174008';
      const targetId = '123e4567-e89b-12d3-a456-426614174009';

      const response = await request(app.getHttpServer())
        .post('/customers/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sourceId, targetId })
        .expect(404); // Will 404 but we can check error structure

      // Even on error, response should be properly formatted
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode');
    });
  });
});
