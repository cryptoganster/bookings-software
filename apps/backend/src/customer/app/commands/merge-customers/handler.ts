import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MergeCustomersCommand } from '@customer/app/commands/merge-customers/command';
import { ICustomerFactory } from '@customer/domain/interfaces/factories';
import { ICustomerWriteRepository } from '@customer/domain/interfaces/repositories';
import { CustomerModel } from '@customer/infra/persistence/models';
import { CustomersMerged } from '@customer/domain/events';
import { CustomerNotFoundException } from '@customer/domain/exceptions';
import { CannotMergeCustomerWithItselfException } from '@customer/domain/exceptions';
import { CustomersFromDifferentBusinessesException } from '@customer/domain/exceptions';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

/**
 * MergeCustomersHandler
 *
 * Merges two customer records into one, consolidating all related data.
 *
 * Flow:
 * 1. Load both customers using Factory (with business logic and version)
 * 2. Validate:
 *    - Both customers exist
 *    - Source !== Target
 *    - Both belong to same business
 * 3. Within transaction:
 *    a. Update all appointments: sourceCustomerId → targetCustomerId
 *    b. Update all conversations: sourceCustomerId → targetCustomerId (TODO: when implemented)
 *    c. Mark source customer as merged (soft delete with merged_into field)
 * 4. Publish CustomersMerged event
 *
 * Uses:
 * - Factory Pattern: Load aggregates for modification
 * - Optimistic Locking: Prevent concurrent modifications
 * - Transaction: Ensure atomicity
 * - Retry Logic: Handle concurrency exceptions (max 3 attempts)
 *
 * @see .kiro/specs/customer-bc-enhancements/requirements.md - Requirement 5
 * @see .kiro/specs/customer-bc-enhancements/design.md - Section 2.1
 * @see .kiro/steering/factory-pattern.md
 * @see .kiro/steering/PRD.md - Section 3.2 (Optimistic Locking)
 */
@CommandHandler(MergeCustomersCommand)
export class MergeCustomersHandler implements ICommandHandler<MergeCustomersCommand> {
  constructor(
    @Inject('ICustomerFactory')
    private readonly factory: ICustomerFactory,
    @Inject('ICustomerWriteRepository')
    private readonly writeRepo: ICustomerWriteRepository,
    @InjectRepository(CustomerModel)
    private readonly customerRepository: Repository<CustomerModel>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: MergeCustomersCommand): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.executeMerge(command);
        return; // Success
      } catch (error) {
        if (error instanceof ConcurrencyException) {
          attempt++;
          if (attempt >= maxRetries) {
            throw new Error(
              'Unable to merge customers after multiple attempts due to concurrent modifications. Please try again.',
            );
          }
          // Exponential backoff: 100ms, 200ms, 400ms
          await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        } else {
          // Other errors propagate immediately
          throw error;
        }
      }
    }
  }

  private async executeMerge(command: MergeCustomersCommand): Promise<void> {
    // 1. Validate source !== target
    if (command.sourceCustomerId === command.targetCustomerId) {
      throw new CannotMergeCustomerWithItselfException(command.sourceCustomerId);
    }

    // 2. Load both customers using Factory (with business logic and version)
    const sourceCustomer = await this.factory.loadById(command.sourceCustomerId);
    if (!sourceCustomer) {
      throw new CustomerNotFoundException(command.sourceCustomerId);
    }

    const targetCustomer = await this.factory.loadById(command.targetCustomerId);
    if (!targetCustomer) {
      throw new CustomerNotFoundException(command.targetCustomerId);
    }

    // 3. Validate both belong to same business
    if (sourceCustomer.getBusinessId().getValue() !== targetCustomer.getBusinessId().getValue()) {
      throw new CustomersFromDifferentBusinessesException(
        command.sourceCustomerId,
        command.targetCustomerId,
      );
    }

    // 4. Execute merge within transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 4a. Update all appointments: sourceCustomerId → targetCustomerId
      await queryRunner.manager.query(
        `
        UPDATE appointments
        SET customer_id = $1
        WHERE customer_id = $2
      `,
        [command.targetCustomerId, command.sourceCustomerId],
      );

      // 4b. Update all conversations: sourceCustomerId → targetCustomerId
      // TODO: Implement when Conversation BC has persistence layer
      // await queryRunner.manager.query(
      //   `
      //   UPDATE conversations
      //   SET customer_id = $1
      //   WHERE customer_id = $2
      // `,
      //   [command.targetCustomerId, command.sourceCustomerId],
      // );

      // 4c. Mark source customer as merged (soft delete)
      // Use optimistic locking: update only if version matches
      const currentVersion = sourceCustomer.getVersion().getValue();
      const result = await queryRunner.manager
        .createQueryBuilder()
        .update(CustomerModel)
        .set({
          merged_into: command.targetCustomerId,
          updated_at: new Date(),
          version: currentVersion + 1,
        })
        .where('id = :id', { id: command.sourceCustomerId })
        .andWhere('version = :version', { version: currentVersion })
        .execute();

      if (result.affected === 0) {
        throw new ConcurrencyException(
          `Customer ${command.sourceCustomerId} was modified by another transaction`,
        );
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      // 5. Publish event (after successful commit)
      sourceCustomer.apply(
        new CustomersMerged(command.sourceCustomerId, command.targetCustomerId, command.mergedBy),
      );
      sourceCustomer.commit(); // Publish events to EventBus
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }
}
