import { AppDataSource } from '../../config/database';

async function seed() {
  try {
    // Inicializar conexión
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // TODO: Agregar lógica de seeding aquí
    // Ejemplo:
    // const repository = AppDataSource.getRepository(Entity);
    // await repository.save([...]);

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
