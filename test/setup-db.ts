import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Cargar variables de entorno de .env.test
config({ path: join(__dirname, '..', '.env.test') });

async function setupTestDatabase() {
  // Conectar a postgres para crear la base de datos de pruebas
  const adminDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // Conectar a la base de datos por defecto
  });

  try {
    await adminDataSource.initialize();
    console.log('Connected to PostgreSQL');

    // Verificar si la base de datos de pruebas existe
    const dbName = process.env.DB_DATABASE || 'bookings_test';
    const result = await adminDataSource.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.length === 0) {
      // Crear la base de datos de pruebas
      await adminDataSource.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }

    await adminDataSource.destroy();
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupTestDatabase()
    .then(() => {
      console.log('Test database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to setup test database:', error);
      process.exit(1);
    });
}

export { setupTestDatabase };
