import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { addDays, format } from 'date-fns';

/**
 * Availability Seed Data - Comprehensive Test Dataset
 *
 * Creates schedules, blockouts, and capacities for testing:
 * - 7 schedules (Monday-Friday 9am-6pm, Saturday 10am-2pm, Sunday closed)
 * - 3 blockouts (Christmas, New Year's, Random vacation)
 * - 90 capacity records (30 days × 3 offerings)
 *
 * Features:
 * - Realistic business hours (weekday vs weekend)
 * - Holiday blockouts
 * - Varied capacity per offering
 * - Proper foreign key relationships
 *
 * @see .kiro/specs/database-migrations-seeds-cleanup/design.md
 */
export async function seedAvailability(
  dataSource: DataSource,
  businessId: string,
  offering1Id: string,
  offering2Id: string,
  offering3Id: string,
): Promise<void> {
  console.log('📅 Seeding Availability BC...');

  // ============================================
  // STEP 1: Create Schedules (Business Hours)
  // ============================================
  const schedules = [
    // Monday - Friday: 9:00 AM - 6:00 PM
    { dayOfWeek: 1, startTime: '09:00:00', endTime: '18:00:00' }, // Monday
    { dayOfWeek: 2, startTime: '09:00:00', endTime: '18:00:00' }, // Tuesday
    { dayOfWeek: 3, startTime: '09:00:00', endTime: '18:00:00' }, // Wednesday
    { dayOfWeek: 4, startTime: '09:00:00', endTime: '18:00:00' }, // Thursday
    { dayOfWeek: 5, startTime: '09:00:00', endTime: '18:00:00' }, // Friday
    // Saturday: 10:00 AM - 2:00 PM (shorter hours)
    { dayOfWeek: 6, startTime: '10:00:00', endTime: '14:00:00' }, // Saturday
    // Sunday: Closed (no schedule)
  ];

  for (const schedule of schedules) {
    await dataSource.query(
      `INSERT INTO schedules (id, business_id, day_of_week, start_time, end_time, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [uuidv4(), businessId, schedule.dayOfWeek, schedule.startTime, schedule.endTime, true],
    );
  }

  console.log(`   ✓ Created ${schedules.length} schedules (Mon-Sat)`);

  // ============================================
  // STEP 2: Create Blockouts (Holidays/Vacations)
  // ============================================
  const today = new Date();
  const blockouts = [
    // Christmas Day 2025
    {
      startDate: '2025-12-25',
      endDate: '2025-12-25',
      reason: 'Christmas Day - Closed',
    },
    // New Year's Day 2026
    {
      startDate: '2026-01-01',
      endDate: '2026-01-01',
      reason: "New Year's Day - Closed",
    },
    // Summer Vacation (1 week in July 2026)
    {
      startDate: '2026-07-15',
      endDate: '2026-07-21',
      reason: 'Summer Vacation',
    },
  ];

  for (const blockout of blockouts) {
    await dataSource.query(
      `INSERT INTO blockouts (id, business_id, start_date, end_date, reason, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [uuidv4(), businessId, blockout.startDate, blockout.endDate, blockout.reason],
    );
  }

  console.log(`   ✓ Created ${blockouts.length} blockouts (holidays/vacations)`);

  // ============================================
  // STEP 3: Create Capacities (30 days)
  // ============================================
  const capacities = [];

  for (let i = 0; i < 30; i++) {
    const date = addDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    // Skip Sundays (closed)
    if (dayOfWeek === 0) {
      continue;
    }

    // Reduced capacity on Saturdays
    const saturdayMultiplier = dayOfWeek === 6 ? 0.5 : 1;

    // Capacidad para offering 1 (Corte de pelo - 8 slots por día, 4 on Saturday)
    capacities.push({
      id: uuidv4(),
      offeringId: offering1Id,
      date: dateStr,
      totalSlots: Math.floor(8 * saturdayMultiplier),
      availableSlots: Math.floor(8 * saturdayMultiplier),
    });

    // Capacidad para offering 2 (Lavado - 12 slots por día, 6 on Saturday)
    capacities.push({
      id: uuidv4(),
      offeringId: offering2Id,
      date: dateStr,
      totalSlots: Math.floor(12 * saturdayMultiplier),
      availableSlots: Math.floor(12 * saturdayMultiplier),
    });

    // Capacidad para offering 3 (Tinte - 4 slots por día, 2 on Saturday)
    capacities.push({
      id: uuidv4(),
      offeringId: offering3Id,
      date: dateStr,
      totalSlots: Math.floor(4 * saturdayMultiplier),
      availableSlots: Math.floor(4 * saturdayMultiplier),
    });
  }

  // Insertar capacidades en batch
  for (const capacity of capacities) {
    await dataSource.query(
      `INSERT INTO capacities (id, offering_id, date, total_slots, available_slots, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [
        capacity.id,
        capacity.offeringId,
        capacity.date,
        capacity.totalSlots,
        capacity.availableSlots,
        0,
      ],
    );
  }

  console.log(`   ✓ Created ${capacities.length} capacity records (30 days, excluding Sundays)`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('✅ Availability BC seeded');
  console.log('   📊 Summary:');
  console.log(`      - Schedules: ${schedules.length} (Mon-Sat)`);
  console.log(`      - Blockouts: ${blockouts.length} (holidays/vacations)`);
  console.log(`      - Capacities: ${capacities.length} records`);
  console.log('   🕐 Business Hours:');
  console.log('      - Mon-Fri: 9:00 AM - 6:00 PM');
  console.log('      - Saturday: 10:00 AM - 2:00 PM');
  console.log('      - Sunday: Closed');
  console.log('   🚫 Blockouts:');
  console.log('      - Christmas Day 2025 (Dec 25)');
  console.log("      - New Year's Day 2026 (Jan 1)");
  console.log('      - Summer Vacation 2026 (Jul 15-21)');
}
