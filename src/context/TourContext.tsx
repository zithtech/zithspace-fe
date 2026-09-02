'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { qaWorkflowSteps, ticketsTourSteps, documentHubTourSteps, RouteStep } from '../components/tour/TourSteps';

interface TourProgress {
  tourKey: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  currentStep: number;
}

interface TourContextType {
  run: boolean;
  steps: RouteStep[];
  stepIndex: number;
  currentTourKey: string | null;
  startTour: (tourType?: string, forceRestart?: boolean) => void;
  stopTour: () => void;
  skipTour: () => void;
  completeTour: () => void;
  setStepIndex: (index: number) => void;
  advanceTour: () => void;
  isTourCompleted: (tourKey: string) => boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [stepIndex, setStepIndexState] = useState(0);
  const [currentTourKey, setCurrentTourKey] = useState<string | null>(null);

  // Refs that always hold the latest values — used by advanceTour to avoid stale closures
  const stepIndexRef = useRef(0);
  const currentTourKeyRef = useRef<string | null>(null);
  stepIndexRef.current = stepIndex;
  currentTourKeyRef.current = currentTourKey;

  // Fetch tour progress from backend
  const { data: tourData, isSuccess } = useQuery({
    queryKey: ['userTours'],
    queryFn: async () => {
      const response = await apiClient.get('/api/user/tours');
      return response.data.tours as TourProgress[];
    },
    // Don't retry indefinitely if backend isn't ready
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const updateTourMutation = useMutation({
    mutationFn: async (params: { tourKey: string; status: TourProgress['status']; currentStep?: number }) => {
      await apiClient.patch(`/api/user/tours/${params.tourKey}`, params);
    },
    onMutate: async (newProgress) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['userTours'] });
      const previousTours = queryClient.getQueryData<TourProgress[]>(['userTours']);
      queryClient.setQueryData<TourProgress[]>(['userTours'], (old) => {
        const prog = newProgress as TourProgress;
        if (!old) return [prog];
        const existing = old.find(t => t.tourKey === prog.tourKey);
        if (existing) {
          return old.map(t => t.tourKey === prog.tourKey ? { ...t, ...prog } : t);
        }
        return [...old, prog];
      });
      return { previousTours };
    },
    onError: (err, newProgress, context) => {
      if (context?.previousTours) {
        queryClient.setQueryData(['userTours'], context.previousTours);
      }
    }
  });

  const isTourCompleted = useCallback((tourKey: string) => {
    if (!tourData) return false;
    const tour = tourData.find(t => t.tourKey === tourKey);
    return tour?.status === 'COMPLETED';
  }, [tourData]);

  const startTour = useCallback((tourKey: string = 'testiez-qa-workflow', forceRestart: boolean = false) => {
    setCurrentTourKey(tourKey);
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_tour_key', tourKey);
    }
    if (tourKey === 'testiez-qa-workflow') {
      setSteps(qaWorkflowSteps);
    } else if (tourKey === 'testiez-sprints') {
      setSteps(ticketsTourSteps);
    } else if (tourKey === 'testiez-document-hub') {
      setSteps(documentHubTourSteps);
    } else {
      return;
    }
    
    // Resume from where they left off if in progress, unless forceRestart is true
    const existing = tourData?.find(t => t.tourKey === tourKey);
    const startIndex = (!forceRestart && existing && existing.status === 'IN_PROGRESS') ? (existing.currentStep || 0) : 0;
    
    setStepIndexState(startIndex);
    setRun(true);
    
    if (forceRestart || !existing || existing.status === 'NOT_STARTED') {
      updateTourMutation.mutate({ tourKey, status: 'IN_PROGRESS', currentStep: startIndex });
    }
  }, [tourData, updateTourMutation]);

  const hasAutoStarted = React.useRef(false);

  // Resume the active tour on refresh or auto-start for new users
  useEffect(() => {
    if (isSuccess && tourData && !hasAutoStarted.current) {
      if (!run && !currentTourKey) {
        hasAutoStarted.current = true;
        
        // 1. Check if user was actively in a tour stored in localStorage
        const storedKey = typeof window !== 'undefined' ? localStorage.getItem('active_tour_key') : null;
        if (storedKey) {
          const storedTour = tourData.find(t => t.tourKey === storedKey);
          if (!storedTour || (storedTour.status !== 'COMPLETED' && storedTour.status !== 'SKIPPED')) {
            startTour(storedKey);
            return;
          }
        }

        // 2. Check if any tour in database is IN_PROGRESS
        const inProgressTour = tourData.find(t => t.status === 'IN_PROGRESS');
        if (inProgressTour) {
          startTour(inProgressTour.tourKey);
          return;
        }

        // 3. First time user: auto-start QA workflow tour only if no tour has ever been completed or skipped
        const hasLocalCompleted = typeof window !== 'undefined' && localStorage.getItem('initial_tour_completed') === 'true';
        const hasAnyFinishedTour = tourData.some(t => t.status === 'COMPLETED' || t.status === 'SKIPPED');
        if (!hasLocalCompleted && !hasAnyFinishedTour) {
          const qaTour = tourData.find(t => t.tourKey === 'testiez-qa-workflow');
          if (!qaTour || qaTour.status === 'NOT_STARTED') {
            startTour('testiez-qa-workflow');
          }
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, tourData, startTour]);

  const stopTour = useCallback(() => {
    setRun(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_tour_key');
      localStorage.setItem('initial_tour_completed', 'true');
    }
  }, []);

  const skipTour = useCallback(() => {
    setRun(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_tour_key');
      localStorage.setItem('initial_tour_completed', 'true');
    }
    if (currentTourKey) {
      updateTourMutation.mutate({ tourKey: currentTourKey, status: 'SKIPPED', currentStep: stepIndex });
    }
    setCurrentTourKey(null);
  }, [currentTourKey, stepIndex, updateTourMutation]);

  const completeTour = useCallback(() => {
    setRun(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_tour_key');
      localStorage.setItem('initial_tour_completed', 'true');
    }
    if (currentTourKey) {
      updateTourMutation.mutate({ tourKey: currentTourKey, status: 'COMPLETED', currentStep: stepIndex });
    }
    setCurrentTourKey(null);
  }, [currentTourKey, stepIndex, updateTourMutation]);

  const setStepIndex = useCallback((index: number) => {
    setStepIndexState(index);
    if (currentTourKey) {
      updateTourMutation.mutate({ tourKey: currentTourKey, status: 'IN_PROGRESS', currentStep: index });
    }
  }, [currentTourKey, updateTourMutation]);

  // advanceTour always uses refs — safe to call from stale closures (e.g. sidebar button onClick)
  const advanceTour = useCallback(() => {
    const newIndex = stepIndexRef.current + 1;
    setStepIndexState(newIndex);
    if (currentTourKeyRef.current) {
      updateTourMutation.mutate({ tourKey: currentTourKeyRef.current, status: 'IN_PROGRESS', currentStep: newIndex });
    }
  }, [updateTourMutation]);

  return (
    <TourContext.Provider
      value={{
        run,
        steps,
        stepIndex,
        currentTourKey,
        startTour,
        stopTour,
        skipTour,
        completeTour,
        setStepIndex,
        advanceTour,
        isTourCompleted,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
