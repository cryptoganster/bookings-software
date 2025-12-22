import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@auth/infra/guards/jwt-auth';
import { CurrentUser, UserPayload } from '@auth/presentation/decorators/current-user';
import { CreateBusinessDto } from '@business/presentation/dtos/create-business.dto';
import { UpdateBusinessInfoDto } from '@business/presentation/dtos/update-business-info.dto';
import { ConfigureWhatsAppDto } from '@business/presentation/dtos/configure-whatsapp.dto';
import { CreateBusinessCommand } from '@business/app/commands/create-business/command';
import { UpdateBusinessInfoCommand } from '@business/app/commands/update-business-info/command';
import { ConfigureWhatsAppCommand } from '@business/app/commands/configure-whatsapp/command';
import { DeactivateBusinessCommand } from '@business/app/commands/deactivate-business/command';
import { ActivateBusinessCommand } from '@business/app/commands/activate-business/command';
import { GetBusinessQuery } from '@business/app/queries/get-business/query';
import { GetBusinessesByOwnerIdQuery } from '@business/app/queries/get-businesses-by-owner-id/query';

/**
 * Business Controller
 *
 * Handles HTTP requests for business management
 */
@Controller('businesses')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * POST /api/businesses
   * Create a new business
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateBusinessDto,
    @CurrentUser() user: UserPayload,
  ): Promise<{ id: string }> {
    const result = await this.commandBus.execute(
      new CreateBusinessCommand(
        user.userId,
        dto.name,
        dto.whatsappNumber,
        {
          street: dto.address.street,
          city: dto.address.city,
          state: dto.address.state || null,
          country: dto.address.country,
          postalCode: dto.address.postalCode || null,
        },
        dto.timezone,
      ),
    );

    return { id: result.businessId };
  }

  /**
   * GET /api/businesses/:id
   * Get business by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.queryBus.execute(new GetBusinessQuery(id));
  }

  /**
   * GET /api/businesses
   * Get businesses by owner (current user)
   */
  @Get()
  async findByOwner(@CurrentUser() user: UserPayload) {
    return this.queryBus.execute(new GetBusinessesByOwnerIdQuery(user.userId));
  }

  /**
   * PUT /api/businesses/:id
   * Update business information
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessInfoDto,
  ): Promise<{ message: string }> {
    await this.commandBus.execute(
      new UpdateBusinessInfoCommand(
        id,
        dto.name,
        {
          street: dto.address.street,
          city: dto.address.city,
          state: dto.address.state || null,
          country: dto.address.country,
          postalCode: dto.address.postalCode || null,
        },
        dto.timezone,
      ),
    );

    return { message: 'Business updated successfully' };
  }

  /**
   * PUT /api/businesses/:id/whatsapp
   * Configure WhatsApp number
   */
  @Put(':id/whatsapp')
  @HttpCode(HttpStatus.OK)
  async configureWhatsApp(
    @Param('id') id: string,
    @Body() dto: ConfigureWhatsAppDto,
  ): Promise<{ message: string }> {
    await this.commandBus.execute(new ConfigureWhatsAppCommand(id, dto.whatsappNumber));

    return { message: 'WhatsApp configured successfully' };
  }

  /**
   * DELETE /api/businesses/:id
   * Deactivate business
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id') id: string): Promise<{ message: string }> {
    await this.commandBus.execute(new DeactivateBusinessCommand(id));

    return { message: 'Business deactivated successfully' };
  }

  /**
   * POST /api/businesses/:id/activate
   * Activate business
   */
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id') id: string): Promise<{ message: string }> {
    await this.commandBus.execute(new ActivateBusinessCommand(id));

    return { message: 'Business activated successfully' };
  }
}
