import { IsString, IsNotEmpty } from 'class-validator';

export class UpgradeSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  newPlan!: string;
}
