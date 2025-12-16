import { CommandHandler, ICommandHandler, QueryBus, CommandBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ProcessIncomingMessageCommand } from './command';
import { IWhatsAppClient, Button } from '../../../domain/interfaces/external/whatsapp-client';
import { Conversation } from '../../../domain/aggregates/conversation';
import { UUID } from '@shared/vo/uuid';
import { CreateAppointmentCommand } from '@booking/app/commands/create-appointment';
import { NoAvailableSlotsException } from '@booking/domain/exceptions/no-available-slots';
import { GetActiveOfferingsQuery } from '@offering/app/queries/get-active-offerings';
import { OfferingReadModel } from '@offering/domain/read-models/offering';

/**
 * TEMPORARY: This handler still uses the mock repository directly
 * because there's no real persistence layer yet.
 *
 * TODO: When real persistence is implemented:
 * 1. Inject IConversationFactory instead of IConversationWriteRepository
 * 2. Use factory.loadByCustomerIdAndBusinessId() to load conversations
 * 3. Keep using IConversationWriteRepository only for save()
 */
interface MockConversationRepository {
  findByCustomerIdAndBusinessId(customerId: UUID, businessId: UUID): Promise<Conversation | null>;
  save(conversation: Conversation): Promise<void>;
}

@CommandHandler(ProcessIncomingMessageCommand)
export class ProcessIncomingMessageHandler implements ICommandHandler<ProcessIncomingMessageCommand> {
  constructor(
    @Inject('IConversationWriteRepository')
    private readonly conversationRepository: MockConversationRepository,
    @Inject('IWhatsAppClient')
    private readonly whatsappClient: IWhatsAppClient,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: ProcessIncomingMessageCommand): Promise<void> {
    // Obtener o crear conversación
    const customerId = UUID.fromString(command.customerId);
    const businessId = UUID.fromString(command.businessId);

    let conversation = await this.conversationRepository.findByCustomerIdAndBusinessId(
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
      await this.conversationRepository.save(conversation);
    }

    // Máquina de estados: procesar según estado actual
    const state = conversation.getState();

    if (state.isInitial()) {
      // Transicionar a selección de servicio
      conversation.transitionToSelectingService();
      await this.conversationRepository.save(conversation);

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
          const appointmentDateTime = new Date(conversation.getSelectedDate()!);
          const selectedTime = conversation.getSelectedTime()!;
          appointmentDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

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
    const buttons: Button[] = [];

    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
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
    time: Date,
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
    return new Date(dateStr);
  }

  private parseTimeFromButtonId(buttonId: string): Date {
    // buttonId format: "time-HH:MM"
    const timeStr = buttonId.replace('time-', '');
    const [hours, minutes] = timeStr.split(':').map(Number);

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private formatDate(date: Date): string {
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

    return `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]}`;
  }

  private formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

}
