import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * DTO for responding to an admin query
 */
export class RespondToQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000) // Max 1000 characters for admin responses
  content!: string;
}
