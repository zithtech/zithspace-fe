'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { qaWorkflowSteps, sprintSteps, RouteStep } from '../components/tour/TourSteps';

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
  isTourCompleted: (tourKey: string) => boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [stepIndex, setStepIndexState] = useState(0);
  const [currentTourKey, setCurrentTourKey] = useState<string | null>(null);

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

  const hasAutoStarted = React.useRef(false);

  // Check if QA tour should automatically start
  useEffect(() => {
    if (isSuccess && tourData && !hasAutoStarted.current) {
      const qaTour = tourData.find(t => t.tourKey === 'testiez-qa-workflow');
      if (!qaTour || (qaTour.status !== 'COMPLETED' && qaTour.status !== 'SKIPPED')) {
        // Automatically start the QA Workflow if it hasn't been started or is in progress
        if (!run && !currentTourKey) {
          hasAutoStarted.current = true;
          startTour('testiez-qa-workflow');
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, tourData]);

  const startTour = useCallback((tourKey: string = 'testiez-qa-workflow', forceRestart: boolean = false) => {
    setCurrentTourKey(tourKey);
    if (tourKey === 'testiez-qa-workflow') {
      setSteps(qaWorkflowSteps);
    } else if (tourKey === 'testiez-sprints') {
      setSteps(sprintSteps);
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

  const stopTour = useCallback(() => {
    setRun(false);
  }, []);

  const skipTour = useCallback(() => {
    setRun(false);
    if (currentTourKey) {
      updateTourMutation.mutate({ tourKey: currentTourKey, status: 'SKIPPED', currentStep: stepIndex });
    }
    setCurrentTourKey(null);
  }, [currentTourKey, stepIndex, updateTourMutation]);

  const completeTour = useCallback(() => {
    setRun(false);
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
