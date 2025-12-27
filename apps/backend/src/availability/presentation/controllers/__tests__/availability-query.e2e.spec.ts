import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { DataSource } from 'typeorm';
import { TestAuthHelper } from '@test-utils/helpers';
import { OfferingModel } from '@offering/infra/persistence/models/offering';
import { UUID } from '@shared/vo/uuid';

/**
 * Helper to create an active offering for this test
 * TODO: Move to @test-utils/helpers/offering.ts
 */
async function createTestOffering(
  dataSource: DataSource,
  businessId: string,
  name: string = 'Test Service',
  duration: number = 60,
  maxCapacityPerSlot: number = 5,
): Promise<{ id: string }> {
  const offering = new OfferingModel();
  offering.id = UUID.generate().getValue();
  offering.businessId = businessId;
  offering.name = name;
  offering.duration = duration;
  offering.maxCapacityPerSlot = maxCapacityPerSlot;
  offering.maxDailyCapacity = null;
  offering.isActive = true;

  await dataSource.getRepository(OfferingModel).save(offering);

  return { id: offering.id };
}

describe('Availability Query (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authHelper: TestAuthHelper;
  let authToken: string;
  let userId: string;
  let businessId: string;
  let offeringId: string;

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
    authHelper = new TestAuthHelper(app);

    // 1. Create a BUSINESS_OWNER test user with business
    const testUser = await authHelper.createBusinessOwner({
      name: 'Test Availability Business',
      whatsappNumber: '+18095559012',
      address: {
        street: '789 Test Blvd',
        city: 'Test City',
        state: null,
        country: 'DO',
        postalCode: null,
      },
      timezone: 'America/Santo_Domingo',
    });

    authToken = testUser.token;
    userId = testUser.id;
    businessId = testUser.businessId;

    // 2. Create an offering using helper (direct database insert)
    const offering = await createTestOffering(dataSource, businessId, 'Test Service', 60, 5);
    offeringId = offering.id;

    // 3. Create schedules for testing (Monday to Friday, 9-17)
    for (let day = 1; day <= 5; day++) {
      await request(app.getHttpServer())
        .post('/api/schedules')
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
        .get('/api/availability/dates')
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
        .post('/api/blockouts')
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
        .get('/api/availability/dates')
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
      // Schedules are Monday-Friday (days 1-5), so weekend (Sunday=0, Saturday=6) should be excluded
      // Find the next Sunday (day 0)
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Calculate days until next Sunday (0 = Sunday)
      const currentDay = today.getUTCDay();
      const daysUntilSunday = currentDay === 0 ? 7 : 7 - currentDay; // If today is Sunday, get next Sunday

      const nextSunday = new Date(today);
      nextSunday.setUTCDate(today.getUTCDate() + daysUntilSunday);

      // Verify it's actually Sunday
      expect(nextSunday.getUTCDay()).toBe(0);

      // Ensure we have capacity for this Sunday (create it if needed)
      const { v4: uuidv4 } = require('uuid');
      await dataSource.query(
        'INSERT INTO capacities (id, offering_id, date, total_slots, available_slots, version, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) ON CONFLICT DO NOTHING',
        [uuidv4(), offeringId, nextSunday, 10, 10, 0],
      );

      // Query for dates around Sunday (Saturday, Sunday, Monday)
      const startDate = new Date(nextSunday);
      startDate.setUTCDate(startDate.getUTCDate() - 1); // Saturday
      const endDate = new Date(nextSunday);
      endDate.setUTCDate(endDate.getUTCDate() + 1); // Monday

      const response = await request(app.getHttpServer())
        .get('/api/availability/dates')
        .query({
          offeringId,
          businessId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Sunday should NOT be in the list (no schedule for day 0)
      // Monday SHOULD be in the list (has schedule for day 1)
      const sundayStr = nextSunday.toISOString().split('T')[0];
      const hasSunday = response.body.some((date: string) => date.startsWith(sundayStr));
      expect(hasSunday).toBe(false);

      // Verify Monday is included (sanity check)
      const monday = new Date(nextSunday);
      monday.setUTCDate(monday.getUTCDate() + 1);
      const mondayStr = monday.toISOString().split('T')[0];
      const hasMonday = response.body.some((date: string) => date.startsWith(mondayStr));
      expect(hasMonday).toBe(true);
    });

    it('should fail with missing required parameters', async () => {
      await request(app.getHttpServer())
        .get('/api/availability/dates')
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
        .get('/api/availability/dates')
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
        .get('/api/availability/dates')
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
      // Find next Monday (day 1) to ensure we have a schedule
      const today = new Date();
      const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7; // If today is Monday, get next Monday
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      nextMonday.setUTCHours(0, 0, 0, 0);

      // Ensure we have capacity for this Monday
      const { v4: uuidv4 } = require('uuid');
      await dataSource.query(
        'INSERT INTO capacities (id, offering_id, date, total_slots, available_slots, version, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) ON CONFLICT DO NOTHING',
        [uuidv4(), offeringId, nextMonday, 10, 10, 0],
      );

      const response = await request(app.getHttpServer())
        .get('/api/availability/slots')
        .query({
          offeringId,
          businessId,
          date: nextMonday.toISOString().split('T')[0],
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
      // Find next Tuesday (day 2) to ensure we have a schedule
      const today = new Date();
      const daysUntilTuesday = (2 - today.getDay() + 7) % 7 || 7;
      const nextTuesday = new Date(today);
      nextTuesday.setDate(today.getDate() + daysUntilTuesday);
      nextTuesday.setUTCHours(0, 0, 0, 0);

      // Ensure we have capacity for this Tuesday
      const { v4: uuidv4 } = require('uuid');
      await dataSource.query(
        'INSERT INTO capacities (id, offering_id, date, total_slots, available_slots, version, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) ON CONFLICT DO NOTHING',
        [uuidv4(), offeringId, nextTuesday, 10, 10, 0],
      );

      const response = await request(app.getHttpServer())
        .get('/api/availability/slots')
        .query({
          offeringId,
          businessId,
          date: nextTuesday.toISOString().split('T')[0],
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
        .get('/api/availability/slots')
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
      // Find next Wednesday (day 3) to ensure we have a schedule
      const today = new Date();
      const daysUntilWednesday = (3 - today.getDay() + 7) % 7 || 7;
      const nextWednesday = new Date(today);
      nextWednesday.setDate(today.getDate() + daysUntilWednesday);
      nextWednesday.setUTCHours(0, 0, 0, 0);

      // Ensure we have capacity for this Wednesday
      const { v4: uuidv4 } = require('uuid');
      await dataSource.query(
        'INSERT INTO capacities (id, offering_id, date, total_slots, available_slots, version, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) ON CONFLICT DO NOTHING',
        [uuidv4(), offeringId, nextWednesday, 10, 10, 0],
      );

      // 30-minute slots should have more slots than 60-minute
      const response30 = await request(app.getHttpServer())
        .get('/api/availability/slots')
        .query({
          offeringId,
          businessId,
          date: nextWednesday.toISOString().split('T')[0],
          durationMinutes: 30,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const response60 = await request(app.getHttpServer())
        .get('/api/availability/slots')
        .query({
          offeringId,
          businessId,
          date: nextWednesday.toISOString().split('T')[0],
          durationMinutes: 60,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response30.body.length).toBeGreaterThan(response60.body.length);
    });

    it('should fail with missing required parameters', async () => {
      await request(app.getHttpServer())
        .get('/api/availability/slots')
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
        .get('/api/availability/slots')
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
        .get('/api/availability/slots')
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
        .post('/api/blockouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          reason: 'Full blockout',
        });

      const response = await request(app.getHttpServer())
        .get('/api/availability/dates')
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
        .get('/api/availability/dates')
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
