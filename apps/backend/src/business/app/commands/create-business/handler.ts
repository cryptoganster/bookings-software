import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateBusinessCommand } from '@business/app/commands/create-business/command';
import { IBusinessWriteRepository } from '@business/domain/interfaces/repositories/business-write';
import { IBusinessReadRepository } from '@business/domain/interfaces/repositories/business-read';
import { Business } from '@business/domain/aggregates/business';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';
import { Timezone } from '@business/domain/vo/timezone';
import { BusinessAddress } from '@business/domain/vo/business-address';
import { WhatsAppPhoneAlreadyExistsException } from '@shared/kernel/exceptions/whatsapp-phone-already-exists';
// import { OnboardingNotCompletedException } from '@business/domain/exceptions/onboarding-not-completed';
// import { MaxBusinessesExceededException } from '@business/domain/exceptions/max-businesses-exceeded';

/**
 * CreateBusinessHandler
 *
 * Handles the creation of a new business.
 *
 * Validations:
 * 1. BusinessOwner exists and onboarding is completed (via Account BC)
 * 2. Business count < maxBusinesses from subscription plan
 * 3. WhatsAppPhone is globally unique
 *
 * Requirements: 1.1-1.5, 2.1-2.5, 10.1, 11.1-11.5
 */
@CommandHandler(CreateBusinessCommand)
export class CreateBusinessHandler implements ICommandHandler<CreateBusinessCommand> {
  constructor(
    @Inject('IBusinessWriteRepository')
    private readonly writeRepository: IBusinessWriteRepository,
    @Inject('IBusinessReadRepository')
    private readonly readRepository: IBusinessReadRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: CreateBusinessCommand): Promise<{ businessId: string }> {
    // TODO: Validate BusinessOwner when Account BC is implemented
    // const businessOwner = await this.queryBus.execute(
    //   new GetBusinessOwnerByUserIdQuery(command.ownerId),
    // );
    //
    // if (!businessOwner) {
    //   throw new BusinessOwnerNotFoundException(command.ownerId);
    // }
    //
    // if (!businessOwner.onboardingCompleted) {
    //   throw new OnboardingNotCompletedException(command.ownerId);
    // }
    //
    // // Validate business count < maxBusinesses
    // const existingBusinesses = await this.readRepository.findByOwnerId(
    //   command.ownerId,
    // );
    //
    // if (existingBusinesses.length >= businessOwner.subscriptionPlan.maxBusinesses) {
    //   throw new MaxBusinessesExceededException(
    //     command.ownerId,
    //     businessOwner.subscriptionPlan.maxBusinesses,
    //   );
    // }

    // Validate WhatsAppPhone uniqueness
    const existingBusiness = await this.readRepository.findByWhatsAppPhone(command.whatsappPhone);

    if (existingBusiness) {
      throw new WhatsAppPhoneAlreadyExistsException(command.whatsappPhone);
    }

    // Create Business aggregate
    const businessId = UUID.generate();
    const ownerId = UUID.fromString(command.ownerId);
    const whatsappPhone = WhatsAppPhone.fromString(command.whatsappPhone);
    const address = BusinessAddress.create(
      command.address.street,
      command.address.city,
      command.address.state,
      command.address.country,
      command.address.postalCode,
    );
    const timezone = Timezone.create(command.timezone);

    const business = Business.create(
      businessId,
      ownerId,
      command.name,
      whatsappPhone,
      address,
      timezone,
    );

    // Persist
    await this.writeRepository.save(business);

    return { businessId: businessId.getValue() };
  }
}
