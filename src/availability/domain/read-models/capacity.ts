export class CapacityReadModel {
  id!: string;
  offeringId!: string;
  date!: Date;
  totalSlots!: number;
  availableSlots!: number;
  bookedSlots!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export interface TimeSlot {
  time: Date;
  availableSlots: number;
}
