import {
  Controller,
  Post,
  Get,
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
import { CreateBlockoutDto } from '@availability/presentation/dtos/create-blockout.dto';
import { CreateBlockoutCommand } from '@availability/app/commands/create-blockout/command';
import { RemoveBlockoutCommand } from '@availability/app/commands/remove-blockout/command';
import { GetBlockoutsByBusinessQuery } from '@availability/app/queries/get-blockouts-by-business/query';

/**
 * Blockout CRUD Controller
 *
 * Handles HTTP requests for blockout management
 */
@Controller('blockouts')
@UseGuards(JwtAuthGuard)
export class BlockoutCrudController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * POST /api/blockouts
   * Create a new blockout
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateBlockoutDto): Promise<{ id: string }> {
    const result = await this.commandBus.execute(
      new CreateBlockoutCommand(
        dto.businessId,
        new Date(dto.startDate),
        new Date(dto.endDate),
        dto.reason || null,
      ),
    );

    return { id: result.blockoutId };
  }

  /**
   * GET /api/blockouts
   * Get blockouts by business ID
   */
  @Get()
  async findByBusiness(@Query('businessId') businessId: string) {
    return this.queryBus.execute(new GetBlockoutsByBusinessQuery(businessId));
  }

  /**
   * DELETE /api/blockouts/:id
   * Delete a blockout
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.commandBus.execute(new RemoveBlockoutCommand(id));

    return { message: 'Blockout deleted successfully' };
  }
}
