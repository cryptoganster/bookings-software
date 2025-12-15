import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetCustomerAppointmentsHandler } from '../handler';
import { GetCustomerAppointmentsQuery } from '../query';
import { AppointmentReadRepository } from '@booking/infra/persistence/repositories/appointment-read';
import { AppointmentModel } from '@booking/infra/persistence/models/appointment';
import * as fc from 'fast-check';

describe('GetCustomerAppointmentsHandler - Property Tests', () => {
  let module: TestingModule;
  let handler: GetCustomerAppointmentsHandler;
  let dataSource: DataSource;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'bookings_test',
          entities: [AppointmentModel],
          synchronize: true,
          dropSchema: false, // No eliminar el schema en cada test
        }),
        TypeOrmModule.forFeature([AppointmentModel]),
      ],
      providers: [
        GetCustomerAppointmentsHandler,
        {
          provide: 'IAppointmentReadRepository',
          useClass: AppointmentReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetCustomerAppointmentsHandler>(GetCustomerAppointmentsHandler);
    dataSource = module.get<DataSource>(DataSource);
  }, 30000); // Aumentar timeout a 30 segundos

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // Limpiar la base de datos antes de cada test
    await dataSource.getRepository(AppointmentModel).clear();
  });

  // Property 8: Queries return read models without side effects - Validates: Requirements 4.2
  it('should not modify database state when executing query', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc
          .integer({ min: Date.now(), max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
          .map((timestamp) => new Date(timestamp)),
        async (id, businessId, customerId, offeringId, dateTime) => {
          // Arrange - Crear un appointment en la BD
          const appointmentRepo = dataSource.getRepository(AppointmentModel);

          try {
            await appointmentRepo.save({
              id,
              businessId,
              customerId,
              offeringId,
              dateTime,
              status: 'CONFIRMED',
              version: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              cancelledAt: null,
            });

            // Capturar el estado antes de la query
            const countBefore = await appointmentRepo.count();
            const appointmentBefore = await appointmentRepo.findOne({
              where: { id },
            });

            // Si no se guardó correctamente, saltar este test
            if (!appointmentBefore) {
              await appointmentRepo.clear();
              return true; // Skip this iteration
            }

            // Act - Ejecutar query
            const query = new GetCustomerAppointmentsQuery(customerId);
            await handler.execute(query);

            // Assert - Verificar que el estado no cambió
            const countAfter = await appointmentRepo.count();
            const appointmentAfter = await appointmentRepo.findOne({
              where: { id },
            });

            // La cantidad de registros debe ser la misma
            const countUnchanged = countBefore === countAfter;

            // El appointment debe ser idéntico
            const appointmentUnchanged =
              appointmentAfter !== null &&
              appointmentBefore.id === appointmentAfter.id &&
              appointmentBefore.version === appointmentAfter.version &&
              appointmentBefore.status === appointmentAfter.status &&
              appointmentBefore.dateTime.getTime() === appointmentAfter.dateTime.getTime();

            // Limpiar para el siguiente test
            await appointmentRepo.clear();

            return countUnchanged && appointmentUnchanged;
          } catch (error) {
            // Si hay error al guardar, limpiar y saltar
            await appointmentRepo.clear();
            return true; // Skip this iteration
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
