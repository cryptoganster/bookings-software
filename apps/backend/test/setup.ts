import { config } from 'dotenv';
import { join } from 'path';

// Cargar variables de entorno de .env.test
config({ path: join(__dirname, '..', '.env.test') });

// Usar siempre postgres_test como base de datos de test
// Los tests se ejecutarán secuencialmente con --runInBand
process.env.DB_DATABASE = 'postgres_test';
