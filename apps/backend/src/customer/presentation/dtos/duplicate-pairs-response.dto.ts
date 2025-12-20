import { CustomerReadModel } from '@packages/shared-types';

export class DuplicatePairsResponseDto {
  pairs!: Array<{
    customer1: CustomerReadModel;
    customer2: CustomerReadModel;
    similarityScore: number;
    reasons: string[];
  }>;
}
