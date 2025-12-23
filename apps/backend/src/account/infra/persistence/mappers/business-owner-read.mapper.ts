import { BusinessOwnerReadModel } from '@account/domain/read_models/business-owner.read-model';
import { BusinessOwnerModel } from '@account/infra/persistence/models/business-owner.model';
import { SubscriptionPlan } from '@account/domain/vo/subscription-plan';

export class BusinessOwnerReadMapper {
  static toReadModel(model: BusinessOwnerModel): BusinessOwnerReadModel {
    // Reconstruct SubscriptionPlan to get limits
    const plan = SubscriptionPlan.fromString(model.subscriptionPlan);

    return {
      id: model.id,
      userId: model.userId,
      subscriptionPlan: model.subscriptionPlan,
      subscriptionStatus: model.subscriptionStatus,
      maxBusinesses: plan.getMaxBusinesses(),
      maxAppointmentsPerMonth: plan.getMaxAppointmentsPerMonth(),
      price: plan.getPrice(),
      onboardingCompleted: model.onboardingCompleted,
      version: model.version,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
