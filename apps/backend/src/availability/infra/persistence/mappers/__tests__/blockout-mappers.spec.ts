import { describe, it, expect, beforeEach } from '@jest/globals';
import { BlockoutWriteMapper } from '../blockout-write.mapper';
import { BlockoutReadMapper } from '../blockout-read.mapper';
import { Blockout } from '@availability/domain/aggregates/blockout';
import { BlockoutModel } from '../../models/blockout';
import { UUID } from '@shared/vo/uuid';
import { DateRange } from '@availability/domain/vo/date-range.vo';

describe('Blockout Mappers', () => {
  let blockout: Blockout;
  let blockoutModel: BlockoutModel;

  beforeEach(() => {
    // Create a test blockout aggregate with future dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 30); // 30 days from now
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1); // 1 day after start

    blockout = Blockout.create(
      UUID.generate(),
      UUID.generate(),
      DateRange.create(startDate, endDate),
      'Christmas Holiday',
    );

    // Create a test blockout model with valid UUIDs and future dates
    blockoutModel = new BlockoutModel();
    blockoutModel.id = '550e8400-e29b-41d4-a716-446655440000';
    blockoutModel.businessId = '550e8400-e29b-41d4-a716-446655440001';
    blockoutModel.startDate = new Date(startDate);
    blockoutModel.endDate = new Date(endDate);
    blockoutModel.reason = 'Christmas Holiday';
    blockoutModel.createdAt = new Date('2024-01-01T00:00:00Z');
  });

  describe('BlockoutWriteMapper', () => {
    describe('toModel', () => {
      it('should map Blockout aggregate to BlockoutModel', () => {
        const model = BlockoutWriteMapper.toModel(blockout);

        expect(model.id).toBe(blockout.getId().getValue());
        expect(model.businessId).toBe(blockout.getBusinessId().getValue());
        expect(model.startDate).toEqual(blockout.getDateRange().getStartDate());
        expect(model.endDate).toEqual(blockout.getDateRange().getEndDate());
        expect(model.reason).toBe(blockout.getReason());
      });

      it('should preserve all required fields', () => {
        const model = BlockoutWriteMapper.toModel(blockout);

        expect(model.id).toBeDefined();
        expect(model.businessId).toBeDefined();
        expect(model.startDate).toBeDefined();
        expect(model.endDate).toBeDefined();
        expect(model.reason).toBeDefined();
      });

      it('should handle different date ranges', () => {
        const today = new Date();
        const testCases = [
          {
            start: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // tomorrow
            end: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // same day
          },
          {
            start: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            end: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          },
          {
            start: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
            end: new Date(today.getTime() + 97 * 24 * 60 * 60 * 1000), // 97 days from now
          },
        ];

        testCases.forEach(({ start, end }) => {
          const testBlockout = Blockout.create(
            UUID.generate(),
            UUID.generate(),
            DateRange.create(start, end),
            'Test Blockout',
          );

          const model = BlockoutWriteMapper.toModel(testBlockout);

          expect(model.startDate).toEqual(start);
          expect(model.endDate).toEqual(end);
        });
      });
    });

    describe('toDomain', () => {
      it('should map BlockoutModel to Blockout aggregate', () => {
        const aggregate = BlockoutWriteMapper.toDomain(blockoutModel);

        expect(aggregate.getId().getValue()).toBe(blockoutModel.id);
        expect(aggregate.getBusinessId().getValue()).toBe(blockoutModel.businessId);
        expect(aggregate.getDateRange().getStartDate()).toEqual(blockoutModel.startDate);
        expect(aggregate.getDateRange().getEndDate()).toEqual(blockoutModel.endDate);
        expect(aggregate.getReason()).toBe(blockoutModel.reason);
      });

      it('should handle different reasons', () => {
        const reasons = ['Christmas Holiday', 'Vacation', 'Maintenance', 'Special Event'];

        reasons.forEach((reason) => {
          blockoutModel.reason = reason;
          const aggregate = BlockoutWriteMapper.toDomain(blockoutModel);
          expect(aggregate.getReason()).toBe(reason);
        });
      });
    });

    describe('round-trip conversion', () => {
      it('should preserve data through aggregate -> model -> aggregate', () => {
        const model = BlockoutWriteMapper.toModel(blockout);
        const reconstructed = BlockoutWriteMapper.toDomain(model);

        expect(reconstructed.getId().getValue()).toBe(blockout.getId().getValue());
        expect(reconstructed.getBusinessId().getValue()).toBe(blockout.getBusinessId().getValue());
        expect(reconstructed.getDateRange().getStartDate()).toEqual(
          blockout.getDateRange().getStartDate(),
        );
        expect(reconstructed.getDateRange().getEndDate()).toEqual(
          blockout.getDateRange().getEndDate(),
        );
        expect(reconstructed.getReason()).toBe(blockout.getReason());
      });

      it('should preserve data through model -> aggregate -> model', () => {
        const aggregate = BlockoutWriteMapper.toDomain(blockoutModel);
        const reconstructed = BlockoutWriteMapper.toModel(aggregate);

        expect(reconstructed.id).toBe(blockoutModel.id);
        expect(reconstructed.businessId).toBe(blockoutModel.businessId);
        expect(reconstructed.startDate).toEqual(blockoutModel.startDate);
        expect(reconstructed.endDate).toEqual(blockoutModel.endDate);
        expect(reconstructed.reason).toBe(blockoutModel.reason);
      });

      it('should preserve date precision', () => {
        const model = BlockoutWriteMapper.toModel(blockout);
        const reconstructed = BlockoutWriteMapper.toDomain(model);
        const finalModel = BlockoutWriteMapper.toModel(reconstructed);

        expect(finalModel.startDate.getTime()).toBe(model.startDate.getTime());
        expect(finalModel.endDate.getTime()).toBe(model.endDate.getTime());
      });
    });
  });

  describe('BlockoutReadMapper', () => {
    describe('toReadModel', () => {
      it('should map BlockoutModel to BlockoutReadModel', () => {
        const readModel = BlockoutReadMapper.toReadModel(blockoutModel);

        expect(readModel.id).toBe(blockoutModel.id);
        expect(readModel.businessId).toBe(blockoutModel.businessId);
        expect(readModel.startDate).toEqual(blockoutModel.startDate);
        expect(readModel.endDate).toEqual(blockoutModel.endDate);
        expect(readModel.reason).toBe(blockoutModel.reason);
        expect(readModel.createdAt).toEqual(blockoutModel.createdAt);
      });

      it('should include all read model fields', () => {
        const readModel = BlockoutReadMapper.toReadModel(blockoutModel);

        expect(readModel).toHaveProperty('id');
        expect(readModel).toHaveProperty('businessId');
        expect(readModel).toHaveProperty('startDate');
        expect(readModel).toHaveProperty('endDate');
        expect(readModel).toHaveProperty('reason');
        expect(readModel).toHaveProperty('createdAt');
      });

      it('should handle different date ranges', () => {
        const today = new Date();
        const testCases = [
          {
            start: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // tomorrow
            end: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // same day
          },
          {
            start: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            end: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          },
        ];

        testCases.forEach(({ start, end }) => {
          blockoutModel.startDate = start;
          blockoutModel.endDate = end;

          const readModel = BlockoutReadMapper.toReadModel(blockoutModel);

          expect(readModel.startDate).toEqual(start);
          expect(readModel.endDate).toEqual(end);
        });
      });
    });

    describe('edge cases', () => {
      it('should handle single-day blockouts', () => {
        const today = new Date();
        const singleDay = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        blockoutModel.startDate = singleDay;
        blockoutModel.endDate = singleDay;

        const readModel = BlockoutReadMapper.toReadModel(blockoutModel);

        expect(readModel.startDate).toEqual(singleDay);
        expect(readModel.endDate).toEqual(singleDay);
      });

      it('should handle multi-day blockouts', () => {
        const today = new Date();
        const start = new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000); // 20 days from now
        const end = new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000); // 31 days from now
        blockoutModel.startDate = start;
        blockoutModel.endDate = end;

        const readModel = BlockoutReadMapper.toReadModel(blockoutModel);

        expect(readModel.startDate).toEqual(start);
        expect(readModel.endDate).toEqual(end);
      });

      it('should handle empty reason', () => {
        blockoutModel.reason = '';

        const readModel = BlockoutReadMapper.toReadModel(blockoutModel);

        expect(readModel.reason).toBe('');
      });

      it('should handle long reason text', () => {
        blockoutModel.reason = 'A'.repeat(500);

        const readModel = BlockoutReadMapper.toReadModel(blockoutModel);

        expect(readModel.reason).toBe('A'.repeat(500));
      });
    });
  });
});
