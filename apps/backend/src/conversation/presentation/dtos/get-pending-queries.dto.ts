import { IsUUID, IsNotEmpty } from 'class-validator';

/**
 * DTO for getting pending admin queries
 */
export class GetPendingQueriesDto {
  @IsUUID()
  @IsNotEmpty()
  businessId!: string;
}
