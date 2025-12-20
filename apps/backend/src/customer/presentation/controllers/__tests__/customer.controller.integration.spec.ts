import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import * as request from 'supertest';
import { CustomerModule } from '../../../customer.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from '@shared/shared.module';

describe('CustomerController (Integration)', () => {
  let app: INestApplication;
  let authToken: string;
  let businessId: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
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
    }).compile();

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

    // Generate test JWT token
    const jwtService = moduleFixture.get('JwtService');
    businessId = '123e4567-e89b-12d3-a456-426614174000';
    userId = '123e4567-e89b-12d3-a456-426614174001';

    authToken = jwtService.sign({
      sub: userId,
      email: 'test@example.com',
      businessId,
      roles: ['BUSINESS_OWNER'],
    });
  });

  afterAll(async () => {
    await app.close();
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
});
