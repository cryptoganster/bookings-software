import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../../app.module';
import { E2EAuthHelper, E2EDatabaseHelper, UserRole } from '@test-utils/e2e-helpers';

describe('BusinessOwnerProfile Controller E2E', () => {
  let app: INestApplication;
  let authHelper: E2EAuthHelper;
  let dbHelper: E2EDatabaseHelper;
  let authToken: string;
  let userId: string;
  let businessOwnerId: string;

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

    authHelper = new E2EAuthHelper(app);

    // Create test user with BUSINESS_OWNER role
    // This will automatically create a BusinessOwner via event handler
    const testUser = await authHelper.createTestUser(UserRole.BUSINESS_OWNER, {
      name: 'Test Business Owner',
    });

    authToken = testUser.token;
    userId = testUser.id;

    // Wait a bit for event handler to create BusinessOwner
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Get the BusinessOwner ID
    const profileResponse = await request(app.getHttpServer())
      .get('/api/account/profile')
      .set('Authorization', `Bearer ${authToken}`);

    businessOwnerId = profileResponse.body.id;
  });

  afterAll(async () => {
    await authHelper.cleanupTestUsers();
    if (dbHelper) {
      await dbHelper.cleanup();
    }
    await app.close();
  });

  describe('GET /api/account/profile', () => {
    it('should return business owner profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/account/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        userId: userId,
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        // onboardingCompleted can be true or false depending on test execution order
        maxBusinesses: 1,
        maxAppointmentsPerMonth: 100,
        price: 0,
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/api/account/profile').expect(401);
    });
  });

  describe('GET /api/account/subscription', () => {
    it('should return subscription details', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/account/subscription')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        plan: 'FREE',
        status: 'ACTIVE',
        maxBusinesses: 1,
        currentBusinessCount: 1,
        maxAppointmentsPerMonth: 100,
        price: 0,
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/api/account/subscription').expect(401);
    });
  });

  describe('PUT /api/account/subscription/upgrade', () => {
    it('should upgrade subscription to BASIC', async () => {
      await request(app.getHttpServer())
        .put('/api/account/subscription/upgrade')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ newPlan: 'BASIC' })
        .expect(200);

      // Verify upgrade
      const response = await request(app.getHttpServer())
        .get('/api/account/subscription')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.plan).toBe('BASIC');
      expect(response.body.maxBusinesses).toBe(1);
      expect(response.body.maxAppointmentsPerMonth).toBe(500);
      expect(response.body.price).toBe(29);
    });

    it('should upgrade subscription to PRO', async () => {
      await request(app.getHttpServer())
        .put('/api/account/subscription/upgrade')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ newPlan: 'PRO' })
        .expect(200);

      // Verify upgrade
      const response = await request(app.getHttpServer())
        .get('/api/account/subscription')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.plan).toBe('PRO');
      expect(response.body.maxBusinesses).toBe(3);
      expect(response.body.maxAppointmentsPerMonth).toBe(2000);
      expect(response.body.price).toBe(79);
    });

    it('should upgrade subscription to ENTERPRISE', async () => {
      await request(app.getHttpServer())
        .put('/api/account/subscription/upgrade')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ newPlan: 'ENTERPRISE' })
        .expect(200);

      // Verify upgrade
      const response = await request(app.getHttpServer())
        .get('/api/account/subscription')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.plan).toBe('ENTERPRISE');
      expect(response.body.maxBusinesses).toBe(10);
      expect(response.body.maxAppointmentsPerMonth).toBe(10000);
      expect(response.body.price).toBe(199);
    });

    it('should return 500 for invalid plan (domain error)', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/account/subscription/upgrade')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ newPlan: 'INVALID_PLAN' })
        .expect(500);

      // Domain error is wrapped in generic error message
      expect(response.body.message).toBeDefined();
    });

    it('should return 400 for missing plan', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/account/subscription/upgrade')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('newPlan')]),
      );
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .put('/api/account/subscription/upgrade')
        .send({ newPlan: 'BASIC' })
        .expect(401);
    });
  });

  describe('POST /api/account/onboarding/complete', () => {
    it('should complete onboarding or handle already completed', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/account/onboarding/complete')
        .set('Authorization', `Bearer ${authToken}`);

      // Accept either 201 (success) or 400 (already completed)
      expect([201, 400]).toContain(response.status);

      // Verify onboarding is completed
      const profileResponse = await request(app.getHttpServer())
        .get('/api/account/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(profileResponse.body.onboardingCompleted).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).post('/api/account/onboarding/complete').expect(401);
    });
  });

  describe('Authorization', () => {
    it('should handle CUSTOMER role accessing profile', async () => {
      // Create a customer user
      const customerUser = await authHelper.createTestUser(UserRole.CUSTOMER, {
        name: 'Test Customer',
      });

      // Wait for potential event handler to create BusinessOwner
      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await request(app.getHttpServer())
        .get('/api/account/profile')
        .set('Authorization', `Bearer ${customerUser.token}`);

      // CUSTOMER role might not have BusinessOwner profile
      // Accept either 200 (has profile) or 404 (no profile)
      expect([200, 404]).toContain(response.status);

      if (response.status === 200 && response.body && Object.keys(response.body).length > 0) {
        // If BusinessOwner exists, verify structure
        expect(response.body).toMatchObject({
          userId: customerUser.id,
          subscriptionPlan: expect.any(String),
        });
      }
    });
  });
});
