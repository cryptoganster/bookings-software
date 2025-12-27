import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../../app.module';
import { E2EAuthHelper, E2EDatabaseHelper, UserRole } from '@test-utils/helpers';

describe('Offering CRUD Controller E2E', () => {
  let app: INestApplication;
  let authHelper: E2EAuthHelper;
  let dbHelper: E2EDatabaseHelper;
  let authToken: string;
  let userId: string;
  let businessId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Set global prefix like in main.ts
    app.setGlobalPrefix('api');

    await app.init();

    // Setup database
    const dataSource = app.get(DataSource);
    dbHelper = new E2EDatabaseHelper(dataSource);
    await dbHelper.setup();

    // Clean up offerings and businesses from previous test runs
    await dataSource.query('TRUNCATE TABLE offerings CASCADE;');
    await dataSource.query('TRUNCATE TABLE businesses CASCADE;');

    // Wait a bit to ensure truncate completes
    await new Promise((resolve) => setTimeout(resolve, 100));

    authHelper = new E2EAuthHelper(app);

    // Create test user with BUSINESS_OWNER role and business via API
    const testUser = await authHelper.createBusinessOwner({
      name: 'Test Business',
    });

    authToken = testUser.token;
    userId = testUser.id;
    businessId = testUser.businessId;

    if (!businessId) {
      throw new Error('Failed to create business for test user');
    }
  });

  afterAll(async () => {
    await authHelper.cleanupTestUsers();
    if (dbHelper) {
      await dbHelper.cleanup();
    }
    await app.close();
  });

  afterEach(async () => {
    // Clean up offerings after each test
    if (dbHelper) {
      const dataSource = app.get(DataSource);
      await dataSource.query('TRUNCATE TABLE offerings CASCADE;');
    }
  });

  describe('POST /api/offerings', () => {
    it('should create a new offering', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Haircut',
          durationMinutes: 30,
          maxCapacityPerSlot: 1,
          maxDailyCapacity: 10,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('offeringId');
      expect(typeof response.body.offeringId).toBe('string');
    });

    it('should create offering without maxDailyCapacity', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Haircut',
          durationMinutes: 30,
          maxCapacityPerSlot: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('offeringId');
    });

    it('should reject invalid duration (less than 15 minutes)', async () => {
      await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Quick Service',
          durationMinutes: 10,
          maxCapacityPerSlot: 1,
        })
        .expect(400);
    });

    it('should reject invalid capacity (less than 1)', async () => {
      await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Service',
          durationMinutes: 30,
          maxCapacityPerSlot: 0,
        })
        .expect(400);
    });

    it('should reject missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Service',
          // Missing durationMinutes and maxCapacityPerSlot
        })
        .expect(400);
    });

    it('should reject empty name', async () => {
      await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '',
          durationMinutes: 30,
          maxCapacityPerSlot: 1,
        })
        .expect(400);
    });

    it('should reject non-integer duration', async () => {
      await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Service',
          durationMinutes: 30.5,
          maxCapacityPerSlot: 1,
        })
        .expect(400);
    });
  });

  describe('GET /api/offerings', () => {
    let offeringId1: string;
    let offeringId2: string;

    beforeEach(async () => {
      // Create multiple offerings
      const response1 = await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Haircut',
          durationMinutes: 30,
          maxCapacityPerSlot: 1,
        });

      offeringId1 = response1.body.offeringId;

      const response2 = await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Hair Wash',
          durationMinutes: 15,
          maxCapacityPerSlot: 2,
        });

      offeringId2 = response2.body.offeringId;
    });

    it('should return all offerings for business', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body.some((o: any) => o.id === offeringId1)).toBe(true);
      expect(response.body.some((o: any) => o.id === offeringId2)).toBe(true);
    });

    it('should include offering details', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const offering = response.body.find((o: any) => o.id === offeringId1);
      expect(offering).toHaveProperty('name', 'Haircut');
      expect(offering).toHaveProperty('duration', 30);
      expect(offering).toHaveProperty('maxCapacityPerSlot', 1);
      expect(offering).toHaveProperty('isActive', true);
    });
  });

  describe('GET /api/offerings/active', () => {
    let activeOfferingId: string;
    let inactiveOfferingId: string;

    beforeEach(async () => {
      // Create active offering
      const activeResponse = await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Active Service',
          durationMinutes: 30,
          maxCapacityPerSlot: 1,
        });

      activeOfferingId = activeResponse.body.offeringId;

      // Create inactive offering
      const inactiveResponse = await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Inactive Service',
          durationMinutes: 30,
          maxCapacityPerSlot: 1,
        });

      inactiveOfferingId = inactiveResponse.body.offeringId;

      // Deactivate the second offering
      await request(app.getHttpServer())
        .delete(`/api/offerings/${inactiveOfferingId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should return only active offerings', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/offerings/active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((o: any) => o.id === activeOfferingId)).toBe(true);
      expect(response.body.some((o: any) => o.id === inactiveOfferingId)).toBe(false);
      response.body.forEach((offering: any) => {
        expect(offering.isActive).toBe(true);
      });
    });
  });

  describe('GET /api/offerings/:id', () => {
    let offeringId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Get Test Offering',
          durationMinutes: 45,
          maxCapacityPerSlot: 2,
          maxDailyCapacity: 20,
        });

      offeringId = response.body.offeringId;
    });

    it('should return offering by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/offerings/${offeringId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', offeringId);
      expect(response.body).toHaveProperty('name', 'Get Test Offering');
      expect(response.body).toHaveProperty('duration', 45);
      expect(response.body).toHaveProperty('maxCapacityPerSlot', 2);
      expect(response.body).toHaveProperty('maxDailyCapacity', 20);
    });

    it('should return 404 for non-existent offering', async () => {
      await request(app.getHttpServer())
        .get('/api/offerings/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/offerings/:id', () => {
    let offeringId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Update Test Offering',
          durationMinutes: 30,
          maxCapacityPerSlot: 1,
        });

      offeringId = response.body.offeringId;
    });

    it('should update offering', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/offerings/${offeringId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Offering',
          durationMinutes: 60,
          maxCapacityPerSlot: 2,
          maxDailyCapacity: 15,
        })
        .expect(200);

      // Verify update
      const getResponse = await request(app.getHttpServer())
        .get(`/api/offerings/${offeringId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.name).toBe('Updated Offering');
      expect(getResponse.body.duration).toBe(60);
      expect(getResponse.body.maxCapacityPerSlot).toBe(2);
      expect(getResponse.body.maxDailyCapacity).toBe(15);
    });

    it('should reject invalid duration on update', async () => {
      await request(app.getHttpServer())
        .put(`/api/offerings/${offeringId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Offering',
          durationMinutes: 10, // Invalid: less than 15
          maxCapacityPerSlot: 1,
        })
        .expect(400);
    });

    it('should reject invalid capacity on update', async () => {
      await request(app.getHttpServer())
        .put(`/api/offerings/${offeringId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Offering',
          durationMinutes: 30,
          maxCapacityPerSlot: 0, // Invalid: less than 1
        })
        .expect(400);
    });

    it('should return 404 for non-existent offering', async () => {
      await request(app.getHttpServer())
        .put('/api/offerings/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated',
          durationMinutes: 30,
          maxCapacityPerSlot: 1,
        })
        .expect(404);
    });
  });

  describe('DELETE /api/offerings/:id', () => {
    let offeringId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Delete Test Offering',
          durationMinutes: 30,
          maxCapacityPerSlot: 1,
        });

      offeringId = response.body.offeringId;
    });

    it('should deactivate offering', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/offerings/${offeringId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deactivation
      const getResponse = await request(app.getHttpServer())
        .get(`/api/offerings/${offeringId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.isActive).toBe(false);
    });

    it('should be idempotent', async () => {
      // Deactivate first time
      await request(app.getHttpServer())
        .delete(`/api/offerings/${offeringId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Deactivate again
      await request(app.getHttpServer())
        .delete(`/api/offerings/${offeringId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent offering', async () => {
      await request(app.getHttpServer())
        .delete('/api/offerings/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/offerings/:id/active', () => {
    let offeringId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Toggle Test Offering',
          durationMinutes: 30,
          maxCapacityPerSlot: 1,
        });

      offeringId = response.body.offeringId;
    });

    it('should deactivate offering via toggle', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/offerings/${offeringId}/active`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isActive: false,
        })
        .expect(200);

      // Verify deactivation
      const getResponse = await request(app.getHttpServer())
        .get(`/api/offerings/${offeringId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.isActive).toBe(false);
    });

    it('should activate offering via toggle', async () => {
      // First deactivate
      await request(app.getHttpServer())
        .patch(`/api/offerings/${offeringId}/active`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isActive: false,
        });

      // Then activate
      const response = await request(app.getHttpServer())
        .patch(`/api/offerings/${offeringId}/active`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isActive: true,
        })
        .expect(200);

      // Verify activation
      const getResponse = await request(app.getHttpServer())
        .get(`/api/offerings/${offeringId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.isActive).toBe(true);
    });

    it('should be idempotent', async () => {
      // Deactivate first time
      await request(app.getHttpServer())
        .patch(`/api/offerings/${offeringId}/active`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isActive: false,
        })
        .expect(200);

      // Deactivate again
      await request(app.getHttpServer())
        .patch(`/api/offerings/${offeringId}/active`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isActive: false,
        })
        .expect(200);
    });

    it('should return 404 for non-existent offering', async () => {
      await request(app.getHttpServer())
        .patch('/api/offerings/00000000-0000-0000-0000-000000000000/active')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isActive: false,
        })
        .expect(404);
    });
  });

  describe('Authorization', () => {
    it('should reject requests without token', async () => {
      await request(app.getHttpServer())
        .post('/api/offerings')
        .send({
          name: 'Service',
          durationMinutes: 30,
          maxCapacityPerSlot: 1,
        })
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          name: 'Service',
          durationMinutes: 30,
          maxCapacityPerSlot: 1,
        })
        .expect(401);
    });

    it('should reject GET without token', async () => {
      await request(app.getHttpServer()).get('/api/offerings').expect(401);
    });

    it('should reject GET /active without token', async () => {
      await request(app.getHttpServer()).get('/api/offerings/active').expect(401);
    });
  });

  describe('Validation', () => {
    it('should reject extra fields', async () => {
      await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Service',
          durationMinutes: 30,
          maxCapacityPerSlot: 1,
          extraField: 'should be rejected',
        })
        .expect(400);
    });

    it('should reject non-numeric duration', async () => {
      await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Service',
          durationMinutes: 'thirty',
          maxCapacityPerSlot: 1,
        })
        .expect(400);
    });

    it('should reject non-numeric capacity', async () => {
      await request(app.getHttpServer())
        .post('/api/offerings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Service',
          durationMinutes: 30,
          maxCapacityPerSlot: 'one',
        })
        .expect(400);
    });
  });
});
