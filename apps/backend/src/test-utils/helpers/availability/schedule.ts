/**
 * Availability BC - Schedule Test Helpers
 *
 * Provides Schedule configuration utilities for E2E and integration tests.
 * This file contains ONLY Availability BC - Schedule functionality.
 *
 * Schedule represents the business hours for a specific day of the week.
 * Each business can have one schedule per day of week (0-6, Sunday-Saturday).
 */

import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ScheduleModel } from '@availability/infra/persistence/models/schedule';
import { CreateScheduleDto } from '@test-utils/helpers/types';

/**
 * TestScheduleHelper - Helper for Schedule entity in E2E tests
 *
 * Provides methods to create and manage schedules for testing purposes.
 * Automatically tracks created entities for cleanup.
 *
 * @example
 * ```typescript
 * const scheduleHelper = new TestScheduleHelper(dataSource);
 * const schedule = await scheduleHelper.createSchedule({
 *   businessId: business.id,
 *   dayOfWeek: 1, // Monday
 *   startTime: '09:00:00',
 *   endTime: '17:00:00',
 * });
 * await scheduleHelper.cleanup(); // Removes all created schedules
 * ```
 */
export class TestScheduleHelper {
  private createdSchedules: string[] = [];

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Creates a schedule for testing
   *
   * @param dto - Schedule creation data
   * @returns Created schedule model
   *
   * @example
   * ```typescript
   * const schedule = await scheduleHelper.createSchedule({
   *   businessId: business.id,
   *   dayOfWeek: 1, // Monday
   *   startTime: '09:00:00',
   *   endTime: '17:00:00',
   * });
   * ```
   */
  async createSchedule(dto: CreateScheduleDto): Promise<ScheduleModel> {
    const repo = this.dataSource.getRepository(ScheduleModel);

    const schedule = repo.create({
      id: uuidv4(),
      businessId: dto.businessId,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    const saved = await repo.save(schedule);
    this.createdSchedules.push(saved.id);

    return saved;
  }

  /**
   * Cleans up all schedules created by this helper
   *
   * @example
   * ```typescript
   * afterEach(async () => {
   *   await scheduleHelper.cleanup();
   * });
   * ```
   */
  async cleanup(): Promise<void> {
    if (this.createdSchedules.length === 0) {
      return;
    }

    try {
      const repo = this.dataSource.getRepository(ScheduleModel);
      await repo.delete(this.createdSchedules);
      this.createdSchedules = [];
    } catch (error) {
      console.error('Failed to cleanup schedules:', error);
      // Don't throw - cleanup should be best-effort
    }
  }
}

/**
 * Creates a schedule directly in the database (for integration tests)
 *
 * This is a standalone function that doesn't track entities for cleanup.
 * Use TestScheduleHelper for E2E tests that need automatic cleanup.
 *
 * @param dataSource - TypeORM DataSource
 * @param dto - Schedule creation data
 * @returns Created schedule model
 *
 * @example
 * ```typescript
 * const schedule = await createScheduleInDb(dataSource, {
 *   businessId: 'business-uuid',
 *   dayOfWeek: 1, // Monday
 *   startTime: '09:00:00',
 *   endTime: '17:00:00',
 * });
 * ```
 */
export async function createScheduleInDb(
  dataSource: DataSource,
  dto: CreateScheduleDto,
): Promise<ScheduleModel> {
  const repo = dataSource.getRepository(ScheduleModel);

  const schedule = repo.create({
    id: uuidv4(),
    businessId: dto.businessId,
    dayOfWeek: dto.dayOfWeek,
    startTime: dto.startTime,
    endTime: dto.endTime,
    isActive: dto.isActive !== undefined ? dto.isActive : true,
  });

  return repo.save(schedule);
}
