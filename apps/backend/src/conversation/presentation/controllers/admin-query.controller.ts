import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@auth/infra/guards/jwt-auth';
import { RespondToQueryDto } from '@conversation/presentation/dtos/respond-to-query.dto';
import { SendAdminResponseCommand } from '@conversation/app/commands/send-admin-response/command';
import { GetPendingAdminQueriesQuery } from '@conversation/app/queries/get-pending-admin-queries/query';
import { GetConversationQuery } from '@conversation/app/queries/get-conversation/query';

/**
 * Admin Query Controller
 *
 * Handles HTTP requests for admin query management
 */
@Controller('admin-queries')
@UseGuards(JwtAuthGuard)
export class AdminQueryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * GET /api/admin-queries/pending
   * Get pending admin queries
   */
  @Get('pending')
  @HttpCode(HttpStatus.OK)
  async getPending(@Query('businessId') businessId: string) {
    return this.queryBus.execute(new GetPendingAdminQueriesQuery(businessId));
  }

  /**
   * GET /api/admin-queries/:id
   * Get conversation by ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getConversation(@Param('id') id: string) {
    return this.queryBus.execute(new GetConversationQuery(id));
  }

  /**
   * POST /api/admin-queries/:id/respond
   * Respond to an admin query
   */
  @Post(':id/respond')
  @HttpCode(HttpStatus.OK)
  async respond(
    @Param('id') conversationId: string,
    @Body() dto: RespondToQueryDto,
  ): Promise<{ message: string }> {
    await this.commandBus.execute(new SendAdminResponseCommand(conversationId, dto.message));

    return { message: 'Response sent successfully' };
  }
}
