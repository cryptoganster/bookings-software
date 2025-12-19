import { AppDataSource } from '@config/database';
import { seedAuth } from '@database/seeds/auth.seed';
import { seedOffering } from '@database/seeds/offering.seed';
import { seedAvailability } from '@database/seeds/availability.seed';
import { seedBooking } from '@database/seeds/booking.seed';

async function seed() {
  try {
    // Inicializar conexión
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    // Limpiar datos existentes (opcional - comentar si no se desea)
    console.log('🧹 Cleaning existing data...');
    await AppDataSource.query('TRUNCATE TABLE appointments CASCADE');
    await AppDataSource.query('TRUNCATE TABLE capacities CASCADE');
    await AppDataSource.query('TRUNCATE TABLE offerings CASCADE');
    await AppDataSource.query('TRUNCATE TABLE users CASCADE');
    console.log('✅ Data cleaned\n');

    // Seed por Bounded Context
    const { businessId } = await seedAuth(AppDataSource);
    console.log('');

    const { offering1Id, offering2Id, offering3Id } = await seedOffering(AppDataSource, businessId);
    console.log('');

    await seedAvailability(AppDataSource, offering1Id, offering2Id, offering3Id);
    console.log('');

    await seedBooking(AppDataSource, businessId, offering1Id, offering2Id);
    console.log('');

    console.log('📊 Seeding Summary:');
    console.log('==================');
    console.log('✅ Auth BC: 1 user');
    console.log('✅ Offering BC: 3 offerings');
    console.log('✅ Availability BC: 90 capacity records (30 days × 3 offerings)');
    console.log('✅ Booking BC: 5 appointments (3 CONFIRMED, 1 CANCELLED, 1 COMPLETED)');
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
