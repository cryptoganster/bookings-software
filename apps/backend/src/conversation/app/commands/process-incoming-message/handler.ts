import { CommandHandler, ICommandHandler, QueryBus, CommandBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ProcessIncomingMessageCommand } from '@conversation/app/commands/process-incoming-message/command';
import { IWhatsAppClient, Button } from '@conversation/domain/interfaces/external/whatsapp-client';
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
    // 1. Identificar o crear customer (anónimo) antes de procesar conversación
    // Esto garantiza que el customer existe en la BD antes de crear la conversación
    const identifyResult = await this.commandBus.execute(
      new IdentifyCustomerCommand(
        command.businessId,
        command.customerPhone,
        null, // Nombre se obtendrá después del perfil de WhatsApp
      ),
    );

    // Usar el customerId retornado por IdentifyCustomerCommand
    const customerId = UUID.fromString(identifyResult.customerId);
    const businessId = UUID.fromString(command.businessId);

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
    let conversation = await this.conversationFactory.loadByCustomerIdAndBusinessId(
      customerId,
      businessId,
    );

    if (!conversation) {
      // Crear nueva conversación
      conversation = Conversation.start(
        UUID.generate(),
        businessId,
        customerId,
        command.customerPhone,
      );
      // NO guardar aquí - se guardará después de transicionar el estado
    }

    // Máquina de estados: procesar según estado actual
    const state = conversation.getState();

    if (state.isInitial()) {
      // Transicionar a selección de servicio
      conversation.transitionToSelectingService();
      await this.conversationRepository.save(conversation); // Guardar una sola vez

      // Enviar botones de servicios disponibles
      await this.sendServiceSelectionButtons(command.customerPhone, businessId.getValue());
    } else if (state.isSelectingService()) {
      // Cliente seleccionó un servicio
      if (command.buttonId) {
        // El buttonId es el UUID real del offering
        conversation.selectService(command.buttonId);
        await this.conversationRepository.save(conversation);

        // Enviar fechas disponibles
        await this.sendDateSelectionButtons(command.customerPhone);
      }
    } else if (state.isSelectingDate()) {
      // Cliente seleccionó una fecha
      if (command.buttonId) {
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
      }
    } else if (state.isSelectingTime()) {
      // Cliente seleccionó un horario
      if (command.buttonId) {
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
      }
    } else if (state.isConfirming()) {
      // Cliente confirmó o cambió
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
      }
    }
  }

  private async sendServiceSelectionButtons(
    customerPhone: string,
    businessId?: string,
  ): Promise<void> {
    // Si no se proporciona businessId, extraerlo del customerPhone o contexto
    // Por ahora, asumimos que se pasa como parámetro
    if (!businessId) {
      throw new Error('businessId is required to fetch offerings');
    }

    // Obtener servicios activos desde la BD
    const offerings: OfferingReadModel[] = await this.queryBus.execute(
      new GetActiveOfferingsQuery(businessId),
    );

    // Si no hay offerings activos, enviar mensaje informativo
    if (offerings.length === 0) {
      await this.whatsappClient.sendMessage(
        customerPhone,
        'Lo sentimos, actualmente no tenemos servicios disponibles. Por favor intenta más tarde.',
      );
      return;
    }

    // Mapear offerings a botones interactivos
    // Usar el UUID real del offering como button ID
    const buttons: Button[] = offerings.map((offering) => ({
      id: offering.id, // UUID real del offering
      title: offering.name,
    }));

    await this.whatsappClient.sendInteractiveButtons(
      customerPhone,
      '¡Hola! 👋 Bienvenido\n\n¿Qué servicio deseas agendar?',
      buttons,
    );
  }

  private async sendDateSelectionButtons(customerPhone: string): Promise<void> {
    // TODO: Obtener fechas disponibles desde GetAvailableDatesQuery
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC

    const buttons: Button[] = [];

    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() + i); // Use UTC methods
      buttons.push({
        id: `date-${date.toISOString().split('T')[0]}`,
        title: this.formatDate(date),
      });
    }

    await this.whatsappClient.sendInteractiveButtons(
      customerPhone,
      'Selecciona una fecha:',
      buttons,
    );
  }

  private async sendTimeSelectionButtons(
    customerPhone: string,
    businessId: string,
    offeringId: string,
    date: Date,
  ): Promise<void> {
    // TODO: Obtener horarios disponibles desde GetAvailableTimeSlotsQuery
    const buttons: Button[] = [
      { id: 'time-09:00', title: '9:00 AM' },
      { id: 'time-10:30', title: '10:30 AM' },
      { id: 'time-14:00', title: '2:00 PM' },
      { id: 'time-16:00', title: '4:00 PM' },
    ];

    await this.whatsappClient.sendInteractiveButtons(
      customerPhone,
      `Horarios disponibles para ${this.formatDate(date)}:`,
      buttons,
    );
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
