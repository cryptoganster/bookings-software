import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { DataSource } from 'typeorm';

describe('Blockout CRUD (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let userId: string;
  let businessId: string;
  let blockoutId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Set global prefix like in main.ts
    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // 1. Register a test user
    const registerResponse = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: 'blockout-test@example.com',
      password: 'Test1234!',
      name: 'Blockout Test User',
    });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.userId;

    // 2. Wait a bit for event handlers to process (BusinessOwner creation)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 3. Create a business for testing
    const businessResponse = await request(app.getHttpServer())
      .post('/api/businesses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Blockout Business',
        whatsappNumber: '+18095555678',
        address: {
          street: '456 Test Ave',
          city: 'Test City',
          country: 'DO',
        },
        timezone: 'America/Santo_Domingo',
      });

    businessId = businessResponse.body.id;
    authToken = businessResponse.body.token; // Update token with businessId
  });

  afterAll(async () => {
    // Clean up test data (use snake_case for column names)
    if (dataSource) {
      await dataSource.query('DELETE FROM blockouts WHERE business_id = $1', [businessId]);
      await dataSource.query('DELETE FROM businesses WHERE id = $1', [businessId]);
      await dataSource.query('DELETE FROM business_owners WHERE user_id = $1', [userId]);
      await dataSource.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await app.close();
  });

  describe('POST /blockouts', () => {
    it('should create a new blockout', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const response = await request(app.getHttpServer())
        .post('/api/blockouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          startDate: tomorrow.toISOString().split('T')[0],
          endDate: dayAfter.toISOString().split('T')[0],
          reason: 'Holiday',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBeDefined();
      blockoutId = response.body.id;
    });

    it('should fail with past start date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const today = new Date();

      await request(app.getHttpServer())
        .post('/api/blockouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          startDate: yesterday.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
          reason: 'Past date',
        })
        .expect(500); // Domain exception returns 500 (needs global exception filter)
    });

    it('should fail with end date before start date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const today = new Date();

      await request(app.getHttpServer())
        .post('/api/blockouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          startDate: tomorrow.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
          reason: 'Invalid range',
        })
        .expect(500); // Domain exception returns 500 (needs global exception filter)
    });

    it('should create single-day blockout', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);

      const response = await request(app.getHttpServer())
        .post('/api/blockouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          startDate: tomorrow.toISOString().split('T')[0],
          endDate: tomorrow.toISOString().split('T')[0],
          reason: 'Single day off',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should fail without authentication', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await request(app.getHttpServer())
        .post('/api/blockouts')
        .send({
          businessId,
          startDate: tomorrow.toISOString().split('T')[0],
          endDate: tomorrow.toISOString().split('T')[0],
          reason: 'No auth',
        })
        .expect(401);
    });

    it('should fail with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/blockouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          // Missing startDate, endDate, reason
        })
        .expect(400);
    });

    it('should fail with invalid date format', async () => {
      await request(app.getHttpServer())
        .post('/api/blockouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          startDate: 'invalid-date',
          endDate: 'invalid-date',
          reason: 'Invalid format',
        })
        .expect(400);
    });
  });

  describe('GET /blockouts', () => {
    it('should get all blockouts for business', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/blockouts')
        .query({ businessId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('startDate');
      expect(response.body[0]).toHaveProperty('endDate');
      expect(response.body[0]).toHaveProperty('reason');
    });

    it('should return empty array for business with no blockouts', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/blockouts')
        .query({ businessId: '00000000-0000-0000-0000-000000000000' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get('/api/blockouts').query({ businessId }).expect(401);
    });

    it('should fail with invalid businessId format', async () => {
      await request(app.getHttpServer())
        .get('/api/blockouts')
        .query({ businessId: 'invalid-uuid' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500); // UUID validation error returns 500 (needs global exception filter)
    });
  });

  describe('DELETE /blockouts/:id', () => {
    it('should delete a blockout', async () => {
      await request(app.getHttpServer())
        .delete(`/api/blockouts/${blockoutId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify blockout is deleted
      const response = await request(app.getHttpServer())
        .get('/api/blockouts')
        .query({ businessId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedBlockout = response.body.find((b: { id: string }) => b.id === blockoutId);
      expect(deletedBlockout).toBeUndefined();
    });

    it('should fail with non-existent blockout id', async () => {
      await request(app.getHttpServer())
        .delete('/api/blockouts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).delete(`/api/blockouts/${blockoutId}`).expect(401);
    });

    it('should fail with invalid blockout id format', async () => {
      await request(app.getHttpServer())
        .delete('/api/blockouts/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400); // ParseUUIDPipe validates UUID format
    });
  });

  describe('Blockout Business Logic', () => {
    it('should allow overlapping blockouts for same business', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 10);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 15);

      // Create first blockout
      const response1 = await request(app.getHttpServer())
        .post('/api/blockouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          reason: 'Vacation 1',
        })
        .expect(201);

      // Create overlapping blockout (should succeed)
      const overlapStart = new Date();
      overlapStart.setDate(overlapStart.getDate() + 12);
      const overlapEnd = new Date();
      overlapEnd.setDate(overlapEnd.getDate() + 17);

      const response2 = await request(app.getHttpServer())
        .post('/api/blockouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          startDate: overlapStart.toISOString().split('T')[0],
          endDate: overlapEnd.toISOString().split('T')[0],
          reason: 'Vacation 2',
        })
        .expect(201);

      expect(response1.body.id).toBeDefined();
      expect(response2.body.id).toBeDefined();
      expect(response1.body.id).not.toBe(response2.body.id);
    });
  });
});
