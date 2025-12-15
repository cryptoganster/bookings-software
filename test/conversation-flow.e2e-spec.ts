import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { CommandBus } from '@nestjs/cqrs';
import { ProcessIncomingMessageCommand } from '../src/conversation/app/commands/process-incoming-message';
import {
  IWhatsAppClient,
  Button,
} from '../src/conversation/domain/interfaces/external/whatsapp-client';
import { UUID } from '../src/shared/vo/uuid';
import { CapacityModel } from '../src/availability/infra/persistence/models/capacity';
import { AppointmentModel } from '../src/booking/infra/persistence/models/appointment';

describe('Conversational Booking Flow (e2e)', () => {
  let app: INestApplication;
  let commandBus: CommandBus;
  let dataSource: DataSource;
  let mockWhatsAppClient: jest.Mocked<IWhatsAppClient>;

  // Variables para rastrear el flujo
  let sentMessages: Array<{ phone: string; message: string; buttons?: Button[] }> = [];
  let testBusinessId: string;
  let testCustomerId: string;
  let testOfferingId: string;
  const testCustomerPhone = '+1234567890';

  beforeAll(async () => {
    // Crear mock del WhatsApp client
    mockWhatsAppClient = {
      sendMessage: jest.fn().mockImplementation(async (to: string, message: string) => {
        sentMessages.push({ phone: to, message });
      }),
      sendInteractiveButtons: jest
        .fn()
        .mockImplementation(async (to: string, message: string, buttons: Button[]) => {
          sentMessages.push({ phone: to, message, buttons });
        }),
      sendLocation: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('IWhatsAppClient')
      .useValue(mockWhatsAppClient)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    commandBus = app.get(CommandBus);
    dataSource = app.get(DataSource);

    // Limpiar base de datos
    await dataSource.query('DELETE FROM appointments');
    await dataSource.query('DELETE FROM capacities');

    // Generar IDs de prueba
    testBusinessId = UUID.generate().getValue();
    testCustomerId = UUID.generate().getValue();
    testOfferingId = UUID.generate().getValue();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Limpiar mensajes enviados
    sentMessages = [];
    mockWhatsAppClient.sendMessage.mockClear();
    mockWhatsAppClient.sendInteractiveButtons.mockClear();

    // Limpiar base de datos
    await dataSource.query('DELETE FROM appointments');
    await dataSource.query('DELETE FROM capacities');
  });

  describe('Flujo completo: mensaje inicial → selección servicio → fecha → hora → confirmación', () => {
    it('debe completar el flujo de reservación exitosamente', async () => {
      // Crear capacidad disponible para pruebas
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const capacity = new CapacityModel();
      capacity.id = UUID.generate().getValue();
      capacity.offeringId = testOfferingId;
      capacity.date = tomorrow;
      capacity.totalSlots = 10;
      capacity.availableSlots = 5;
      capacity.version = 0;

      await dataSource.getRepository(CapacityModel).save(capacity);

      // Paso 1: Cliente envía mensaje inicial
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          'Hola',
          undefined,
        ),
      );

      // Verificar que se enviaron botones de selección de servicio
      expect(mockWhatsAppClient.sendInteractiveButtons).toHaveBeenCalledTimes(1);
      expect(sentMessages[0].message).toContain('¿Qué servicio deseas agendar?');
      expect(sentMessages[0].buttons).toBeDefined();
      expect(sentMessages[0].buttons!.length).toBeGreaterThan(0);

      // Paso 2: Cliente selecciona un servicio
      sentMessages = [];
      mockWhatsAppClient.sendInteractiveButtons.mockClear();
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          testOfferingId, // Usar el UUID real del offering
        ),
      );

      // Verificar que se enviaron botones de selección de fecha
      expect(mockWhatsAppClient.sendInteractiveButtons).toHaveBeenCalledTimes(1);
      expect(sentMessages[0].message).toContain('Selecciona una fecha');
      expect(sentMessages[0].buttons).toBeDefined();
      expect(sentMessages[0].buttons!.length).toBeGreaterThan(0);

      // Paso 3: Cliente selecciona una fecha
      const dateButtonId = sentMessages[0].buttons![0].id;
      sentMessages = [];
      mockWhatsAppClient.sendInteractiveButtons.mockClear();
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          dateButtonId,
        ),
      );

      // Verificar que se enviaron botones de selección de hora
      expect(mockWhatsAppClient.sendInteractiveButtons).toHaveBeenCalledTimes(1);
      expect(sentMessages[0].message).toContain('Horarios disponibles');
      expect(sentMessages[0].buttons).toBeDefined();
      expect(sentMessages[0].buttons!.length).toBeGreaterThan(0);

      // Paso 4: Cliente selecciona una hora
      const timeButtonId = sentMessages[0].buttons![0].id;
      sentMessages = [];
      mockWhatsAppClient.sendInteractiveButtons.mockClear();
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          timeButtonId,
        ),
      );

      // Verificar que se enviaron botones de confirmación
      expect(mockWhatsAppClient.sendInteractiveButtons).toHaveBeenCalledTimes(1);
      expect(sentMessages[0].message).toContain('Confirma tu cita');
      expect(sentMessages[0].buttons).toBeDefined();
      const confirmButton = sentMessages[0].buttons!.find((b) => b.id === 'confirm');
      expect(confirmButton).toBeDefined();

      // Paso 5: Cliente confirma la cita
      sentMessages = [];
      mockWhatsAppClient.sendInteractiveButtons.mockClear();
      mockWhatsAppClient.sendMessage.mockClear();
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          'confirm',
        ),
      );

      // Verificar que se envió mensaje de confirmación exitosa
      expect(mockWhatsAppClient.sendMessage).toHaveBeenCalledTimes(1);
      expect(sentMessages[0].message).toContain('Tu cita ha sido confirmada');
      expect(sentMessages[0].message).toContain('📅');
      expect(sentMessages[0].message).toContain('🕐');

      // Verificar que se creó la cita en la base de datos
      const appointments = await dataSource.getRepository(AppointmentModel).find();
      expect(appointments).toHaveLength(1);
      expect(appointments[0].businessId).toBe(testBusinessId);
      expect(appointments[0].customerId).toBe(testCustomerId);
      expect(appointments[0].offeringId).toBe(testOfferingId);
      expect(appointments[0].status).toBe('CONFIRMED');

      // Verificar que se decrementó la capacidad
      const updatedCapacity = await dataSource.getRepository(CapacityModel).findOne({
        where: { id: capacity.id },
      });
      expect(updatedCapacity!.availableSlots).toBe(4);
    });

    it('debe permitir cambiar la selección antes de confirmar', async () => {
      // Crear capacidad disponible
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const capacity = new CapacityModel();
      capacity.id = UUID.generate().getValue();
      capacity.offeringId = testOfferingId;
      capacity.date = tomorrow;
      capacity.totalSlots = 10;
      capacity.availableSlots = 5;
      capacity.version = 0;

      await dataSource.getRepository(CapacityModel).save(capacity);

      // Completar flujo hasta confirmación
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          'Hola',
          undefined,
        ),
      );

      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          testOfferingId,
        ),
      );

      const dateButtonId = sentMessages[0].buttons![0].id;
      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          dateButtonId,
        ),
      );

      const timeButtonId = sentMessages[0].buttons![0].id;
      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          timeButtonId,
        ),
      );

      // Cliente selecciona "Cambiar" en lugar de "Confirmar"
      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          'change',
        ),
      );

      // Verificar que se reinició el flujo con selección de servicio
      expect(mockWhatsAppClient.sendInteractiveButtons).toHaveBeenCalledTimes(1);
      expect(sentMessages[0].message).toContain('¿Qué servicio deseas agendar?');

      // Verificar que NO se creó ninguna cita
      const appointments = await dataSource.getRepository(AppointmentModel).find();
      expect(appointments).toHaveLength(0);

      // Verificar que la capacidad NO cambió
      const updatedCapacity = await dataSource.getRepository(CapacityModel).findOne({
        where: { id: capacity.id },
      });
      expect(updatedCapacity!.availableSlots).toBe(5);
    });
  });

  describe('Manejo de slot no disponible', () => {
    it('debe manejar cuando el slot ya no está disponible al confirmar', async () => {
      // Crear capacidad con solo 1 slot disponible
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const capacity = new CapacityModel();
      capacity.id = UUID.generate().getValue();
      capacity.offeringId = testOfferingId;
      capacity.date = tomorrow;
      capacity.totalSlots = 10;
      capacity.availableSlots = 1; // Solo 1 slot disponible
      capacity.version = 0;

      await dataSource.getRepository(CapacityModel).save(capacity);

      // Completar flujo hasta confirmación
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          'Hola',
          undefined,
        ),
      );

      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          testOfferingId,
        ),
      );

      const dateButtonId = sentMessages[0].buttons![0].id;
      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          dateButtonId,
        ),
      );

      const timeButtonId = sentMessages[0].buttons![0].id;
      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          timeButtonId,
        ),
      );

      // Simular que otro usuario tomó el último slot
      // (decrementar capacidad manualmente)
      await dataSource.getRepository(CapacityModel).update(
        { id: capacity.id },
        {
          availableSlots: 0,
          version: 1,
        },
      );

      // Cliente intenta confirmar
      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          'confirm',
        ),
      );

      // Verificar que se envió mensaje de error
      expect(mockWhatsAppClient.sendMessage).toHaveBeenCalled();
      const errorMessage = sentMessages.find((m) => m.message.includes('ya no está disponible'));
      expect(errorMessage).toBeDefined();
      expect(errorMessage!.message).toContain('❌');

      // Verificar que se volvió a mostrar selección de horarios
      expect(mockWhatsAppClient.sendInteractiveButtons).toHaveBeenCalled();
      const timeSelectionMessage = sentMessages.find((m) =>
        m.message.includes('Horarios disponibles'),
      );
      expect(timeSelectionMessage).toBeDefined();

      // Verificar que NO se creó la cita
      const appointments = await dataSource.getRepository(AppointmentModel).find();
      expect(appointments).toHaveLength(0);
    });

    it('debe permitir seleccionar otro horario después de que uno no esté disponible', async () => {
      // Crear capacidad con 2 slots disponibles
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const capacity = new CapacityModel();
      capacity.id = UUID.generate().getValue();
      capacity.offeringId = testOfferingId;
      capacity.date = tomorrow;
      capacity.totalSlots = 10;
      capacity.availableSlots = 2;
      capacity.version = 0;

      await dataSource.getRepository(CapacityModel).save(capacity);

      // Completar flujo hasta confirmación
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          'Hola',
          undefined,
        ),
      );

      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          testOfferingId,
        ),
      );

      const dateButtonId = sentMessages[0].buttons![0].id;
      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          dateButtonId,
        ),
      );

      const timeButtonId = sentMessages[0].buttons![0].id;
      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          timeButtonId,
        ),
      );

      // Simular que otro usuario tomó un slot (queda 1)
      await dataSource.getRepository(CapacityModel).update(
        { id: capacity.id },
        {
          availableSlots: 1,
          version: 1,
        },
      );

      // Cliente intenta confirmar (fallará por versión)
      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          'confirm',
        ),
      );

      // Ahora el cliente selecciona otro horario
      const newTimeButtonId = 'time-14:00';
      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          newTimeButtonId,
        ),
      );

      // Verificar que se muestra confirmación nuevamente
      expect(mockWhatsAppClient.sendInteractiveButtons).toHaveBeenCalled();
      const confirmMessage = sentMessages.find((m) => m.message.includes('Confirma tu cita'));
      expect(confirmMessage).toBeDefined();

      // Cliente confirma con el nuevo horario
      sentMessages = [];
      await commandBus.execute(
        new ProcessIncomingMessageCommand(
          testBusinessId,
          testCustomerId,
          testCustomerPhone,
          '',
          'confirm',
        ),
      );

      // Verificar que se creó la cita exitosamente
      expect(mockWhatsAppClient.sendMessage).toHaveBeenCalled();
      const successMessage = sentMessages.find((m) => m.message.includes('confirmada'));
      expect(successMessage).toBeDefined();

      const appointments = await dataSource.getRepository(AppointmentModel).find();
      expect(appointments).toHaveLength(1);
    });
  });
});
