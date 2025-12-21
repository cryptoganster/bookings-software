import { BusinessOwner } from '@account/domain/aggregates/business-owner';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';

export class BusinessOwnerWriteMapper {
  static toModel(aggregate: BusinessOwner): BusinessOwnerModel {
    const model = new BusinessOwnerModel();

    model.id = aggregate.getId().getValue();
    model.userId = aggregate.getUserId().getValue();
    model.subscriptionPlan = aggregate.getSubscriptionPlan().getName();
    model.subscriptionStatus = aggregate.getSubscriptionStatus().getValue();
    model.onboardingCompleted = aggregate.isOnboardingCompleted();
    model.version = aggregate.getVersion().getValue();
    model.createdAt = aggregate.getCreatedAt();

    return model;
  }
}
