import { AppDataSource } from '@config/database';
import { seedAuth } from '@database/seeds/auth.seed';
import { seedAccount } from '@database/seeds/account.seed';
import { seedBusiness } from '@database/seeds/business.seed';
import { seedCustomer } from '@database/seeds/customer.seed';
import { seedOffering } from '@database/seeds/offering.seed';
import { seedAvailability } from '@database/seeds/availability.seed';
import { seedBooking } from '@database/seeds/booking.seed';
import { seedConversation } from '@database/seeds/conversation.seed';

async function seed() {
  try {
    // Inicializar conexión
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    // Limpiar datos existentes (opcional - comentar si no se desea)
    console.log('🧹 Cleaning existing data...');
    await AppDataSource.query('TRUNCATE TABLE messages CASCADE');
    await AppDataSource.query('TRUNCATE TABLE conversations CASCADE');
    await AppDataSource.query('TRUNCATE TABLE appointments CASCADE');
    await AppDataSource.query('TRUNCATE TABLE capacities CASCADE');
    await AppDataSource.query('TRUNCATE TABLE blockouts CASCADE');
    await AppDataSource.query('TRUNCATE TABLE schedules CASCADE');
    await AppDataSource.query('TRUNCATE TABLE customers CASCADE');
    await AppDataSource.query('TRUNCATE TABLE offerings CASCADE');
    await AppDataSource.query('TRUNCATE TABLE businesses CASCADE');
    await AppDataSource.query('TRUNCATE TABLE business_owners CASCADE');
    await AppDataSource.query('TRUNCATE TABLE users CASCADE');
    console.log('✅ Data cleaned\n');

    // Seed por Bounded Context
    const { userId } = await seedAuth(AppDataSource);
    console.log('');

    await seedAccount(AppDataSource, userId);
    console.log('');

    const { businessId } = await seedBusiness(AppDataSource, userId);
    console.log('');

    const { customerId1, customerId2, customerId3 } = await seedCustomer(
      AppDataSource,
      businessId,
      userId,
    );
    console.log('');

    const { offering1Id, offering2Id, offering3Id } = await seedOffering(AppDataSource, businessId);
    console.log('');

    await seedAvailability(AppDataSource, businessId, offering1Id, offering2Id, offering3Id);
    console.log('');

    await seedBooking(
      AppDataSource,
      businessId,
      offering1Id,
      offering2Id,
      customerId1,
      customerId2,
      customerId3,
    );
    console.log('');

    await seedConversation(AppDataSource, businessId, customerId1, customerId2, customerId3);
    console.log('');

    console.log('📊 Seeding Summary:');
    console.log('==================');
    console.log('✅ Auth BC: 2 users');
    console.log('✅ Account BC: 2 business owners (1 FREE, 1 PRO)');
    console.log('✅ Business BC: 1 business');
    console.log('✅ Customer BC: 3 customers (2 anonymous, 1 registered)');
    console.log('✅ Offering BC: 3 offerings');
    console.log('✅ Availability BC: 6 schedules + 3 blockouts + ~78 capacity records');
    console.log('✅ Booking BC: 5 appointments (3 CONFIRMED, 1 CANCELLED, 1 COMPLETED)');
    console.log('✅ Conversation BC: 8 conversations + 35+ messages');
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
