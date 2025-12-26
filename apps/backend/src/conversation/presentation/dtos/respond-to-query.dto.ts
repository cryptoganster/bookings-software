import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * DTO for responding to an admin query
 */
export class RespondToQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000) // Allow up to 5000 characters for admin responses
  message!: string;
}
