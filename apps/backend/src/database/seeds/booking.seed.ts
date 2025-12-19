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

  // Cita 1 - Mañana a las 10:00 - CONFIRMED
  const appointment1Date = addDays(today, 1);
  appointment1Date.setHours(10, 0, 0, 0);

  await dataSource.query(
    `INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [uuidv4(), businessId, customerId1, offering1Id, appointment1Date, 'CONFIRMED', 0],
  );

  // Cita 2 - Pasado mañana a las 14:00 - CONFIRMED
  const appointment2Date = addDays(today, 2);
  appointment2Date.setHours(14, 0, 0, 0);

  await dataSource.query(
    `INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [uuidv4(), businessId, customerId2, offering2Id, appointment2Date, 'CONFIRMED', 0],
  );

  // Cita 3 - En 3 días a las 16:00 - CONFIRMED
  const appointment3Date = addDays(today, 3);
  appointment3Date.setHours(16, 0, 0, 0);

  await dataSource.query(
    `INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [uuidv4(), businessId, customerId3, offering1Id, appointment3Date, 'CONFIRMED', 0],
  );

  // Cita 4 - En 5 días a las 11:00 - CANCELLED (para probar filtros)
  const appointment4Date = addDays(today, 5);
  appointment4Date.setHours(11, 0, 0, 0);

  await dataSource.query(
    `INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [uuidv4(), businessId, customerId1, offering2Id, appointment4Date, 'CANCELLED', 0],
  );

  // Cita 5 - Ayer a las 15:00 - COMPLETED (para probar filtros)
  const appointment5Date = addDays(today, -1);
  appointment5Date.setHours(15, 0, 0, 0);

  await dataSource.query(
    `INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status, version, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [uuidv4(), businessId, customerId2, offering1Id, appointment5Date, 'COMPLETED', 0],
  );

  console.log('✅ Booking BC seeded: 5 appointments (3 CONFIRMED, 1 CANCELLED, 1 COMPLETED)');

  // Actualizar capacidades para reflejar las citas creadas
  await dataSource.query(
    `UPDATE capacities 
     SET available_slots = available_slots - 1 
     WHERE offering_id = $1 AND date = $2`,
    [offering1Id, format(appointment1Date, 'yyyy-MM-dd')],
  );

  await dataSource.query(
    `UPDATE capacities 
     SET available_slots = available_slots - 1 
     WHERE offering_id = $1 AND date = $2`,
    [offering2Id, format(appointment2Date, 'yyyy-MM-dd')],
  );

  await dataSource.query(
    `UPDATE capacities 
     SET available_slots = available_slots - 1 
     WHERE offering_id = $1 AND date = $2`,
    [offering1Id, format(appointment3Date, 'yyyy-MM-dd')],
  );

  console.log('✅ Capacities updated to reflect appointments');
}
