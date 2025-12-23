import { describe, it, expect, beforeEach } from '@jest/globals';
import { ScheduleWriteMapper } from '../schedule-write.mapper';
import { ScheduleReadMapper } from '../schedule-read.mapper';
import { Schedule } from '@availability/domain/aggregates/schedule';
import { ScheduleModel } from '../../models/schedule';
import { UUID } from '@shared/vo/uuid';
import { TimeSlot } from '@availability/domain/vo/time-slot.vo';
import { DayOfWeek } from '@availability/domain/vo/day-of-week.vo';

describe('Schedule Mappers', () => {
  let schedule: Schedule;
  let scheduleModel: ScheduleModel;

  beforeEach(() => {
    // Create a test schedule aggregate
    schedule = Schedule.create(
      UUID.generate(),
      UUID.generate(),
      DayOfWeek.create(1), // Monday
      TimeSlot.create('09:00', '17:00'),
    );

    // Create a test schedule model with valid UUIDs
    scheduleModel = new ScheduleModel();
    scheduleModel.id = '550e8400-e29b-41d4-a716-446655440000';
    scheduleModel.businessId = '550e8400-e29b-41d4-a716-446655440001';
    scheduleModel.dayOfWeek = 1;
    scheduleModel.startTime = '09:00';
    scheduleModel.endTime = '17:00';
    scheduleModel.isActive = true;
    scheduleModel.createdAt = new Date('2024-01-01T00:00:00Z');
    scheduleModel.updatedAt = new Date('2024-01-01T00:00:00Z');
  });

  describe('ScheduleWriteMapper', () => {
    describe('toModel', () => {
      it('should map Schedule aggregate to ScheduleModel', () => {
        const model = ScheduleWriteMapper.toModel(schedule);

        expect(model.id).toBe(schedule.getId().getValue());
        expect(model.businessId).toBe(schedule.getBusinessId().getValue());
        expect(model.dayOfWeek).toBe(schedule.getDayOfWeek().getValue());
        expect(model.startTime).toBe(schedule.getTimeSlot().getStartTime());
        expect(model.endTime).toBe(schedule.getTimeSlot().getEndTime());
        expect(model.isActive).toBe(schedule.getIsActive());
      });

      it('should preserve all required fields', () => {
        const model = ScheduleWriteMapper.toModel(schedule);

        expect(model.id).toBeDefined();
        expect(model.businessId).toBeDefined();
        expect(model.dayOfWeek).toBeDefined();
        expect(model.startTime).toBeDefined();
        expect(model.endTime).toBeDefined();
        expect(model.isActive).toBeDefined();
      });
    });

    describe('toDomain', () => {
      it('should map ScheduleModel to Schedule aggregate', () => {
        const aggregate = ScheduleWriteMapper.toDomain(scheduleModel);

        expect(aggregate.getId().getValue()).toBe(scheduleModel.id);
        expect(aggregate.getBusinessId().getValue()).toBe(scheduleModel.businessId);
        expect(aggregate.getDayOfWeek().getValue()).toBe(scheduleModel.dayOfWeek);
        expect(aggregate.getTimeSlot().getStartTime()).toBe(scheduleModel.startTime);
        expect(aggregate.getTimeSlot().getEndTime()).toBe(scheduleModel.endTime);
        expect(aggregate.getIsActive()).toBe(scheduleModel.isActive);
      });

      it('should handle inactive schedules', () => {
        scheduleModel.isActive = false;

        const aggregate = ScheduleWriteMapper.toDomain(scheduleModel);

        expect(aggregate.getIsActive()).toBe(false);
      });
    });

    describe('round-trip conversion', () => {
      it('should preserve data through aggregate -> model -> aggregate', () => {
        const model = ScheduleWriteMapper.toModel(schedule);
        const reconstructed = ScheduleWriteMapper.toDomain(model);

        expect(reconstructed.getId().getValue()).toBe(schedule.getId().getValue());
        expect(reconstructed.getBusinessId().getValue()).toBe(schedule.getBusinessId().getValue());
        expect(reconstructed.getDayOfWeek().getValue()).toBe(schedule.getDayOfWeek().getValue());
        expect(reconstructed.getTimeSlot().getStartTime()).toBe(
          schedule.getTimeSlot().getStartTime(),
        );
        expect(reconstructed.getTimeSlot().getEndTime()).toBe(schedule.getTimeSlot().getEndTime());
        expect(reconstructed.getIsActive()).toBe(schedule.getIsActive());
      });

      it('should preserve data through model -> aggregate -> model', () => {
        const aggregate = ScheduleWriteMapper.toDomain(scheduleModel);
        const reconstructed = ScheduleWriteMapper.toModel(aggregate);

        expect(reconstructed.id).toBe(scheduleModel.id);
        expect(reconstructed.businessId).toBe(scheduleModel.businessId);
        expect(reconstructed.dayOfWeek).toBe(scheduleModel.dayOfWeek);
        expect(reconstructed.startTime).toBe(scheduleModel.startTime);
        expect(reconstructed.endTime).toBe(scheduleModel.endTime);
        expect(reconstructed.isActive).toBe(scheduleModel.isActive);
      });
    });
  });

  describe('ScheduleReadMapper', () => {
    describe('toReadModel', () => {
      it('should map ScheduleModel to ScheduleReadModel', () => {
        const readModel = ScheduleReadMapper.toReadModel(scheduleModel);

        expect(readModel.id).toBe(scheduleModel.id);
        expect(readModel.businessId).toBe(scheduleModel.businessId);
        expect(readModel.dayOfWeek).toBe(scheduleModel.dayOfWeek);
        expect(readModel.startTime).toBe(scheduleModel.startTime);
        expect(readModel.endTime).toBe(scheduleModel.endTime);
        expect(readModel.isActive).toBe(scheduleModel.isActive);
        expect(readModel.createdAt).toEqual(scheduleModel.createdAt);
        expect(readModel.updatedAt).toEqual(scheduleModel.updatedAt);
      });

      it('should include all read model fields', () => {
        const readModel = ScheduleReadMapper.toReadModel(scheduleModel);

        expect(readModel).toHaveProperty('id');
        expect(readModel).toHaveProperty('businessId');
        expect(readModel).toHaveProperty('dayOfWeek');
        expect(readModel).toHaveProperty('startTime');
        expect(readModel).toHaveProperty('endTime');
        expect(readModel).toHaveProperty('isActive');
        expect(readModel).toHaveProperty('createdAt');
        expect(readModel).toHaveProperty('updatedAt');
      });

      it('should handle inactive schedules', () => {
        scheduleModel.isActive = false;

        const readModel = ScheduleReadMapper.toReadModel(scheduleModel);

        expect(readModel.isActive).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle different days of week', () => {
        const days = [0, 1, 2, 3, 4, 5, 6];

        days.forEach((day) => {
          scheduleModel.dayOfWeek = day;
          const readModel = ScheduleReadMapper.toReadModel(scheduleModel);
          expect(readModel.dayOfWeek).toBe(day);
        });
      });

      it('should handle different time ranges', () => {
        const timeRanges = [
          { start: '00:00', end: '23:59' },
          { start: '09:00', end: '17:00' },
          { start: '18:00', end: '22:00' },
        ];

        timeRanges.forEach(({ start, end }) => {
          scheduleModel.startTime = start;
          scheduleModel.endTime = end;
          const readModel = ScheduleReadMapper.toReadModel(scheduleModel);
          expect(readModel.startTime).toBe(start);
          expect(readModel.endTime).toBe(end);
        });
      });
    });
  });
});
