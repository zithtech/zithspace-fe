import { create } from 'zustand';
import { TimeTrackingEntry, TimeTrackingService } from '@/services/timeTracking.service';

interface TimeTrackerState {
  activeEntry: TimeTrackingEntry | null;
  isLoading: boolean;
  isPopoverOpen: boolean;
  
  // Actions
  setPopoverOpen: (open: boolean) => void;
  fetchActiveTimer: () => Promise<void>;
  startTimer: (data: Partial<TimeTrackingEntry>) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
}

export const useTimeTrackerStore = create<TimeTrackerState>((set, get) => ({
  activeEntry: null,
  isLoading: false,
  isPopoverOpen: false,

  setPopoverOpen: (open) => set({ isPopoverOpen: open }),

  fetchActiveTimer: async () => {
    try {
      set({ isLoading: true });
      const entries = await TimeTrackingService.getEntries();
      const activeTimer = entries.find((e) => e.status === 'RUNNING' || e.status === 'PAUSED');
      set({ activeEntry: activeTimer || null, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch active timer:", error);
      set({ isLoading: false });
    }
  },

  startTimer: async (data) => {
    try {
      set({ isLoading: true });
      const newEntry = await TimeTrackingService.startTimer(data);
      set({ activeEntry: newEntry, isLoading: false });
    } catch (error) {
      console.error("Failed to start timer:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  pauseTimer: async () => {
    const { activeEntry } = get();
    if (!activeEntry) return;

    try {
      set({ isLoading: true });
      const updatedEntry = await TimeTrackingService.pauseTimer(activeEntry.id);
      set({ activeEntry: updatedEntry, isLoading: false });
    } catch (error) {
      console.error("Failed to pause timer:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  resumeTimer: async () => {
    const { activeEntry } = get();
    if (!activeEntry) return;

    try {
      set({ isLoading: true });
      const updatedEntry = await TimeTrackingService.resumeTimer(activeEntry.id);
      set({ activeEntry: updatedEntry, isLoading: false });
    } catch (error) {
      console.error("Failed to resume timer:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  stopTimer: async () => {
    const { activeEntry } = get();
    if (!activeEntry) return;

    try {
      set({ isLoading: true });
      await TimeTrackingService.stopTimer(activeEntry.id);
      set({ activeEntry: null, isLoading: false });
    } catch (error) {
      console.error("Failed to stop timer:", error);
      set({ isLoading: false });
      throw error;
    }
  }
}));
