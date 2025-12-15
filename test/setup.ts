import { config } from 'dotenv';
import { join } from 'path';

// Cargar variables de entorno de .env.test
config({ path: join(__dirname, '..', '.env.test') });

// Configurar base de datos única por worker de Jest para evitar conflictos de concurrencia
const workerId = process.env.JEST_WORKER_ID || '1';
process.env.DB_DATABASE = `bookings_test_${workerId}`;
