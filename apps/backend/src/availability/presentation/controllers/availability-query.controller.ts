import { Controller, Get, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@auth/infra/guards/jwt-auth';
import { GetAvailableDatesDto } from '@availability/presentation/dtos/get-available-dates.dto';
import { GetAvailableSlotsDto } from '@availability/presentation/dtos/get-available-slots.dto';
import { GetAvailableDatesQuery } from '@availability/app/queries/get-available-dates/query';
import { GetAvailableSlotsQuery } from '@availability/app/queries/get-available-slots/query';

/**
 * Availability Query Controller
 *
 * Handles HTTP requests for availability queries
 */
@Controller('availability')
@UseGuards(JwtAuthGuard)
export class AvailabilityQueryController {
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * GET /api/availability/dates
   * Get available dates for an offering
   */
  @Get('dates')
  @HttpCode(HttpStatus.OK)
  async getAvailableDates(@Query() dto: GetAvailableDatesDto) {
    return this.queryBus.execute(
      new GetAvailableDatesQuery(
        dto.offeringId,
        dto.businessId,
        new Date(dto.startDate),
        new Date(dto.endDate),
      ),
    );
  }

  /**
   * GET /api/availability/slots
   * Get available time slots for a specific date
   */
  @Get('slots')
  @HttpCode(HttpStatus.OK)
  async getAvailableSlots(@Query() dto: GetAvailableSlotsDto) {
    return this.queryBus.execute(
      new GetAvailableSlotsQuery(
        dto.offeringId,
        dto.businessId,
        new Date(dto.date),
        dto.durationMinutes,
      ),
    );
  }
}
