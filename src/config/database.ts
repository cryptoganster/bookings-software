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
  entities: ['src/**/*.model.ts'],
  migrations: ['src/database/migrations/**/*.ts'],
  synchronize: false, // Nunca usar en producción
  logging: process.env.NODE_ENV === 'development',
  migrationsRun: false, // No ejecutar migraciones automáticamente
  migrationsTableName: 'migrations',
});
