export class CustomerStatsResponseDto {
  totalCustomers!: number;
  anonymousCount!: number;
  registeredCount!: number;
  newThisWeek!: number;
  newThisMonth!: number;
  topCustomers!: Array<{
    id: string;
    name: string;
    appointmentCount: number;
  }>;
}
