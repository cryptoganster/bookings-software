import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppointmentFilters } from '../useAppointmentFilters';

describe('useAppointmentFilters', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useAppointmentFilters());
    act(() => {
      result.current.reset();
    });
  });

  it('should initialize with null values', () => {
    const { result } = renderHook(() => useAppointmentFilters());

    expect(result.current.status).toBeNull();
    expect(result.current.dateRange).toBeNull();
    expect(result.current.offeringId).toBeNull();
  });

  it('should update status filter', () => {
    const { result } = renderHook(() => useAppointmentFilters());

    act(() => {
      result.current.setStatus('CONFIRMED');
    });

    expect(result.current.status).toBe('CONFIRMED');
  });

  it('should update dateRange filter', () => {
    const { result } = renderHook(() => useAppointmentFilters());
    const dateRange: [Date, Date] = [
      new Date('2024-12-01'),
      new Date('2024-12-31'),
    ];

    act(() => {
      result.current.setDateRange(dateRange);
    });

    expect(result.current.dateRange).toEqual(dateRange);
  });

  it('should update offeringId filter', () => {
    const { result } = renderHook(() => useAppointmentFilters());
    const offeringId = 'offering-123';

    act(() => {
      result.current.setOfferingId(offeringId);
    });

    expect(result.current.offeringId).toBe(offeringId);
  });

  it('should reset all filters', () => {
    const { result } = renderHook(() => useAppointmentFilters());

    // Set all filters
    act(() => {
      result.current.setStatus('CONFIRMED');
      result.current.setDateRange([new Date('2024-12-01'), new Date('2024-12-31')]);
      result.current.setOfferingId('offering-123');
    });

    // Verify filters are set
    expect(result.current.status).toBe('CONFIRMED');
    expect(result.current.dateRange).not.toBeNull();
    expect(result.current.offeringId).toBe('offering-123');

    // Reset
    act(() => {
      result.current.reset();
    });

    // Verify all filters are null
    expect(result.current.status).toBeNull();
    expect(result.current.dateRange).toBeNull();
    expect(result.current.offeringId).toBeNull();
  });

  it('should allow setting status to null', () => {
    const { result } = renderHook(() => useAppointmentFilters());

    act(() => {
      result.current.setStatus('CONFIRMED');
    });

    expect(result.current.status).toBe('CONFIRMED');

    act(() => {
      result.current.setStatus(null);
    });

    expect(result.current.status).toBeNull();
  });

  it('should allow setting dateRange to null', () => {
    const { result } = renderHook(() => useAppointmentFilters());
    const dateRange: [Date, Date] = [
      new Date('2024-12-01'),
      new Date('2024-12-31'),
    ];

    act(() => {
      result.current.setDateRange(dateRange);
    });

    expect(result.current.dateRange).toEqual(dateRange);

    act(() => {
      result.current.setDateRange(null);
    });

    expect(result.current.dateRange).toBeNull();
  });

  it('should allow setting offeringId to null', () => {
    const { result } = renderHook(() => useAppointmentFilters());

    act(() => {
      result.current.setOfferingId('offering-123');
    });

    expect(result.current.offeringId).toBe('offering-123');

    act(() => {
      result.current.setOfferingId(null);
    });

    expect(result.current.offeringId).toBeNull();
  });

  it('should handle multiple filter updates independently', () => {
    const { result } = renderHook(() => useAppointmentFilters());

    act(() => {
      result.current.setStatus('CONFIRMED');
    });

    expect(result.current.status).toBe('CONFIRMED');
    expect(result.current.dateRange).toBeNull();
    expect(result.current.offeringId).toBeNull();

    act(() => {
      result.current.setOfferingId('offering-123');
    });

    expect(result.current.status).toBe('CONFIRMED');
    expect(result.current.dateRange).toBeNull();
    expect(result.current.offeringId).toBe('offering-123');

    act(() => {
      result.current.setDateRange([new Date('2024-12-01'), new Date('2024-12-31')]);
    });

    expect(result.current.status).toBe('CONFIRMED');
    expect(result.current.dateRange).not.toBeNull();
    expect(result.current.offeringId).toBe('offering-123');
  });

  it('should support all appointment status values', () => {
    const { result } = renderHook(() => useAppointmentFilters());
    const statuses: Array<'CONFIRMED' | 'CANCELLED' | 'COMPLETED'> = [
      'CONFIRMED',
      'CANCELLED',
      'COMPLETED',
    ];

    statuses.forEach((status) => {
      act(() => {
        result.current.setStatus(status);
      });

      expect(result.current.status).toBe(status);
    });
  });
});
