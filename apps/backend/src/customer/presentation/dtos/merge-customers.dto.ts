import 'reflect-metadata';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class MergeCustomersDto {
  @IsUUID()
  @IsNotEmpty()
  sourceCustomerId!: string;

  @IsUUID()
  @IsNotEmpty()
  targetCustomerId!: string;
}
