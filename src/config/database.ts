import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/**/*.model.js'],
  migrations: ['dist/database/migrations/**/*.js'],
  synchronize: false, // Nunca usar en producción
  logging: process.env.NODE_ENV === 'development',
  migrationsRun: false, // No ejecutar migraciones automáticamente
  migrationsTableName: 'migrations',
});

// Inicializar el DataSource para CLI
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });
