import { config } from 'dotenv';
import { join } from 'path';

// Cargar variables de entorno de .env.test
config({ path: join(__dirname, '..', '.env.test') });
