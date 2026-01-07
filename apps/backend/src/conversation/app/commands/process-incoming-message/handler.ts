import { CommandHandler, ICommandHandler, QueryBus, CommandBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ProcessIncomingMessageCommand } from '@conversation/app/commands/process-incoming-message/command';
import {
  IWhatsAppClient,
  Button,
  ListSection,
} from '@conversation/domain/interfaces/external/whatsapp-client';
import { Conversation } from '@conversation/domain/aggregates/conversation';
import { UUID } from '@shared/vo/uuid';
import { CreateAppointmentCommand } from '@booking/app/commands/create-appointment';
import { NoAvailableSlotsException } from '@booking/domain/exceptions/no-available-slots';
import { GetActiveOfferingsQuery } from '@offering/app/queries/get-active-offerings';
import { OfferingReadModel } from '@offering/domain/read-models/offering';
import { IdentifyCustomerCommand } from '@customer/app/commands/identify-customer';
import { IConversationFactory } from '@conversation/domain/interfaces/factories/conversation-factory';
import { IConversationWriteRepository } from '@conversation/domain/interfaces/repositories/conversation-write';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

@CommandHandler(ProcessIncomingMessageCommand)
export class ProcessIncomingMessageHandler implements ICommandHandler<ProcessIncomingMessageCommand> {
  constructor(
    @Inject('IConversationFactory')
    private readonly conversationFactory: IConversationFactory,
    @Inject('IConversationWriteRepository')
    private readonly conversationRepository: IConversationWriteRepository,
    @Inject('IWhatsAppClient')
    private readonly whatsappClient: IWhatsAppClient,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProcessIncomingMessageHandler.name);
  }

  async execute(command: ProcessIncomingMessageCommand): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      try {
        await this.processMessage(command);
        return; // Éxito
      } catch (error) {
        lastError = error as Error;
        if (error instanceof ConcurrencyException) {
          attempt++;
          if (attempt >= maxRetries) {
            throw new Error(
              'Unable to process message after multiple attempts due to concurrency. Please try again.',
            );
          }
          // Exponential backoff: 100ms, 200ms, 400ms
          await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        } else {
          // Para otros errores, propagar inmediatamente con contexto
          throw new Error(
            `Failed to process message: ${lastError.message}. Stack: ${lastError.stack}`,
          );
        }
      }
    }
  }

  private async processMessage(command: ProcessIncomingMessageCommand): Promise<void> {
    this.logger.info(
      {
        businessId: command.businessId,
        customerPhone: command.customerPhone,
        messageText: command.messageText,
        buttonId: command.buttonId,
      },
      'Starting message processing',
    );

    // 1. Identificar o crear customer (anónimo) antes de procesar conversación
    // Esto garantiza que el customer existe en la BD antes de crear la conversación
    let customerId: UUID;
    let businessId: UUID;

    try {
      this.logger.info('Identifying customer...');
      const identifyResult = await this.commandBus.execute(
        new IdentifyCustomerCommand(
          command.businessId,
          command.customerPhone,
          null, // Nombre se obtendrá después del perfil de WhatsApp
        ),
      );

      this.logger.info(
        { customerId: identifyResult.customerId },
        'Customer identified successfully',
      );

      // Usar el customerId retornado por IdentifyCustomerCommand
      customerId = UUID.fromString(identifyResult.customerId);
      businessId = UUID.fromString(command.businessId);
    } catch (error) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          businessId: command.businessId,
          customerPhone: command.customerPhone,
        },
        'Failed to identify customer',
      );
      throw error;
    }

    /**
     * TODO (Task 7.3): Update customer name when obtained from WhatsApp profile
     *
     * When WhatsApp Business API provides customer name from profile:
     *
     * ```typescript
     * if (command.customerName && command.customerName !== '') {
     *   await this.commandBus.execute(
     *     new UpdateCustomerNameCommand(customerId.getValue(), command.customerName)
     *   );
     * }
     * ```
     *
     * This will:
     * - Update the customer's name in the database
     * - Publish CustomerNameUpdated event
     * - Allow Booking BC to refresh appointment display names
     *
     * **Requirements: 8.3**
     */

    // 2. Obtener o crear conversación usando factory
    let conversation: Conversation;

    try {
      this.logger.info('Loading conversation...');
      const existingConversation = await this.conversationFactory.loadByCustomerIdAndBusinessId(
        customerId,
        businessId,
      );

      if (!existingConversation) {
        this.logger.info('No existing conversation found, creating new one');
        // Crear nueva conversación
        conversation = Conversation.start(
          UUID.generate(),
          businessId,
          customerId,
          command.customerPhone,
        );
        // NO guardar aquí - se guardará después de transicionar el estado
      } else {
        this.logger.info(
          {
            conversationId: existingConversation.getId().getValue(),
            state: existingConversation.getState().getValue(),
          },
          'Loaded existing conversation',
        );
        conversation = existingConversation;
      }
    } catch (error) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          customerId: customerId.getValue(),
          businessId: businessId.getValue(),
        },
        'Failed to load/create conversation',
      );
      throw error;
    }

    // Máquina de estados: procesar según estado actual
    const state = conversation.getState();
    this.logger.info({ state: state.getValue() }, 'Processing conversation state');

    if (state.isInitial()) {
      this.logger.info('State: INITIAL - transitioning to selecting service');
      // Transicionar a selección de servicio
      conversation.transitionToSelectingService();
      await this.conversationRepository.save(conversation); // Guardar una sola vez

      // Enviar botones de servicios disponibles
      await this.sendServiceSelectionButtons(command.customerPhone, businessId.getValue());
    } else if (state.isSelectingService()) {
      this.logger.info({ buttonId: command.buttonId }, 'State: SELECTING_SERVICE');

      if (command.buttonId) {
        // Cliente seleccionó un servicio mediante botón
        conversation.selectService(command.buttonId);
        await this.conversationRepository.save(conversation);

        // Enviar fechas disponibles
        await this.sendDateSelectionButtons(command.customerPhone);
      } else {
        // Cliente envió texto pero está en estado de selección de servicio
        // Re-enviar los botones de servicios
        this.logger.info('No button ID provided, re-sending service selection buttons');
        await this.sendServiceSelectionButtons(command.customerPhone, businessId.getValue());
      }
    } else if (state.isSelectingDate()) {
      this.logger.info({ buttonId: command.buttonId }, 'State: SELECTING_DATE');

      if (command.buttonId) {
        // Cliente seleccionó una fecha mediante botón
        const selectedDate = this.parseDateFromButtonId(command.buttonId);
        conversation.selectDate(selectedDate);
        await this.conversationRepository.save(conversation);

        // Enviar horarios disponibles
        await this.sendTimeSelectionButtons(
          command.customerPhone,
          businessId.getValue(),
          conversation.getSelectedOfferingId()!,
          selectedDate,
        );
      } else {
        // Cliente envió texto pero está en estado de selección de fecha
        // Re-enviar los botones de fechas
        this.logger.info('No button ID provided, re-sending date selection buttons');
        await this.sendDateSelectionButtons(command.customerPhone);
      }
    } else if (state.isSelectingTime()) {
      this.logger.info({ buttonId: command.buttonId }, 'State: SELECTING_TIME');

      if (command.buttonId) {
        // Cliente seleccionó un horario mediante botón
        const selectedTime = this.parseTimeFromButtonId(command.buttonId);
        conversation.selectTime(selectedTime);
        await this.conversationRepository.save(conversation);

        // Enviar confirmación
        await this.sendConfirmationButtons(
          command.customerPhone,
          conversation.getSelectedOfferingId()!,
          conversation.getSelectedDate()!,
          selectedTime,
        );
      } else {
        // Cliente envió texto pero está en estado de selección de horario
        // Re-enviar los botones de horarios
        this.logger.info('No button ID provided, re-sending time selection buttons');
        await this.sendTimeSelectionButtons(
          command.customerPhone,
          businessId.getValue(),
          conversation.getSelectedOfferingId()!,
          conversation.getSelectedDate()!,
        );
      }
    } else if (state.isConfirming()) {
      this.logger.info({ buttonId: command.buttonId }, 'State: CONFIRMING');

      if (command.buttonId === 'confirm') {
        // Crear cita
        try {
          // Combinar fecha y hora seleccionadas
          const selectedDate = conversation.getSelectedDate();
          const selectedTime = conversation.getSelectedTime();

          const appointmentDateTime = new Date(selectedDate!);

          // Parse time string "HH:MM" to hours and minutes
          const [hours, minutes] = selectedTime!.split(':').map(Number);

          appointmentDateTime.setUTCHours(hours, minutes, 0, 0);

          this.logger.info(
            {
              selectedDate: conversation.getSelectedDate(),
              selectedTime: conversation.getSelectedTime(),
              appointmentDateTime: appointmentDateTime.toISOString(),
              offeringId: conversation.getSelectedOfferingId(),
            },
            'Creating appointment with combined date/time',
          );

          const result = await this.commandBus.execute(
            new CreateAppointmentCommand(
              businessId.getValue(),
              customerId.getValue(),
              conversation.getSelectedOfferingId()!,
              appointmentDateTime,
            ),
          );

          conversation.complete(result.appointmentId);
          await this.conversationRepository.save(conversation);

          // Enviar confirmación exitosa
          await this.whatsappClient.sendMessage(
            command.customerPhone,
            `✅ ¡Tu cita ha sido confirmada!\n\n` +
              `📅 Fecha: ${this.formatDate(conversation.getSelectedDate()!)}\n` +
              `🕐 Hora: ${this.formatTime(conversation.getSelectedTime()!)}\n` +
              `📍 Te esperamos!`,
          );
        } catch (error: unknown) {
          // Manejar NoAvailableSlotsException específicamente
          if (error instanceof NoAvailableSlotsException) {
            await this.whatsappClient.sendMessage(
              command.customerPhone,
              '❌ Este horario ya no está disponible. Por favor selecciona otro horario.',
            );

            // Volver a selección de horario cambiando el estado
            conversation.transitionToSelectingTime();
            await this.conversationRepository.save(conversation);

            await this.sendTimeSelectionButtons(
              command.customerPhone,
              businessId.getValue(),
              conversation.getSelectedOfferingId()!,
              conversation.getSelectedDate()!,
            );
          } else {
            throw error;
          }
        }
      } else if (command.buttonId === 'change') {
        // Reiniciar flujo
        conversation.transitionToSelectingService();
        await this.conversationRepository.save(conversation);

        await this.sendServiceSelectionButtons(command.customerPhone, businessId.getValue());
      } else {
        // Cliente envió texto pero está en estado de confirmación
        // Re-enviar los botones de confirmación
        this.logger.info('No valid button ID provided, re-sending confirmation buttons');
        await this.sendConfirmationButtons(
          command.customerPhone,
          conversation.getSelectedOfferingId()!,
          conversation.getSelectedDate()!,
          conversation.getSelectedTime()!,
        );
      }
    } else if (state.isCompleted()) {
      // Conversación completada - el usuario quiere iniciar una nueva reserva
      this.logger.info('State: COMPLETED - Restarting conversation for new appointment');

      // Reiniciar la conversación al estado inicial
      conversation.transitionToSelectingService();
      await this.conversationRepository.save(conversation);

      // Enviar mensaje de bienvenida y opciones de servicio
      await this.whatsappClient.sendMessage(
        command.customerPhone,
        '¡Hola de nuevo! 👋\n\n¿Qué servicio deseas agendar?',
      );

      await this.sendServiceSelectionButtons(command.customerPhone, businessId.getValue());
    }

    this.logger.info('Message processing completed successfully');
  }

  private async sendServiceSelectionButtons(
    customerPhone: string,
    businessId?: string,
  ): Promise<void> {
    try {
      // Si no se proporciona businessId, extraerlo del customerPhone o contexto
      // Por ahora, asumimos que se pasa como parámetro
      if (!businessId) {
        throw new Error('businessId is required to fetch offerings');
      }

      this.logger.info({ businessId }, 'Fetching active offerings');

      // Obtener servicios activos desde la BD
      const offerings: OfferingReadModel[] = await this.queryBus.execute(
        new GetActiveOfferingsQuery(businessId),
      );

      this.logger.info({ offeringsCount: offerings.length }, 'Offerings fetched');

      // Si no hay offerings activos, enviar mensaje informativo
      if (offerings.length === 0) {
        this.logger.warn('No active offerings found, sending informative message');
        await this.whatsappClient.sendMessage(
          customerPhone,
          'Lo sentimos, actualmente no tenemos servicios disponibles. Por favor intenta más tarde.',
        );
        return;
      }

      // WhatsApp API limits: Buttons max 3, Lists max 10 items per section
      if (offerings.length <= 3) {
        // Use buttons for 3 or fewer offerings
        const buttons: Button[] = offerings.map((offering) => ({
          id: offering.id, // UUID real del offering
          title: offering.name,
        }));

        this.logger.info(
          {
            customerPhone,
            buttonsCount: buttons.length,
            buttons: buttons.map((b) => ({ id: b.id, title: b.title })),
          },
          'Sending interactive buttons to WhatsApp',
        );

        await this.whatsappClient.sendInteractiveButtons(
          customerPhone,
          '¡Hola! 👋 Bienvenido\n\n¿Qué servicio deseas agendar?',
          buttons,
        );

        this.logger.info('Interactive buttons sent successfully');
      } else {
        // Use list for more than 3 offerings
        const sections: ListSection[] = [
          {
            title: 'Servicios Disponibles',
            rows: offerings.map((offering) => ({
              id: offering.id, // UUID real del offering
              title: offering.name,
              description: `${offering.duration} minutos`,
            })),
          },
        ];

        this.logger.info(
          {
            customerPhone,
            sectionsCount: sections.length,
            totalRows: sections[0].rows.length,
            rows: sections[0].rows.map((r) => ({ id: r.id, title: r.title })),
          },
          'Sending interactive list to WhatsApp',
        );

        await this.whatsappClient.sendInteractiveList(
          customerPhone,
          '¡Hola! 👋 Bienvenido\n\n¿Qué servicio deseas agendar?',
          'Ver Servicios',
          sections,
        );

        this.logger.info('Interactive list sent successfully');
      }
    } catch (error) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          customerPhone,
          businessId,
        },
        'Failed to send service selection buttons',
      );
      throw error;
    }
  }

  private async sendDateSelectionButtons(customerPhone: string): Promise<void> {
    // TODO: Obtener fechas disponibles desde GetAvailableDatesQuery
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC

    const dateOptions = [];

    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() + i); // Use UTC methods
      dateOptions.push({
        id: `date-${date.toISOString().split('T')[0]}`,
        title: this.formatDate(date),
      });
    }

    const headerText = 'Selecciona una fecha:';

    // WhatsApp API limits: Buttons max 3, Lists max 10 items per section
    if (dateOptions.length <= 3) {
      // Use buttons for 3 or fewer dates
      this.logger.info(
        {
          customerPhone,
          datesCount: dateOptions.length,
          dates: dateOptions.map((d) => ({ id: d.id, title: d.title })),
        },
        'Sending dates as interactive buttons',
      );

      await this.whatsappClient.sendInteractiveButtons(customerPhone, headerText, dateOptions);
    } else {
      // Use list for more than 3 dates
      const sections: ListSection[] = [
        {
          title: 'Fechas Disponibles',
          rows: dateOptions.map((date) => ({
            id: date.id,
            title: date.title,
          })),
        },
      ];

      this.logger.info(
        {
          customerPhone,
          datesCount: dateOptions.length,
          dates: dateOptions.map((d) => ({ id: d.id, title: d.title })),
        },
        'Sending dates as interactive list',
      );

      await this.whatsappClient.sendInteractiveList(
        customerPhone,
        headerText,
        'Ver Fechas',
        sections,
      );
    }
  }

  private async sendTimeSelectionButtons(
    customerPhone: string,
    businessId: string,
    offeringId: string,
    date: Date,
  ): Promise<void> {
    // TODO: Obtener horarios disponibles desde GetAvailableTimeSlotsQuery
    const timeSlots = [
      { id: 'time-09:00', title: '9:00 AM' },
      { id: 'time-10:30', title: '10:30 AM' },
      { id: 'time-14:00', title: '2:00 PM' },
      { id: 'time-16:00', title: '4:00 PM' },
    ];

    const headerText = `Horarios disponibles para ${this.formatDate(date)}:`;

    // WhatsApp API limits: Buttons max 3, Lists max 10 items per section
    if (timeSlots.length <= 3) {
      // Use buttons for 3 or fewer time slots
      this.logger.info(
        {
          customerPhone,
          timeSlotsCount: timeSlots.length,
          timeSlots: timeSlots.map((t) => ({ id: t.id, title: t.title })),
        },
        'Sending time slots as interactive buttons',
      );

      await this.whatsappClient.sendInteractiveButtons(customerPhone, headerText, timeSlots);
    } else {
      // Use list for more than 3 time slots
      const sections: ListSection[] = [
        {
          title: 'Horarios Disponibles',
          rows: timeSlots.map((slot) => ({
            id: slot.id,
            title: slot.title,
          })),
        },
      ];

      this.logger.info(
        {
          customerPhone,
          timeSlotsCount: timeSlots.length,
          timeSlots: timeSlots.map((t) => ({ id: t.id, title: t.title })),
        },
        'Sending time slots as interactive list',
      );

      await this.whatsappClient.sendInteractiveList(
        customerPhone,
        headerText,
        'Ver Horarios',
        sections,
      );
    }
  }

  private async sendConfirmationButtons(
    customerPhone: string,
    offeringId: string,
    date: Date,
    time: string,
  ): Promise<void> {
    const buttons: Button[] = [
      { id: 'confirm', title: 'Confirmar' },
      { id: 'change', title: 'Cambiar' },
    ];

    await this.whatsappClient.sendInteractiveButtons(
      customerPhone,
      `Confirma tu cita:\n\n` +
        `📅 ${this.formatDate(date)}\n` +
        `🕐 ${this.formatTime(time)}\n` +
        `✂️ Servicio seleccionado`,
      buttons,
    );
  }

  private parseDateFromButtonId(buttonId: string): Date {
    // buttonId format: "date-YYYY-MM-DD"
    const dateStr = buttonId.replace('date-', '');
    // Parse as UTC to avoid timezone issues
    // new Date('YYYY-MM-DD') creates midnight in local timezone
    // We need midnight UTC to match capacity records
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  private parseTimeFromButtonId(buttonId: string): string {
    // buttonId format: "time-HH:MM"
    const timeStr = buttonId.replace('time-', '');
    return timeStr; // Return as "HH:MM" string
  }

  private formatDate(date: Date | string): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    // Ensure date is a Date object
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Use UTC methods to match the UTC date stored in the database
    return `${days[dateObj.getUTCDay()]} ${dateObj.getUTCDate()} de ${months[dateObj.getUTCMonth()]}`;
  }

  private formatTime(time: Date | string): string {
    // If time is already a string in "HH:MM" format, parse it
    if (typeof time === 'string') {
      const [hours, minutes] = time.split(':').map(Number);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }

    // If time is a Date object, extract hours and minutes
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }
}
