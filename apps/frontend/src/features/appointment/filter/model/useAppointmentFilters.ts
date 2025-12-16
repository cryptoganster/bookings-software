import { create } from 'zustand';
import type { AppointmentStatus } from '@packages/shared-types';

interface AppointmentFiltersState {
  status: AppointmentStatus | null;
  dateRange: [Date, Date] | null;
  offeringId: string | null;
  setStatus: (status: AppointmentStatus | null) => void;
  setDateRange: (range: [Date, Date] | null) => void;
  setOfferingId: (id: string | null) => void;
  reset: () => void;
}

/**
 * Zustand store para filtros de appointments
 * Mantiene el estado de los filtros aplicados en la página de appointments
 */
export const useAppointmentFilters = create<AppointmentFiltersState>((set) => ({
  status: null,
  dateRange: null,
  offeringId: null,
  
  setStatus: (status) => set({ status }),
  
  setDateRange: (dateRange) => set({ dateRange }),
  
  setOfferingId: (offeringId) => set({ offeringId }),
  
  reset: () => set({ 
    status: null, 
    dateRange: null, 
    offeringId: null 
  }),
}));
