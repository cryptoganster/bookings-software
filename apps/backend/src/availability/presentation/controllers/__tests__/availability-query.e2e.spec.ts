import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { DataSource } from 'typeorm';
import { E2EAuthHelper } from '@test-utils/e2e-helpers/auth';
import { createActiveOffering } from '@test-utils/e2e-helpers/offering';
import { UserRole } from '@test-utils/e2e-helpers/types';

describe('Availability Query (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authHelper: E2EAuthHelper;
  let authToken: string;
  let userId: string;
  let businessId: string;
  let offeringId: string;

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

    dataSource = moduleFixture.get<DataSource>(DataSource);
    authHelper = new E2EAuthHelper(app);

    // 1. Create a BUSINESS_OWNER test user with business
    const testUser = await authHelper.createBusinessOwner({
      name: 'Test Availability Business',
      whatsappNumber: '+18095559012',
      address: '789 Test Blvd, Test City, DO', // ✅ Fixed: address is a string
      timezone: 'America/Santo_Domingo',
    });

    authToken = testUser.token;
    userId = testUser.id;
    businessId = testUser.businessId!;

    // 2. Create an offering using helper (direct database insert)
    const offering = await createActiveOffering(
      dataSource,
      businessId,
      undefined,
      'Test Service',
      60,
      5,
    );
    offeringId = offering.id;

    // 3. Create schedules for testing (Monday to Friday, 9-17)
    for (let day = 1; day <= 5; day++) {
      await request(app.getHttpServer())
        .post('/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
        });
    }

    // 4. Create capacity records manually in database (since there's no API endpoint)
    const { v4: uuidv4 } = require('uuid');
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setUTCHours(0, 0, 0, 0);

      await dataSource.query(
        'INSERT INTO capacities (id, offering_id, date, total_slots, available_slots, version, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
        [
          uuidv4(), // Generate proper UUID
          offeringId,
          date,
          10, // total_slots
          10, // available_slots (all available initially)
          0, // version
        ],
      );
    }
  });

  afterAll(async () => {
    // Clean up test data using authHelper
    await authHelper.cleanupTestUsers();

    // Clean up additional test data (use snake_case for column names)
    if (dataSource) {
      await dataSource.query('DELETE FROM capacities WHERE offering_id = $1', [offeringId]);
      await dataSource.query('DELETE FROM schedules WHERE business_id = $1', [businessId]);
      await dataSource.query('DELETE FROM blockouts WHERE business_id = $1', [businessId]);
      await dataSource.query('DELETE FROM offerings WHERE id = $1', [offeringId]);
    }
    await app.close();
  });

  describe('GET /availability/dates', () => {
    it('should return available dates within range', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const response = await request(app.getHttpServer())
        .get('/availability/dates')
        .query({
          offeringId,
          businessId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status !== 200) {
        console.error('Error response:', response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify dates are in ISO format
      response.body.forEach((date: string) => {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    });

    it('should exclude dates with blockouts', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Create blockout for tomorrow
      await request(app.getHttpServer())
        .post('/blockouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          startDate: tomorrow.toISOString().split('T')[0],
          endDate: tomorrow.toISOString().split('T')[0],
          reason: 'Test blockout',
        });

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3);

      const response = await request(app.getHttpServer())
        .get('/availability/dates')
        .query({
          offeringId,
          businessId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify tomorrow is not in the list
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const hasTomorrow = response.body.some((date: string) => date.startsWith(tomorrowStr));
      expect(hasTomorrow).toBe(false);
    });

    it('should exclude dates outside schedule', async () => {
      // Schedules are Monday-Friday, so weekend should be excluded
      const nextSunday = new Date();
      nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));

      const startDate = new Date(nextSunday);
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date(nextSunday);
      endDate.setDate(endDate.getDate() + 1);

      const response = await request(app.getHttpServer())
        .get('/availability/dates')
        .query({
          offeringId,
          businessId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Sunday should not be in the list
      const sundayStr = nextSunday.toISOString().split('T')[0];
      const hasSunday = response.body.some((date: string) => date.startsWith(sundayStr));
      expect(hasSunday).toBe(false);
    });

    it('should fail with missing required parameters', async () => {
      await request(app.getHttpServer())
        .get('/availability/dates')
        .query({
          offeringId,
          // Missing businessId, startDate, endDate
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should fail without authentication', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      await request(app.getHttpServer())
        .get('/availability/dates')
        .query({
          offeringId,
          businessId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        .expect(401);
    });

    it('should fail with invalid UUID format', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      await request(app.getHttpServer())
        .get('/availability/dates')
        .query({
          offeringId: 'invalid-uuid',
          businessId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /availability/slots', () => {
    it('should return available time slots for a date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2); // Use day after tomorrow to avoid blockout

      const response = await request(app.getHttpServer())
        .get('/availability/slots')
        .query({
          offeringId,
          businessId,
          date: tomorrow.toISOString().split('T')[0],
          durationMinutes: 60,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify slot structure
      response.body.forEach((slot: any) => {
        expect(slot).toHaveProperty('time');
        expect(slot).toHaveProperty('availableSlots');
        expect(typeof slot.time).toBe('string');
        expect(typeof slot.availableSlots).toBe('number');
        expect(slot.availableSlots).toBeGreaterThanOrEqual(0);
      });
    });

    it('should return slots within schedule hours (9-17)', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      const response = await request(app.getHttpServer())
        .get('/availability/slots')
        .query({
          offeringId,
          businessId,
          date: tomorrow.toISOString().split('T')[0],
          durationMinutes: 60,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // All slots should be between 9:00 and 17:00
      response.body.forEach((slot: any) => {
        const time = new Date(slot.time);
        const hours = time.getUTCHours();
        expect(hours).toBeGreaterThanOrEqual(9);
        expect(hours).toBeLessThan(17);
      });
    });

    it('should return empty array for blocked date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1); // This date has blockout

      const response = await request(app.getHttpServer())
        .get('/availability/slots')
        .query({
          offeringId,
          businessId,
          date: tomorrow.toISOString().split('T')[0],
          durationMinutes: 60,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should adjust slots based on duration', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      // 30-minute slots should have more slots than 60-minute
      const response30 = await request(app.getHttpServer())
        .get('/availability/slots')
        .query({
          offeringId,
          businessId,
          date: tomorrow.toISOString().split('T')[0],
          durationMinutes: 30,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const response60 = await request(app.getHttpServer())
        .get('/availability/slots')
        .query({
          offeringId,
          businessId,
          date: tomorrow.toISOString().split('T')[0],
          durationMinutes: 60,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response30.body.length).toBeGreaterThan(response60.body.length);
    });

    it('should fail with missing required parameters', async () => {
      await request(app.getHttpServer())
        .get('/availability/slots')
        .query({
          offeringId,
          // Missing businessId, date, durationMinutes
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should fail with invalid duration (less than 15 minutes)', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await request(app.getHttpServer())
        .get('/availability/slots')
        .query({
          offeringId,
          businessId,
          date: tomorrow.toISOString().split('T')[0],
          durationMinutes: 10, // Invalid: less than 15
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should fail without authentication', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await request(app.getHttpServer())
        .get('/availability/slots')
        .query({
          offeringId,
          businessId,
          date: tomorrow.toISOString().split('T')[0],
          durationMinutes: 60,
        })
        .expect(401);
    });
  });

  describe('Edge Cases', () => {
    it('should handle date range with no available dates', async () => {
      // Create blockout for entire range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 20);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 25);

      await request(app.getHttpServer())
        .post('/blockouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          reason: 'Full blockout',
        });

      const response = await request(app.getHttpServer())
        .get('/availability/dates')
        .query({
          offeringId,
          businessId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should handle single-day date range', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);

      const response = await request(app.getHttpServer())
        .get('/availability/dates')
        .query({
          offeringId,
          businessId,
          startDate: tomorrow.toISOString().split('T')[0],
          endDate: tomorrow.toISOString().split('T')[0],
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Should have 0 or 1 date depending on day of week
    });
  });
});
