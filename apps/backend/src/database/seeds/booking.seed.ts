import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { addDays, format } from 'date-fns';

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

  // Citas para HOY (para probar "Citas Hoy" en Dashboard)
  const todayMorning = new Date(today);
  todayMorning.setHours(9, 0, 0, 0);
  appointments.push({
    date: todayMorning,
    customerId: customerId1,
    offeringId: offering1Id,
    status: 'CONFIRMED',
  });

  const todayAfternoon = new Date(today);
  todayAfternoon.setHours(14, 0, 0, 0);
  appointments.push({
    date: todayAfternoon,
    customerId: customerId2,
    offeringId: offering2Id,
    status: 'CONFIRMED',
  });

  // Citas para los próximos 6 días (para probar "Citas Esta Semana")
  for (let i = 1; i <= 6; i++) {
    const appointmentDate = addDays(today, i);
    appointmentDate.setHours(10, 0, 0, 0);

    appointments.push({
      date: appointmentDate,
      customerId: i % 3 === 0 ? customerId3 : i % 2 === 0 ? customerId2 : customerId1,
      offeringId: i % 2 === 0 ? offering2Id : offering1Id,
      status: 'CONFIRMED',
    });

    // Agregar cita por la tarde solo en días laborables (lunes a viernes)
    const dayOfWeek = appointmentDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const afternoonDate = new Date(appointmentDate);
      afternoonDate.setHours(15, 0, 0, 0);

      appointments.push({
        date: afternoonDate,
        customerId: i % 2 === 0 ? customerId1 : customerId3,
        offeringId: i % 2 === 0 ? offering1Id : offering2Id,
        status: 'CONFIRMED',
      });
    }
  }

  // Cita cancelada (para probar filtros)
  const cancelledDate = addDays(today, 3);
  cancelledDate.setHours(11, 0, 0, 0);
  appointments.push({
    date: cancelledDate,
    customerId: customerId2,
    offeringId: offering1Id,
    status: 'CANCELLED',
  });

  // Cita completada (ayer - para probar filtros)
  const completedDate = addDays(today, -1);
  completedDate.setHours(15, 0, 0, 0);
  appointments.push({
    date: completedDate,
    customerId: customerId3,
    offeringId: offering2Id,
    status: 'COMPLETED',
  });

  // Insertar todas las citas
  for (const apt of appointments) {
    await dataSource.query(
      `INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [uuidv4(), businessId, apt.customerId, apt.offeringId, apt.date, apt.status, 0],
    );

    // Actualizar capacidad solo para citas CONFIRMED
    if (apt.status === 'CONFIRMED') {
      await dataSource.query(
        `UPDATE capacities 
         SET available_slots = available_slots - 1 
         WHERE offering_id = $1 AND date = $2`,
        [apt.offeringId, format(apt.date, 'yyyy-MM-dd')],
      );
    }
  }

  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

  console.log(
    `✅ Booking BC seeded: ${appointments.length} appointments (${confirmedCount} CONFIRMED, ${cancelledCount} CANCELLED, ${completedCount} COMPLETED)`,
  );
  console.log(`   - Today: 2 appointments`);
  console.log(`   - This week: ${confirmedCount - 2} more appointments`);
  console.log('✅ Capacities updated to reflect appointments');
}
