import { AppDataSource } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { addDays, format } from 'date-fns';

async function seed() {
  try {
    // Inicializar conexión
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Limpiar datos existentes (opcional - comentar si no se desea)
    console.log('🧹 Cleaning existing data...');
    await AppDataSource.query('TRUNCATE TABLE appointments CASCADE');
    await AppDataSource.query('TRUNCATE TABLE capacities CASCADE');
    await AppDataSource.query('TRUNCATE TABLE users CASCADE');

    // 1. Crear usuario de prueba (dueño de negocio)
    console.log('👤 Creating test user...');
    const userId = uuidv4();
    const businessId = uuidv4();
    const hashedPassword = await bcrypt.hash('Test123!', 10);

    await AppDataSource.query(
      `INSERT INTO users (id, email, password, name, "businessId", version, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [userId, 'test@example.com', hashedPassword, 'Test Business Owner', businessId, 0],
    );
    console.log(`✅ User created: test@example.com / Test123!`);

    // 2. Crear offerings de prueba
    console.log('💼 Creating test offerings...');
    const offering1Id = uuidv4();
    const offering2Id = uuidv4();
    const offering3Id = uuidv4();

    // Nota: Como no tenemos tabla de offerings aún, usaremos IDs ficticios
    // En una implementación completa, aquí insertaríamos en la tabla offerings
    console.log(`✅ Offering IDs created: ${offering1Id}, ${offering2Id}, ${offering3Id}`);

    // 3. Crear capacidades para los próximos 30 días
    console.log('📅 Creating capacities for next 30 days...');
    const today = new Date();
    const capacities = [];

    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');

      // Capacidad para offering 1 (ej: Corte de pelo - 8 slots por día)
      capacities.push({
        id: uuidv4(),
        offeringId: offering1Id,
        date: dateStr,
        totalSlots: 8,
        availableSlots: 8,
      });

      // Capacidad para offering 2 (ej: Lavado - 12 slots por día)
      capacities.push({
        id: uuidv4(),
        offeringId: offering2Id,
        date: dateStr,
        totalSlots: 12,
        availableSlots: 12,
      });

      // Capacidad para offering 3 (ej: Tinte - 4 slots por día)
      capacities.push({
        id: uuidv4(),
        offeringId: offering3Id,
        date: dateStr,
        totalSlots: 4,
        availableSlots: 4,
      });
    }

    // Insertar capacidades en batch
    for (const capacity of capacities) {
      await AppDataSource.query(
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
    console.log(`✅ Created ${capacities.length} capacity records`);

    // 4. Crear algunas citas de ejemplo
    console.log('📝 Creating sample appointments...');
    const customerId1 = uuidv4();
    const customerId2 = uuidv4();

    // Cita 1 - Mañana a las 10:00
    const appointment1Date = addDays(today, 1);
    appointment1Date.setHours(10, 0, 0, 0);

    await AppDataSource.query(
      `INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [uuidv4(), businessId, customerId1, offering1Id, appointment1Date, 'CONFIRMED', 0],
    );

    // Cita 2 - Pasado mañana a las 14:00
    const appointment2Date = addDays(today, 2);
    appointment2Date.setHours(14, 0, 0, 0);

    await AppDataSource.query(
      `INSERT INTO appointments (id, business_id, customer_id, offering_id, date_time, status, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [uuidv4(), businessId, customerId2, offering2Id, appointment2Date, 'CONFIRMED', 0],
    );

    console.log('✅ Created 2 sample appointments');

    // Actualizar capacidades para reflejar las citas creadas
    await AppDataSource.query(
      `UPDATE capacities 
       SET available_slots = available_slots - 1 
       WHERE offering_id = $1 AND date = $2`,
      [offering1Id, format(appointment1Date, 'yyyy-MM-dd')],
    );

    await AppDataSource.query(
      `UPDATE capacities 
       SET available_slots = available_slots - 1 
       WHERE offering_id = $1 AND date = $2`,
      [offering2Id, format(appointment2Date, 'yyyy-MM-dd')],
    );

    console.log('✅ Updated capacities to reflect appointments');

    console.log('\n📊 Seeding Summary:');
    console.log('==================');
    console.log('✅ 1 test user created');
    console.log('   Email: test@example.com');
    console.log('   Password: Test123!');
    console.log(`✅ 3 offering IDs generated`);
    console.log(`✅ ${capacities.length} capacity records created (30 days)`);
    console.log('✅ 2 sample appointments created');
    console.log('==================\n');

    console.log('✅ Seeding completed successfully');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    // Cerrar conexión
    await AppDataSource.destroy();
  }
}

// Ejecutar seed
seed()
  .then(() => {
    console.log('✅ Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
