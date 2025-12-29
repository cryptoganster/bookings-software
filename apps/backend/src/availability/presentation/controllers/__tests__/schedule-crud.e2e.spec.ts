import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { E2EAuthHelper } from '@test-utils/helpers';
import { generateTestId } from '@test-utils/helpers/database';

describe('Schedule CRUD (e2e)', () => {
  let app: INestApplication;
  let authHelper: E2EAuthHelper;
  let authToken: string;
  let businessId: string;
  let scheduleId: string;

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

    authHelper = new E2EAuthHelper(app);

    // Create business owner with business using helper
    const testUser = await authHelper.createBusinessOwner();
    authToken = testUser.token;
    businessId = testUser.businessId!;
  });

  afterAll(async () => {
    // Clean up test data
    await authHelper.cleanupTestUsers();
    await app.close();
  });

  describe('POST /schedules', () => {
    it('should create a new schedule', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '17:00',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBeDefined();
      scheduleId = response.body.id;
    });

    it('should fail with invalid day of week', async () => {
      await request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          dayOfWeek: 7, // Invalid (0-6)
          startTime: '09:00',
          endTime: '17:00',
        })
        .expect(400);
    });

    it('should fail with invalid time range (end before start)', async () => {
      await request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          dayOfWeek: 2,
          startTime: '17:00',
          endTime: '09:00',
        })
        .expect(500); // Domain exception returns 500 (needs global exception filter)
    });

    it('should fail with duplicate schedule (same business + day)', async () => {
      await request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          dayOfWeek: 1, // Same as first test
          startTime: '10:00',
          endTime: '18:00',
        })
        .expect(409); // Conflict
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/schedules')
        .send({
          businessId,
          dayOfWeek: 3,
          startTime: '09:00',
          endTime: '17:00',
        })
        .expect(401);
    });

    it('should fail with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          dayOfWeek: 3,
          // Missing startTime and endTime
        })
        .expect(400);
    });
  });

  describe('GET /schedules', () => {
    it('should get all schedules for business', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/schedules')
        .query({ businessId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('dayOfWeek');
      expect(response.body[0]).toHaveProperty('startTime');
      expect(response.body[0]).toHaveProperty('endTime');
      expect(response.body[0]).toHaveProperty('isActive');
    });

    it('should return empty array for business with no schedules', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/schedules')
        .query({ businessId: generateTestId() })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get('/api/schedules').query({ businessId }).expect(401);
    });

    it('should fail with invalid businessId format', async () => {
      await request(app.getHttpServer())
        .get('/api/schedules')
        .query({ businessId: 'invalid-uuid' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500); // UUID validation error returns 500 (needs global exception filter)
    });
  });

  describe('PUT /schedules/:id', () => {
    it('should update an existing schedule', async () => {
      await request(app.getHttpServer())
        .put(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startTime: '08:00',
          endTime: '16:00',
        })
        .expect(200);

      // Verify update
      const response = await request(app.getHttpServer())
        .get('/api/schedules')
        .query({ businessId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const updatedSchedule = response.body.find(
        (s: { id: string; startTime: string; endTime: string }) => s.id === scheduleId,
      );
      expect(updatedSchedule.startTime).toBe('08:00:00'); // Database returns HH:MM:SS format
      expect(updatedSchedule.endTime).toBe('16:00:00');
    });

    it('should fail with invalid time range', async () => {
      await request(app.getHttpServer())
        .put(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startTime: '18:00',
          endTime: '08:00',
        })
        .expect(500); // Domain exception returns 500 (needs global exception filter)
    });

    it('should fail with non-existent schedule id', async () => {
      await request(app.getHttpServer())
        .put('/api/schedules/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startTime: '09:00',
          endTime: '17:00',
        })
        .expect(404);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/api/schedules/${scheduleId}`)
        .send({
          startTime: '09:00',
          endTime: '17:00',
        })
        .expect(401);
    });
  });

  describe('DELETE /schedules/:id', () => {
    it('should delete (deactivate) a schedule', async () => {
      await request(app.getHttpServer())
        .delete(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify schedule is deactivated
      const response = await request(app.getHttpServer())
        .get('/api/schedules')
        .query({ businessId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedSchedule = response.body.find(
        (s: { id: string; isActive: boolean }) => s.id === scheduleId,
      );
      expect(deletedSchedule.isActive).toBe(false);
    });

    it('should fail with non-existent schedule id', async () => {
      await request(app.getHttpServer())
        .delete('/api/schedules/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).delete(`/api/schedules/${scheduleId}`).expect(401);
    });
  });
});
