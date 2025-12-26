import { Inject, Injectable } from '@nestjs/common';
import { IUserUniquenessChecker } from '@auth/domain/interfaces/services/user-uniqueness-checker.interface';
import { IUserReadRepository } from '@auth/domain/interfaces/repositories/user-read';

/**
 * Domain Service: UserUniquenessChecker
 *
 * Validates email uniqueness in the Auth BC.
 *
 * This service encapsulates read operations for validation purposes,
 * allowing command handlers to maintain CQRS strict separation by
 * not directly injecting read repositories.
 *
 * @implements {IUserUniquenessChecker}
 */
@Injectable()
export class UserUniquenessChecker implements IUserUniquenessChecker {
  constructor(
    @Inject('IUserReadRepository')
    private readonly readRepo: IUserReadRepository,
  ) {}

  /**
   * Checks if an email is unique in the system
   *
   * @param email - Email address to check
   * @returns true if email is unique, false if already exists
   */
  async isEmailUnique(email: string): Promise<boolean> {
    const existing = await this.readRepo.findByEmail(email);
    return !existing;
  }
}
