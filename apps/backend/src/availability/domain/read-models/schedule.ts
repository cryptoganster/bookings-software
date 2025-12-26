export class ScheduleReadModel {
  id!: string;
  businessId!: string;
  dayOfWeek!: number;
  startTime!: string;
  endTime!: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
