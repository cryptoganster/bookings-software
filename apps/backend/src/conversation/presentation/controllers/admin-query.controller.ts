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
import { GetPendingQueriesDto } from '@conversation/presentation/dtos/get-pending-queries.dto';
import { ConversationIdParamDto } from '@conversation/presentation/dtos/conversation-id-param.dto';
import { SendAdminResponseCommand } from '@conversation/app/commands/send-admin-response/command';
import { GetPendingAdminQueriesQuery } from '@conversation/app/queries/get-pending-admin-queries/query';
import { GetConversationQuery } from '@conversation/app/queries/get-conversation/query';
import { GetConversationHistoryQuery } from '@conversation/app/queries/get-conversation-history/query';

/**
 * Admin Query Controller
 *
 * Handles HTTP requests for admin query management and conversation history
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
  async getPending(@Query() query: GetPendingQueriesDto) {
    return this.queryBus.execute(new GetPendingAdminQueriesQuery(query.businessId));
  }

  /**
   * GET /api/admin-queries/:id
   * Get conversation by ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getConversation(@Param() params: ConversationIdParamDto) {
    return this.queryBus.execute(new GetConversationQuery(params.id));
  }

  /**
   * GET /api/admin-queries/:id/messages
   * Get conversation message history
   */
  @Get(':id/messages')
  @HttpCode(HttpStatus.OK)
  async getMessages(@Param() params: ConversationIdParamDto) {
    return this.queryBus.execute(new GetConversationHistoryQuery(params.id));
  }

  /**
   * POST /api/admin-queries/:id/respond
   * Respond to an admin query
   */
  @Post(':id/respond')
  @HttpCode(HttpStatus.OK)
  async respond(
    @Param() params: ConversationIdParamDto,
    @Body() dto: RespondToQueryDto,
  ): Promise<{ message: string }> {
    await this.commandBus.execute(new SendAdminResponseCommand(params.id, dto.content));

    return { message: 'Response sent successfully' };
  }
}
