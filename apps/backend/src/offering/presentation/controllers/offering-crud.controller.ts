import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@auth/infra/guards/jwt-auth';
import { CurrentUser, UserPayload } from '@auth/presentation/decorators/current-user';
import { CreateOfferingDto } from '@offering/presentation/dtos/create-offering.dto';
import { UpdateOfferingDto } from '@offering/presentation/dtos/update-offering.dto';
import { ToggleActiveDto } from '@offering/presentation/dtos/toggle-active.dto';
import { CreateOfferingCommand } from '@offering/app/commands/create-offering/command';
import { UpdateOfferingCommand } from '@offering/app/commands/update-offering/command';
import { DeactivateOfferingCommand } from '@offering/app/commands/deactivate-offering/command';
import { ActivateOfferingCommand } from '@offering/app/commands/activate-offering/command';
import { GetOfferingsByBusinessQuery } from '@offering/app/queries/get-offerings-by-business/query';
import { GetActiveOfferingsQuery } from '@offering/app/queries/get-active-offerings/query';
import { GetOfferingByIdQuery } from '@offering/app/queries/get-offering-by-id/query';
import { OfferingReadModel } from '@offering/domain/read-models/offering';

@Controller('offerings')
@UseGuards(JwtAuthGuard)
export class OfferingCrudController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * GET /api/offerings
   * Get all offerings for current business (active and inactive)
   */
  @Get()
  async findAll(@CurrentUser() user: UserPayload): Promise<OfferingReadModel[]> {
    if (!user.businessId) {
      throw new Error('User does not have a business');
    }
    return this.queryBus.execute(new GetOfferingsByBusinessQuery(user.businessId));
  }

  /**
   * GET /api/offerings/active
   * Get only active offerings for current business
   */
  @Get('active')
  async findActive(@CurrentUser() user: UserPayload): Promise<OfferingReadModel[]> {
    if (!user.businessId) {
      throw new Error('User does not have a business');
    }
    return this.queryBus.execute(new GetActiveOfferingsQuery(user.businessId));
  }

  /**
   * GET /api/offerings/:id
   * Get offering by ID
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<OfferingReadModel> {
    if (!user.businessId) {
      throw new Error('User does not have a business');
    }

    const offering = await this.queryBus.execute(new GetOfferingByIdQuery(id, user.businessId));

    if (!offering) {
      throw new NotFoundException(`Offering with id ${id} not found`);
    }

    return offering;
  }

  /**
   * POST /api/offerings
   * Create new offering
   */
  @Post()
  async create(
    @Body() dto: CreateOfferingDto,
    @CurrentUser() user: UserPayload,
  ): Promise<{ offeringId: string }> {
    if (!user.businessId) {
      throw new Error('User does not have a business');
    }

    return this.commandBus.execute(
      new CreateOfferingCommand(
        user.businessId,
        dto.name,
        dto.duration, // Changed from dto.durationMinutes
        dto.maxCapacityPerSlot,
        dto.maxDailyCapacity ?? null,
      ),
    );
  }

  /**
   * PUT /api/offerings/:id
   * Update offering
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOfferingDto,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    if (!user.businessId) {
      throw new Error('User does not have a business');
    }

    await this.commandBus.execute(
      new UpdateOfferingCommand(
        id,
        user.businessId,
        dto.name,
        dto.duration, // Changed from dto.durationMinutes
        dto.maxCapacityPerSlot,
        dto.maxDailyCapacity ?? null,
      ),
    );
  }

  /**
   * DELETE /api/offerings/:id
   * Deactivate offering (soft delete)
   */
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: UserPayload): Promise<void> {
    if (!user.businessId) {
      throw new Error('User does not have a business');
    }

    await this.commandBus.execute(new DeactivateOfferingCommand(id, user.businessId));
  }

  /**
   * PATCH /api/offerings/:id/active
   * Toggle offering active status
   */
  @Patch(':id/active')
  async toggleActive(
    @Param('id') id: string,
    @Body() dto: ToggleActiveDto,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    if (!user.businessId) {
      throw new Error('User does not have a business');
    }

    if (dto.isActive) {
      await this.commandBus.execute(new ActivateOfferingCommand(id, user.businessId));
    } else {
      await this.commandBus.execute(new DeactivateOfferingCommand(id, user.businessId));
    }
  }
}
