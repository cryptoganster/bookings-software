import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../../app.module';
import { E2EAuthHelper } from '@test-utils/e2e/auth-helper';
import { UserRole } from '@test-utils/e2e/types';

describe('Business Controller E2E', () => {
  let app: INestApplication;
  let authHelper: E2EAuthHelper;
  let authToken: string;
  let userId: string;

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

    await app.init();

    authHelper = new E2EAuthHelper(app);

    // Create test user with BUSINESS_OWNER role
    const testUser = await authHelper.createTestUser(UserRole.BUSINESS_OWNER, {
      name: 'Business Owner',
    });

    authToken = testUser.token;
    userId = testUser.id;
  });

  afterAll(async () => {
    await authHelper.cleanupTestUsers();
    await app.close();
  });

  describe('POST /api/businesses', () => {
    it('should create a new business', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Business',
          whatsappNumber: '+18095551234',
          address: {
            street: '123 Main St',
            city: 'Santo Domingo',
            state: 'DN',
            country: 'Dominican Republic',
            postalCode: '10101',
          },
          timezone: 'America/Santo_Domingo',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(typeof response.body.id).toBe('string');
    });

    it('should reject duplicate WhatsApp number', async () => {
      // Create first business
      await request(app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'First Business',
          whatsappNumber: '+18095559999',
          address: {
            street: '123 Main St',
            city: 'Santo Domingo',
            country: 'Dominican Republic',
          },
          timezone: 'America/Santo_Domingo',
        })
        .expect(201);

      // Try to create second business with same WhatsApp
      await request(app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Second Business',
          whatsappNumber: '+18095559999',
          address: {
            street: '456 Other St',
            city: 'Santiago',
            country: 'Dominican Republic',
          },
          timezone: 'America/Santo_Domingo',
        })
        .expect(409);
    });

    it('should reject invalid WhatsApp format', async () => {
      await request(app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Business',
          whatsappNumber: '1234567890', // Missing +
          address: {
            street: '123 Main St',
            city: 'Santo Domingo',
            country: 'Dominican Republic',
          },
          timezone: 'America/Santo_Domingo',
        })
        .expect(400);
    });

    it('should reject invalid timezone', async () => {
      await request(app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Business',
          whatsappNumber: '+18095551111',
          address: {
            street: '123 Main St',
            city: 'Santo Domingo',
            country: 'Dominican Republic',
          },
          timezone: 'Invalid/Timezone',
        })
        .expect(400);
    });

    it('should reject missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Business',
          // Missing whatsappNumber, address, timezone
        })
        .expect(400);
    });
  });

  describe('GET /api/businesses/:id', () => {
    let businessId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Get Test Business',
          whatsappNumber: '+18095552222',
          address: {
            street: '123 Main St',
            city: 'Santo Domingo',
            country: 'Dominican Republic',
          },
          timezone: 'America/Santo_Domingo',
        });

      businessId = response.body.id;
    });

    it('should return business by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', businessId);
      expect(response.body).toHaveProperty('name', 'Get Test Business');
      expect(response.body).toHaveProperty('whatsappPhone', '+18095552222');
      expect(response.body).toHaveProperty('ownerId', userId);
    });

    it('should return 404 for non-existent business', async () => {
      await request(app.getHttpServer())
        .get('/api/businesses/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/businesses', () => {
    beforeAll(async () => {
      // Create multiple businesses for the user
      await request(app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Business 1',
          whatsappNumber: '+18095553333',
          address: {
            street: '123 Main St',
            city: 'Santo Domingo',
            country: 'Dominican Republic',
          },
          timezone: 'America/Santo_Domingo',
        });

      await request(app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Business 2',
          whatsappNumber: '+18095554444',
          address: {
            street: '456 Other St',
            city: 'Santiago',
            country: 'Dominican Republic',
          },
          timezone: 'America/Santo_Domingo',
        });
    });

    it('should return all businesses for current user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      response.body.forEach((business: any) => {
        expect(business).toHaveProperty('ownerId', userId);
      });
    });
  });

  describe('PUT /api/businesses/:id', () => {
    let businessId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Update Test Business',
          whatsappNumber: '+18095555555',
          address: {
            street: '123 Main St',
            city: 'Santo Domingo',
            country: 'Dominican Republic',
          },
          timezone: 'America/Santo_Domingo',
        });

      businessId = response.body.id;
    });

    it('should update business information', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Business Name',
          address: {
            street: '456 New St',
            city: 'Santiago',
            country: 'Dominican Republic',
          },
          timezone: 'America/New_York',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify update
      const getResponse = await request(app.getHttpServer())
        .get(`/api/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.name).toBe('Updated Business Name');
      expect(getResponse.body.timezone).toBe('America/New_York');
    });

    it('should reject invalid timezone on update', async () => {
      await request(app.getHttpServer())
        .put(`/api/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Business',
          address: {
            street: '123 Main St',
            city: 'Santo Domingo',
            country: 'Dominican Republic',
          },
          timezone: 'Invalid/Timezone',
        })
        .expect(400);
    });
  });

  describe('PUT /api/businesses/:id/whatsapp', () => {
    let businessId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'WhatsApp Test Business',
          whatsappNumber: '+18095556666',
          address: {
            street: '123 Main St',
            city: 'Santo Domingo',
            country: 'Dominican Republic',
          },
          timezone: 'America/Santo_Domingo',
        });

      businessId = response.body.id;
    });

    it('should configure WhatsApp number', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/businesses/${businessId}/whatsapp`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          whatsappNumber: '+18095557777',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify update
      const getResponse = await request(app.getHttpServer())
        .get(`/api/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.whatsappPhone).toBe('+18095557777');
    });

    it('should reject duplicate WhatsApp number', async () => {
      // Create another business
      const response = await request(app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Another Business',
          whatsappNumber: '+18095558888',
          address: {
            street: '123 Main St',
            city: 'Santo Domingo',
            country: 'Dominican Republic',
          },
          timezone: 'America/Santo_Domingo',
        });

      const anotherBusinessId = response.body.id;

      // Try to update to existing WhatsApp
      await request(app.getHttpServer())
        .put(`/api/businesses/${anotherBusinessId}/whatsapp`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          whatsappNumber: '+18095557777', // Already used by businessId
        })
        .expect(409);
    });

    it('should reject invalid WhatsApp format', async () => {
      await request(app.getHttpServer())
        .put(`/api/businesses/${businessId}/whatsapp`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          whatsappNumber: '1234567890', // Missing +
        })
        .expect(400);
    });
  });

  describe('DELETE /api/businesses/:id', () => {
    let businessId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Deactivate Test Business',
          whatsappNumber: '+18095559000',
          address: {
            street: '123 Main St',
            city: 'Santo Domingo',
            country: 'Dominican Republic',
          },
          timezone: 'America/Santo_Domingo',
        });

      businessId = response.body.id;
    });

    it('should deactivate business', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify deactivation
      const getResponse = await request(app.getHttpServer())
        .get(`/api/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.isActive).toBe(false);
    });

    it('should be idempotent', async () => {
      // Deactivate again
      await request(app.getHttpServer())
        .delete(`/api/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('POST /api/businesses/:id/activate', () => {
    let businessId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Activate Test Business',
          whatsappNumber: '+18095559100',
          address: {
            street: '123 Main St',
            city: 'Santo Domingo',
            country: 'Dominican Republic',
          },
          timezone: 'America/Santo_Domingo',
        });

      businessId = response.body.id;

      // Deactivate first
      await request(app.getHttpServer())
        .delete(`/api/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should activate business', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/businesses/${businessId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify activation
      const getResponse = await request(app.getHttpServer())
        .get(`/api/businesses/${businessId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.isActive).toBe(true);
    });

    it('should be idempotent', async () => {
      // Activate again
      await request(app.getHttpServer())
        .post(`/api/businesses/${businessId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      await request(app.getHttpServer()).post('/api/businesses').send({}).expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/api/businesses')
        .set('Authorization', 'Bearer invalid-token')
        .send({})
        .expect(401);
    });
  });
});
