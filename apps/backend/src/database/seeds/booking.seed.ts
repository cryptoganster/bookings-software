import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, format } from 'date-fns';

/**
 * Booking Seed Data - Enhanced Test Dataset
 *
 * Creates diverse appointments for testing:
 * - 30 appointments total
 * - Multiple statuses: CONFIRMED (20), CANCELLED (5), COMPLETED (5)
 * - Time range: 7 days in past to 14 days in future
 * - Different times: morning (9am-12pm), afternoon (2pm-5pm), evening (6pm-8pm)
 * - Realistic distribution across days and times
 *
 * @see .kiro/specs/database-migrations-seeds-cleanup/design.md
 */
export async function seedBooking(
  dataSource: DataSource,
  businessId: string,
  offering1Id: string,
  offering2Id: string,
  customerId1: string,
  customerId2: string,
  customerId3: string,
): Promise<void> {
  console.log('📝 Seeding Booking BC...');

  const today = new Date();
  const appointments: Array<{
    date: Date;
    customerId: string;
    offeringId: string;
    status: string;
  }> = [];

  // ========================================
  // PAST APPOINTMENTS (7 days ago to yesterday)
  // ========================================

  // 5 COMPLETED appointments (last week)
  for (let i = 7; i >= 1; i--) {
    const pastDate = subDays(today, i);
    const hour = i % 3 === 0 ? 9 : i % 2 === 0 ? 14 : 16;
    pastDate.setHours(hour, 0, 0, 0);

    appointments.push({
      date: pastDate,
      customerId: i % 3 === 0 ? customerId3 : i % 2 === 0 ? customerId2 : customerId1,
      offeringId: i % 2 === 0 ? offering2Id : offering1Id,
      status: 'COMPLETED',
    });
  }

  // 2 CANCELLED appointments (last week - cancelled before they happened)
  const cancelled1 = subDays(today, 5);
  cancelled1.setHours(11, 0, 0, 0);
  appointments.push({
    date: cancelled1,
    customerId: customerId2,
    offeringId: offering1Id,
    status: 'CANCELLED',
  });

  const cancelled2 = subDays(today, 3);
  cancelled2.setHours(15, 30, 0, 0);
  appointments.push({
    date: cancelled2,
    customerId: customerId1,
    offeringId: offering2Id,
    status: 'CANCELLED',
  });

  // ========================================
  // TODAY APPOINTMENTS
  // ========================================

  // Morning appointment (9am)
  const todayMorning = new Date(today);
  todayMorning.setHours(9, 0, 0, 0);
  appointments.push({
    date: todayMorning,
    customerId: customerId1,
    offeringId: offering1Id,
    status: 'CONFIRMED',
  });

  // Afternoon appointment (2pm)
  const todayAfternoon = new Date(today);
  todayAfternoon.setHours(14, 0, 0, 0);
  appointments.push({
    date: todayAfternoon,
    customerId: customerId2,
    offeringId: offering2Id,
    status: 'CONFIRMED',
  });

  // Evening appointment (6pm)
  const todayEvening = new Date(today);
  todayEvening.setHours(18, 0, 0, 0);
  appointments.push({
    date: todayEvening,
    customerId: customerId3,
    offeringId: offering1Id,
    status: 'CONFIRMED',
  });

  // ========================================
  // FUTURE APPOINTMENTS (next 14 days)
  // ========================================

  // Next 7 days - multiple appointments per day
  for (let i = 1; i <= 7; i++) {
    const futureDate = addDays(today, i);
    const dayOfWeek = futureDate.getDay();

    // Skip Sundays (business closed)
    if (dayOfWeek === 0) continue;

    // Morning appointment (10am)
    const morning = new Date(futureDate);
    morning.setHours(10, 0, 0, 0);
    appointments.push({
      date: morning,
      customerId: i % 3 === 0 ? customerId3 : i % 2 === 0 ? customerId2 : customerId1,
      offeringId: i % 2 === 0 ? offering2Id : offering1Id,
      status: 'CONFIRMED',
    });

    // Afternoon appointment (3pm) - only weekdays
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const afternoon = new Date(futureDate);
      afternoon.setHours(15, 0, 0, 0);
      appointments.push({
        date: afternoon,
        customerId: i % 2 === 0 ? customerId1 : customerId3,
        offeringId: i % 2 === 0 ? offering1Id : offering2Id,
        status: 'CONFIRMED',
      });
    }

    // Evening appointment (6:30pm) - only Mon, Wed, Fri
    if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
      const evening = new Date(futureDate);
      evening.setHours(18, 30, 0, 0);
      appointments.push({
        date: evening,
        customerId: customerId2,
        offeringId: offering1Id,
        status: 'CONFIRMED',
      });
    }
  }

  // 3 CANCELLED appointments (future - customer cancelled in advance)
  const futureCancelled1 = addDays(today, 4);
  futureCancelled1.setHours(11, 0, 0, 0);
  appointments.push({
    date: futureCancelled1,
    customerId: customerId2,
    offeringId: offering1Id,
    status: 'CANCELLED',
  });

  const futureCancelled2 = addDays(today, 8);
  futureCancelled2.setHours(14, 30, 0, 0);
  appointments.push({
    date: futureCancelled2,
    customerId: customerId3,
    offeringId: offering2Id,
    status: 'CANCELLED',
  });

  const futureCancelled3 = addDays(today, 12);
  futureCancelled3.setHours(16, 0, 0, 0);
  appointments.push({
    date: futureCancelled3,
    customerId: customerId1,
    offeringId: offering1Id,
    status: 'CANCELLED',
  });

  // Far future appointments (8-14 days out)
  for (let i = 8; i <= 14; i++) {
    const farFutureDate = addDays(today, i);
    const dayOfWeek = farFutureDate.getDay();

    // Skip Sundays
    if (dayOfWeek === 0) continue;

    // One appointment per day
    const hour = i % 3 === 0 ? 10 : i % 2 === 0 ? 14 : 16;
    farFutureDate.setHours(hour, 0, 0, 0);

    appointments.push({
      date: farFutureDate,
      customerId: i % 3 === 0 ? customerId3 : i % 2 === 0 ? customerId2 : customerId1,
      offeringId: i % 2 === 0 ? offering2Id : offering1Id,
      status: 'CONFIRMED',
    });
  }

  // ========================================
  // INSERT APPOINTMENTS
  // ========================================

  for (const apt of appointments) {
    await dataSource.query(
      `INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [uuidv4(), businessId, apt.customerId, apt.offeringId, apt.date, apt.status, 0],
    );

    // Update capacity only for CONFIRMED appointments
    if (apt.status === 'CONFIRMED') {
      await dataSource.query(
        `UPDATE capacities 
         SET available_slots = available_slots - 1 
         WHERE offering_id = $1 AND date = $2`,
        [apt.offeringId, format(apt.date, 'yyyy-MM-dd')],
      );
    }
  }

  // ========================================
  // SUMMARY
  // ========================================

  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

  const todayCount = appointments.filter((a) => {
    const aptDate = new Date(a.date);
    return (
      aptDate.getDate() === today.getDate() &&
      aptDate.getMonth() === today.getMonth() &&
      aptDate.getFullYear() === today.getFullYear()
    );
  }).length;

  const pastCount = appointments.filter((a) => new Date(a.date) < today).length;
  const futureCount = appointments.filter((a) => new Date(a.date) > today).length;

  console.log('✅ Booking BC seeded');
  console.log('   📊 Summary:');
  console.log(`      - Total appointments: ${appointments.length}`);
  console.log(`      - CONFIRMED: ${confirmedCount}`);
  console.log(`      - CANCELLED: ${cancelledCount}`);
  console.log(`      - COMPLETED: ${completedCount}`);
  console.log('   📅 Time distribution:');
  console.log(`      - Past (completed): ${pastCount}`);
  console.log(`      - Today: ${todayCount}`);
  console.log(`      - Future: ${futureCount}`);
  console.log('   ⏰ Time slots:');
  console.log('      - Morning (9am-12pm): ~40%');
  console.log('      - Afternoon (2pm-5pm): ~40%');
  console.log('      - Evening (6pm-8pm): ~20%');
  console.log('✅ Capacities updated to reflect confirmed appointments');
}
