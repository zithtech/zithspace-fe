import { create } from 'zustand';
import { TimeTrackingEntry, TimeTrackingService } from '@/services/timeTracking.service';

interface TimeTrackerState {
  activeEntry: TimeTrackingEntry | null;
  activeEntries: TimeTrackingEntry[];
  isLoading: boolean;
  isPopoverOpen: boolean;
  refreshTrigger: number;
  serverTimeOffset: number;
  
  // Actions
  setPopoverOpen: (open: boolean) => void;
  setServerTimeOffset: (offset: number) => void;
  fetchActiveTimer: () => Promise<void>;
  startTimer: (data: Partial<TimeTrackingEntry>) => Promise<void>;
  startMultipleTimers: (dataArray: Partial<TimeTrackingEntry>[]) => Promise<void>;
  pauseAllTimers: () => Promise<void>;
  resumeAllTimers: () => Promise<void>;
  stopAllTimers: () => Promise<void>;
  pauseTimerById: (id: string) => Promise<void>;
  resumeTimerById: (id: string) => Promise<void>;
  stopTimerById: (id: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  syncTimer: (entry: TimeTrackingEntry) => void;
}

export const useTimeTrackerStore = create<TimeTrackerState>((set, get) => ({
  activeEntry: null,
  activeEntries: [],
  isLoading: false,
  isPopoverOpen: false,
  refreshTrigger: 0,

  setPopoverOpen: (open) => set({ isPopoverOpen: open }),

  fetchActiveTimer: async () => {
    try {
      set({ isLoading: true });
      const entries = await TimeTrackingService.getEntries();
      const activeTimers = entries.filter((e) => e.status === 'RUNNING' || e.status === 'PAUSED');
      // Set the most recent one as the "primary" activeEntry
      const mostRecent = activeTimers.length > 0 
        ? [...activeTimers].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0]
        : null;
      set({ 
        activeEntries: activeTimers,
        activeEntry: mostRecent, 
        isLoading: false 
      });
    } catch (error) {
      console.error("Failed to fetch active timers:", error);
      set({ isLoading: false });
    }
  },

  startTimer: async (data) => {
    try {
      set({ isLoading: true });
      const newEntry = await TimeTrackingService.startTimer(data);
      const { activeEntries } = get();
      set({ 
        activeEntries: [newEntry, ...activeEntries],
        activeEntry: newEntry, 
        isLoading: false,
        refreshTrigger: get().refreshTrigger + 1
      });
    } catch (error) {
      console.error("Failed to start timer:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  startMultipleTimers: async (dataArray) => {
    try {
      set({ isLoading: true });
      const newEntries: TimeTrackingEntry[] = [];
      for (const data of dataArray) {
        const entry = await TimeTrackingService.startTimer(data);
        newEntries.push(entry);
      }
      const { activeEntries } = get();
      // Set the last one as active for UI purposes (display in popover)
      const lastEntry = newEntries[newEntries.length - 1];
      set({ 
        activeEntries: [...newEntries, ...activeEntries],
        activeEntry: lastEntry, 
        isLoading: false,
        refreshTrigger: get().refreshTrigger + 1
      });
    } catch (error) {
      console.error("Failed to start multiple timers:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  pauseTimerById: async (id) => {
    try {
      const updatedEntry = await TimeTrackingService.pauseTimer(id);
      const { activeEntries, activeEntry } = get();
      const newActiveEntries = activeEntries.map(e => e.id === id ? updatedEntry : e);
      set({ 
        activeEntries: newActiveEntries,
        activeEntry: activeEntry?.id === id ? updatedEntry : activeEntry
      });
    } catch (error) {
      console.error(`Failed to pause timer ${id}:`, error);
      throw error;
    }
  },

  resumeTimerById: async (id) => {
    try {
      const updatedEntry = await TimeTrackingService.resumeTimer(id);
      const { activeEntries, activeEntry } = get();
      const newActiveEntries = activeEntries.map(e => e.id === id ? updatedEntry : e);
      set({ 
        activeEntries: newActiveEntries,
        activeEntry: activeEntry?.id === id ? updatedEntry : activeEntry
      });
    } catch (error) {
      console.error(`Failed to resume timer ${id}:`, error);
      throw error;
    }
  },

  stopTimerById: async (id) => {
    try {
      await TimeTrackingService.stopTimer(id);
      const { activeEntries, activeEntry } = get();
      const newActiveEntries = activeEntries.filter(e => e.id !== id);
      let newActiveEntry = activeEntry?.id === id ? null : activeEntry;
      if (!newActiveEntry && newActiveEntries.length > 0) {
        newActiveEntry = [...newActiveEntries].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
      }
      set({ 
        activeEntries: newActiveEntries,
        activeEntry: newActiveEntry,
        refreshTrigger: get().refreshTrigger + 1
      });
    } catch (error) {
      console.error(`Failed to stop timer ${id}:`, error);
      throw error;
    }
  },

  pauseAllTimers: async () => {
    try {
      set({ isLoading: true });
      const { activeEntries } = get();
      const runningTimers = activeEntries.filter(e => e.status === 'RUNNING');
      await Promise.all(runningTimers.map(e => get().pauseTimerById(e.id)));
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  resumeAllTimers: async () => {
    try {
      set({ isLoading: true });
      const { activeEntries } = get();
      const pausedTimers = activeEntries.filter(e => e.status === 'PAUSED');
      await Promise.all(pausedTimers.map(e => get().resumeTimerById(e.id)));
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  stopAllTimers: async () => {
    try {
      set({ isLoading: true });
      const { activeEntries } = get();
      await Promise.all(activeEntries.map(e => get().stopTimerById(e.id)));
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  pauseTimer: async () => get().pauseAllTimers(),
  resumeTimer: async () => get().resumeAllTimers(),
  stopTimer: async () => get().stopAllTimers(),

  syncTimer: (updatedEntry) => {
    const { activeEntries, activeEntry } = get();
    
    // If the entry is stopped, remove it
    if (updatedEntry.status === 'STOPPED') {
      const newActiveEntries = activeEntries.filter(e => e.id !== updatedEntry.id);
      let newActiveEntry = activeEntry?.id === updatedEntry.id ? null : activeEntry;
      if (!newActiveEntry && newActiveEntries.length > 0) {
        newActiveEntry = [...newActiveEntries].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
      }
      set({ 
        activeEntries: newActiveEntries,
        activeEntry: newActiveEntry,
        refreshTrigger: get().refreshTrigger + 1
      });
      return;
    }

    // Otherwise update or add
    const exists = activeEntries.some(e => e.id === updatedEntry.id);
    let newActiveEntries;
    if (exists) {
      newActiveEntries = activeEntries.map(e => e.id === updatedEntry.id ? updatedEntry : e);
    } else {
      newActiveEntries = [updatedEntry, ...activeEntries];
    }

    set({ 
      activeEntries: newActiveEntries,
      activeEntry: activeEntry?.id === updatedEntry.id || !activeEntry ? updatedEntry : activeEntry,
      refreshTrigger: get().refreshTrigger + 1
    });
  }
}));
