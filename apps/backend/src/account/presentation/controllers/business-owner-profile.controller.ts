import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@auth/infra/guards/jwt-auth';
import { CurrentUser, UserPayload } from '@auth/presentation/decorators/current-user';
import { UpgradeSubscriptionDto } from '@account/presentation/dtos/upgrade-subscription.dto';
import { SubscriptionReadModel } from '@account/presentation/dtos/subscription-read.model';
import { BusinessOwnerReadModel } from '@account/domain/read_models/business-owner.read-model';
import { GetBusinessOwnerByUserIdQuery } from '@account/app/queries/get-business-owner-by-user-id';
import { UpgradeSubscriptionCommand } from '@account/app/commands/upgrade-subscription';
import { CompleteOnboardingCommand } from '@account/app/commands/complete-onboarding';

@Controller('account')
@UseGuards(JwtAuthGuard)
export class BusinessOwnerProfileController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: UserPayload): Promise<BusinessOwnerReadModel> {
    return this.queryBus.execute(new GetBusinessOwnerByUserIdQuery(user.userId));
  }

  @Get('subscription')
  async getSubscription(@CurrentUser() user: UserPayload): Promise<SubscriptionReadModel> {
    const owner = await this.queryBus.execute(new GetBusinessOwnerByUserIdQuery(user.userId));
    return {
      plan: owner.subscriptionPlan,
      status: owner.subscriptionStatus,
      maxBusinesses: owner.maxBusinesses,
      currentBusinessCount: 1, // TODO: Obtener del Business BC cuando esté implementado
      maxAppointmentsPerMonth: owner.maxAppointmentsPerMonth,
      price: owner.price,
    };
  }

  @Put('subscription/upgrade')
  async upgradeSubscription(
    @Body() dto: UpgradeSubscriptionDto,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    const owner = await this.queryBus.execute(new GetBusinessOwnerByUserIdQuery(user.userId));
    await this.commandBus.execute(new UpgradeSubscriptionCommand(owner.id, dto.newPlan));
  }

  @Post('onboarding/complete')
  async completeOnboarding(@CurrentUser() user: UserPayload): Promise<void> {
    const owner = await this.queryBus.execute(new GetBusinessOwnerByUserIdQuery(user.userId));
    await this.commandBus.execute(new CompleteOnboardingCommand(owner.id));
  }
}
