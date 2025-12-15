import { DataSource } from 'typeorm';
import { AppointmentModel } from '../src/booking/infra/persistence/models/appointment';
import { CapacityModel } from '../src/availability/infra/persistence/models/capacity';

/**
 * Helper para limpiar la base de datos entre tests
 * Esto es mucho más rápido que crear/eliminar bases de datos
 */
export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;

  // Deshabilitar foreign key checks temporalmente para poder truncar
  await dataSource.query('SET session_replication_role = replica;');

  try {
    // Truncar todas las tablas
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
    }
  } finally {
    // Re-habilitar foreign key checks
    await dataSource.query('SET session_replication_role = DEFAULT;');
  }
}

/**
 * Helper para crear un DataSource de test
 * Usa la base de datos específica del worker de Jest
 */
export function createTestDataSource(): DataSource {
  const workerId = process.env.JEST_WORKER_ID || '1';
  const database = `bookings_test_${workerId}`;

  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database,
    entities: [AppointmentModel, CapacityModel],
    synchronize: true, // Auto-crear schema en tests
    logging: false,
  });
}

/**
 * Setup completo para tests de integración
 * Retorna un DataSource inicializado y limpio
 */
export async function setupTestDatabase(): Promise<DataSource> {
  const dataSource = createTestDataSource();

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  // Limpiar antes de cada test
  await cleanDatabase(dataSource);

  return dataSource;
}

/**
 * Teardown para tests de integración
 */
export async function teardownTestDatabase(dataSource: DataSource): Promise<void> {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}
