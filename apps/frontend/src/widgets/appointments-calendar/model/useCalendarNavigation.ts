import { useState, useCallback } from "react";
import { addWeeks, subWeeks } from "date-fns";
import { getWeekRange } from "../lib/dateUtils";

/**
 * Hook for managing calendar navigation state and actions.
 * Provides current week range and navigation functions.
 *
 * @returns Calendar navigation state and functions
 *
 * @example
 * const { currentWeek, goToPreviousWeek, goToNextWeek, goToToday } = useCalendarNavigation();
 *
 * // Current week range
 * const [start, end] = currentWeek;
 *
 * // Navigate to previous week
 * goToPreviousWeek();
 *
 * // Navigate to next week
 * goToNextWeek();
 *
 * // Return to current week
 * goToToday();
 */
export function useCalendarNavigation() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate current week range based on currentDate
  const currentWeek: [Date, Date] = getWeekRange(currentDate);

  /**
   * Navigate to the previous week (7 days earlier).
   */
  const goToPreviousWeek = useCallback(() => {
    setCurrentDate((prev) => subWeeks(prev, 1));
  }, []);

  /**
   * Navigate to the next week (7 days later).
   */
  const goToNextWeek = useCallback(() => {
    setCurrentDate((prev) => addWeeks(prev, 1));
  }, []);

  /**
   * Navigate to the current week (today's week).
   */
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  return {
    currentWeek,
    currentDate,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
  };
}
