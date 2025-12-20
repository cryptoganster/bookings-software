import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ description: 'Success message', example: 'Operation completed successfully' })
  message!: string;
}
