import { ApiProperty } from '@nestjs/swagger';

class TopCustomerDto {
  @ApiProperty({ description: 'Customer ID' })
  id!: string;

  @ApiProperty({ description: 'Customer name' })
  name!: string;

  @ApiProperty({ description: 'Total appointment count' })
  appointmentCount!: number;
}

export class CustomerStatsResponseDto {
  @ApiProperty({ description: 'Total number of customers' })
  totalCustomers!: number;

  @ApiProperty({ description: 'Number of anonymous customers' })
  anonymousCount!: number;

  @ApiProperty({ description: 'Number of registered customers' })
  registeredCount!: number;

  @ApiProperty({ description: 'New customers this week' })
  newThisWeek!: number;

  @ApiProperty({ description: 'New customers this month' })
  newThisMonth!: number;

  @ApiProperty({ type: [TopCustomerDto], description: 'Top customers by appointment count' })
  topCustomers!: TopCustomerDto[];
}
