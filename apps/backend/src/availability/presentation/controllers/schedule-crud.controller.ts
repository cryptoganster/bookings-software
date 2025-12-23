import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@auth/infra/guards/jwt-auth';
import { CreateScheduleDto } from '@availability/presentation/dtos/create-schedule.dto';
import { UpdateScheduleDto } from '@availability/presentation/dtos/update-schedule.dto';
import { CreateScheduleCommand } from '@availability/app/commands/create-schedule/command';
import { UpdateScheduleCommand } from '@availability/app/commands/update-schedule/command';
import { DeleteScheduleCommand } from '@availability/app/commands/delete-schedule/command';
import { GetSchedulesByBusinessQuery } from '@availability/app/queries/get-schedules-by-business/query';

/**
 * Schedule CRUD Controller
 *
 * Handles HTTP requests for schedule management
 */
@Controller('schedules')
@UseGuards(JwtAuthGuard)
export class ScheduleCrudController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * POST /api/schedules
   * Create a new schedule
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateScheduleDto): Promise<{ id: string }> {
    const result = await this.commandBus.execute(
      new CreateScheduleCommand(dto.businessId, dto.dayOfWeek, dto.startTime, dto.endTime),
    );

    return { id: result.scheduleId };
  }

  /**
   * GET /api/schedules
   * Get schedules by business ID
   */
  @Get()
  async findByBusiness(@Query('businessId') businessId: string) {
    return this.queryBus.execute(new GetSchedulesByBusinessQuery(businessId));
  }

  /**
   * PUT /api/schedules/:id
   * Update a schedule
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ): Promise<{ message: string }> {
    await this.commandBus.execute(new UpdateScheduleCommand(id, dto.startTime, dto.endTime));

    return { message: 'Schedule updated successfully' };
  }

  /**
   * DELETE /api/schedules/:id
   * Delete a schedule
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.commandBus.execute(new DeleteScheduleCommand(id));

    return { message: 'Schedule deleted successfully' };
  }
}
