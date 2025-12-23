import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Logger } from '@nestjs/common';

// Cargar variables de entorno
config();

const logger = new Logger('DatabaseConfig');

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
    logger.log('Data Source has been initialized!');
  })
  .catch((err) => {
    logger.error('Error during Data Source initialization', err.stack);
    process.exit(1); // Exit on database connection failure
  });
