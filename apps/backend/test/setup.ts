import { config } from 'dotenv';
import { join } from 'path';

// Cargar variables de entorno de .env.test
config({ path: join(__dirname, '..', '.env.test') });

// Configurar base de datos única por worker de Jest para evitar conflictos de concurrencia
// Cuando se ejecuta con --runInBand, usar bookings_test directamente
// En modo paralelo, usar bookings_test_${workerId}
const isRunInBand = process.argv.includes('--runInBand');
const workerId = process.env.JEST_WORKER_ID;
process.env.DB_DATABASE = isRunInBand ? 'bookings_test' : `bookings_test_${workerId || '1'}`;
