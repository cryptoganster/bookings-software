import { ApiProperty } from '@nestjs/swagger';
import { CustomerReadModel } from '@packages/shared-types';

class DuplicatePairDto {
  @ApiProperty({ type: Object, description: 'First customer in the pair' })
  customer1!: CustomerReadModel;

  @ApiProperty({ type: Object, description: 'Second customer in the pair' })
  customer2!: CustomerReadModel;

  @ApiProperty({ description: 'Similarity score (0-1)', example: 0.85 })
  similarityScore!: number;

  @ApiProperty({ type: [String], description: 'Reasons for similarity match' })
  reasons!: string[];
}

export class DuplicatePairsResponseDto {
  @ApiProperty({ type: [DuplicatePairDto], description: 'List of potential duplicate pairs' })
  pairs!: DuplicatePairDto[];
}
