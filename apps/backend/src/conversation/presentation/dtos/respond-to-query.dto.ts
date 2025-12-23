import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for responding to an admin query
 */
export class RespondToQueryDto {
  @IsString()
  @IsNotEmpty()
  message!: string;
}
