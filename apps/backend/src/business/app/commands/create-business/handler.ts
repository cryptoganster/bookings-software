import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateBusinessCommand } from '@business/app/commands/create-business/command';
import { IBusinessWriteRepository } from '@business/domain/interfaces/repositories/business-write';
import { IBusinessUniquenessChecker } from '@business/domain/interfaces/services/business-uniqueness-checker.interface';
import { IBusinessLimitChecker } from '@business/domain/interfaces/services/business-limit-checker.interface';
import { Business } from '@business/domain/aggregates/business';
import { UUID } from '@shared/vo/uuid';
import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';
import { Timezone } from '@business/domain/vo/timezone';
import { BusinessAddress } from '@business/domain/vo/business-address';
import { WhatsAppPhoneAlreadyExistsException } from '@shared/kernel/exceptions/whatsapp-phone-already-exists';
import { OnboardingNotCompletedException } from '@business/domain/exceptions/onboarding-not-completed';
import { MaxBusinessesExceededException } from '@business/domain/exceptions/max-businesses-exceeded';
import { GetBusinessOwnerByUserIdQuery } from '@account/app/queries/get-business-owner-by-user-id/query';
import { BusinessOwnerNotFoundException } from '@business/domain/exceptions/business-owner-not-found';

/**
 * CreateBusinessHandler
 *
 * Handles the creation of a new business.
 *
 * Validations:
 * 1. BusinessOwner exists and onboarding is completed (via Account BC)
 * 2. Business count < maxBusinesses from subscription plan (via BusinessLimitChecker)
 * 3. WhatsAppPhone is globally unique (via BusinessUniquenessChecker)
 *
 * Architecture:
 * - Uses Domain Services for validation (maintains CQRS strict separation)
 * - Only injects Write Repository for persistence
 * - No direct Read Repository injection (CQRS compliant)
 *
 * Requirements: 1.1-1.5, 2.1-2.5, 10.1, 11.1-11.5
 */
@CommandHandler(CreateBusinessCommand)
export class CreateBusinessHandler implements ICommandHandler<CreateBusinessCommand> {
  constructor(
    @Inject('IBusinessWriteRepository')
    private readonly writeRepository: IBusinessWriteRepository,
    @Inject('IBusinessUniquenessChecker')
    private readonly uniquenessChecker: IBusinessUniquenessChecker,
    @Inject('IBusinessLimitChecker')
    private readonly limitChecker: IBusinessLimitChecker,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: CreateBusinessCommand): Promise<{ businessId: string }> {
    // Validate BusinessOwner exists and onboarding is completed
    const businessOwner = await this.queryBus.execute(
      new GetBusinessOwnerByUserIdQuery(command.ownerId),
    );

    if (!businessOwner) {
      throw new BusinessOwnerNotFoundException(command.ownerId);
    }

    if (!businessOwner.onboardingCompleted) {
      throw new OnboardingNotCompletedException(command.ownerId);
    }

    // Validate business limit using domain service
    const canCreate = await this.limitChecker.canCreateBusiness(command.ownerId);

    if (!canCreate) {
      const [currentCount, maxAllowed] = await Promise.all([
        this.limitChecker.getBusinessCount(command.ownerId),
        this.limitChecker.getMaxBusinessesAllowed(command.ownerId),
      ]);

      throw new MaxBusinessesExceededException(command.ownerId, currentCount, maxAllowed);
    }

    // Validate WhatsAppPhone uniqueness using domain service
    const isUnique = await this.uniquenessChecker.isWhatsAppPhoneUnique(command.whatsappPhone);

    if (!isUnique) {
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
