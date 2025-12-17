import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@auth/infra/guards/jwt-auth';
import { CurrentUser, UserPayload } from '@auth/presentation/decorators/current-user';
import { CreateAppointmentDto } from '../dtos/create-appointment.dto';
import { AppointmentFiltersDto } from '../dtos/appointment-filters.dto';
import { CreateAppointmentCommand } from '@booking/app/commands/create-appointment';
import { CancelAppointmentCommand } from '@booking/app/commands/cancel-appointment';
import { GetBusinessAppointmentsQuery } from '@booking/app/queries/get-business-appointments';
import { GetAppointmentQuery } from '@booking/app/queries/get-appointment';
import { GetUpcomingAppointmentsQuery } from '@booking/app/queries/get-upcoming-appointments';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: UserPayload, @Query() filtersDto: AppointmentFiltersDto) {
    // Obtener todas las citas del negocio con filtros opcionales
    const businessId = user.businessId || user.userId;

    // Convertir DTO a filtros del dominio
    const filters = {
      status: filtersDto.status,
      startDate: filtersDto.startDate ? new Date(filtersDto.startDate) : undefined,
      endDate: filtersDto.endDate ? new Date(filtersDto.endDate) : undefined,
      offeringId: filtersDto.offeringId,
      customerId: filtersDto.customerId,
    };

    const appointments = await this.queryBus.execute(
      new GetBusinessAppointmentsQuery(businessId, filters),
    );
    return appointments;
  }

  @Get('upcoming')
  async findUpcoming(@CurrentUser() user: UserPayload) {
    const businessId = user.businessId || user.userId;
    const appointments = await this.queryBus.execute(
      new GetUpcomingAppointmentsQuery(businessId),
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

  @Put(':id/cancel')
  async cancel(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.commandBus.execute(new CancelAppointmentCommand(id, user.userId));
    return { message: 'Appointment cancelled successfully' };
  }
}
