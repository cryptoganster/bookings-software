import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@auth/infra/guards/jwt-auth';
import { CurrentUser, UserPayload } from '@auth/presentation/decorators/current-user';
import { CreateAppointmentDto } from '../dtos/create-appointment.dto';
import { CreateAppointmentCommand } from '@booking/app/commands/create-appointment';
import { GetCustomerAppointmentsQuery } from '@booking/app/queries/get-customer-appointments';
import { GetAppointmentQuery } from '@booking/app/queries/get-appointment';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: UserPayload) {
    // Obtener citas del cliente actual
    const appointments = await this.queryBus.execute(
      new GetCustomerAppointmentsQuery(user.userId),
    );
    return appointments;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const appointment = await this.queryBus.execute(new GetAppointmentQuery(id));
    return appointment;
  }

  @Post()
  async create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: UserPayload) {
    // Usar businessId del usuario si está disponible, sino usar un valor por defecto
    const businessId = user.businessId || user.userId;

    const result = await this.commandBus.execute(
      new CreateAppointmentCommand(businessId, user.userId, dto.offeringId, dto.dateTime),
    );
    return result;
  }
}
