import { DataSource } from 'typeorm';
import { CapacityModel } from '@availability/infra/persistence/models/capacity';
import { UUID } from '@shared/vo/uuid';

/**
 * Helper to create capacity for E2E tests
 * Creates capacity for tomorrow at midnight (00:00:00) with available slots
 * Note: Capacity is stored by date only (no time), so we use midnight
 */
export async function createCapacityForTomorrow(
  dataSource: DataSource,
  offeringId: string,
  availableSlots: number = 5,
  totalSlots: number = 10,
): Promise<CapacityModel> {
  // Create tomorrow's date at midnight UTC (capacity is stored by date only)
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0); // Midnight UTC

  const capacity = new CapacityModel();
  capacity.id = UUID.generate().getValue();
  capacity.offeringId = offeringId;
  capacity.date = tomorrow;
  capacity.totalSlots = totalSlots;
  capacity.availableSlots = availableSlots;
  capacity.version = 0;

  await dataSource.getRepository(CapacityModel).save(capacity);

  return capacity;
}

/**
 * Helper to create capacity for a specific date and time
 */
export async function createCapacityForDate(
  dataSource: DataSource,
  offeringId: string,
  date: Date,
  availableSlots: number = 5,
  totalSlots: number = 10,
): Promise<CapacityModel> {
  // Normalize date to midnight (capacity is stored by date only)
  const normalizedDate = new Date(date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  const capacity = new CapacityModel();
  capacity.id = UUID.generate().getValue();
  capacity.offeringId = offeringId;
  capacity.date = normalizedDate;
  capacity.totalSlots = totalSlots;
  capacity.availableSlots = availableSlots;
  capacity.version = 0;

  await dataSource.getRepository(CapacityModel).save(capacity);

  return capacity;
}
