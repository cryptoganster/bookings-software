import { DomainException } from '@shared/kernel/exceptions/domain';

export class BlockoutNotFoundException extends DomainException {
  constructor(blockoutId: string) {
    super(`Blockout with id ${blockoutId} not found`);
  }
}
