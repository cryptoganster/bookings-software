import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBusinessOwnerFactory } from '@account/domain/interfaces/factories/business-owner-factory.interface';
import { BusinessOwner } from '@account/domain/aggregates/business-owner';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { UUID } from '@shared/vo/uuid';
import { SubscriptionPlan } from '@account/domain/vo/subscription-plan';
import { SubscriptionStatus } from '@account/domain/vo/subscription-status';

@Injectable()
export class BusinessOwnerFactory implements IBusinessOwnerFactory {
  constructor(
    @InjectRepository(BusinessOwnerModel)
    private readonly repository: Repository<BusinessOwnerModel>,
  ) {}

  async loadById(id: string): Promise<BusinessOwner | null> {
    const model = await this.repository.findOne({ where: { id } });

    if (!model) {
      return null;
    }

    return this.reconstruct(model);
  }

  async loadByUserId(userId: string): Promise<BusinessOwner | null> {
    const model = await this.repository.findOne({ where: { userId } });

    if (!model) {
      return null;
    }

    return this.reconstruct(model);
  }

  private reconstruct(model: BusinessOwnerModel): BusinessOwner {
    return BusinessOwner.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.userId),
      SubscriptionPlan.fromString(model.subscriptionPlan),
      SubscriptionStatus.fromString(model.subscriptionStatus),
      model.onboardingCompleted,
      model.createdAt,
      model.version,
    );
  }
}
