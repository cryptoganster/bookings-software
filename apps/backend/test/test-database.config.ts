import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppointmentModel } from '@booking/infra/persistence/models/appointment';
import { CapacityModel } from '@availability/infra/persistence/models/capacity';
import { OfferingModel } from '@offering/infra/persistence/models/offering';
import { CustomerModel } from '@customer/infra/persistence/models/customer.model';
import { BusinessModel } from '@business/infra/persistence/models/business.model';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { UserModel } from '@auth/infra/persistence/models/user';

/**
 * Configuración centralizada de TypeORM para tests de integración
 * Incluye TODAS las entidades del sistema para que los joins funcionen correctamente
 */
export function getTestTypeOrmConfig(database?: string): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: database || process.env.DB_DATABASE || 'bookings_test',
    entities: [
      AppointmentModel,
      CapacityModel,
      OfferingModel,
      CustomerModel,
      BusinessModel,
      BusinessOwnerModel,
      UserModel,
    ],
    synchronize: true,
    dropSchema: false,
    logging: false,
  };
}
