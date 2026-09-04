'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/axios';
import {
  qaWorkflowSteps,
  ticketsTourSteps,
  documentHubTourSteps,
  manualProjectTourSteps,
  importMigrationTourSteps,
  adminSettingsTourSteps,
  rolesTourSteps,
  orgStructureTourSteps,
  membersTourSteps,
  RouteStep
} from '../components/tour/TourSteps';

interface TourProgress {
  tourKey: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  currentStep: number;
}

export interface ReturnTourContext {
  tourKey: string;
  stepIndex: number;
}

interface TourContextType {
  run: boolean;
  steps: RouteStep[];
  stepIndex: number;
  currentTourKey: string | null;
  returnTour: ReturnTourContext | null;
  startTour: (
    tourType?: string,
    forceRestart?: boolean,
    initialStepIndex?: number,
    returnContext?: ReturnTourContext | null
  ) => void;
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
  const router = useRouter();
  const pathname = usePathname();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [stepIndex, setStepIndexState] = useState(0);
  const [currentTourKey, setCurrentTourKey] = useState<string | null>(null);
  const [returnTour, setReturnTour] = useState<ReturnTourContext | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tour_return_context');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return null;
  });

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
      await queryClient.cancelQueries({ queryKey: ['userTours'] });
      const previousTours = queryClient.getQueryData<TourProgress[]>(['userTours']);
      
      if (previousTours) {
        queryClient.setQueryData<TourProgress[]>(['userTours'], (old = []) => {
          const index = old.findIndex(t => t.tourKey === newProgress.tourKey);
          if (index >= 0) {
            const updated = [...old];
            updated[index] = { ...updated[index], ...newProgress };
            return updated;
          }
          return [...old, newProgress as TourProgress];
        });
      }
      return { previousTours };
    },
    onError: (err, newProgress, context) => {
      if (context?.previousTours) {
        queryClient.setQueryData(['userTours'], context.previousTours);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['userTours'] });
    },
  });

  const isTourCompleted = useCallback((tourKey: string) => {
    if (!tourData) return false;
    const tour = tourData.find(t => t.tourKey === tourKey);
    return tour?.status === 'COMPLETED';
  }, [tourData]);

  const startTour = useCallback((
    tourType?: string,
    forceRestart = false,
    initialStepIndex?: number,
    returnContext?: ReturnTourContext | null
  ) => {
    let tourKey = tourType || 'testiez-sprints';
    let tourSteps: RouteStep[] = [];
    
    if (tourKey === 'testiez-qa-workflow' || tourKey === 'qa-workflow') {
      tourSteps = qaWorkflowSteps;
    } else if (tourKey === 'testiez-sprints') {
      tourSteps = ticketsTourSteps;
    } else if (tourKey === 'testiez-document-hub') {
      tourSteps = documentHubTourSteps;
    } else if (tourKey === 'testiez-project-manual') {
      tourSteps = manualProjectTourSteps;
    } else if (tourKey === 'testiez-project-import') {
      tourSteps = importMigrationTourSteps;
    } else if (tourKey === 'testiez-admin-settings') {
      tourSteps = adminSettingsTourSteps;
    } else if (tourKey === 'testiez-roles') {
      tourSteps = rolesTourSteps;
    } else if (tourKey === 'testiez-org-structure') {
      tourSteps = orgStructureTourSteps;
    } else if (tourKey === 'testiez-members') {
      tourSteps = membersTourSteps;
    } else {
      return;
    }

    if (returnContext !== undefined) {
      setReturnTour(returnContext);
      if (typeof window !== 'undefined') {
        if (returnContext) {
          localStorage.setItem('tour_return_context', JSON.stringify(returnContext));
        } else {
          localStorage.removeItem('tour_return_context');
        }
      }
    }

    setCurrentTourKey(tourKey);
    setSteps(tourSteps);
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_tour_key', tourKey);
    }
    
    // Resume from where they left off if in progress, unless forceRestart or initialStepIndex is provided
    const existing = tourData?.find(t => t.tourKey === tourKey);
    const startIndex = (initialStepIndex !== undefined)
      ? initialStepIndex
      : (!forceRestart && existing && existing.status === 'IN_PROGRESS')
      ? (existing.currentStep || 0)
      : 0;
    
    setStepIndexState(startIndex);
    setRun(true);
    
    const targetStep = tourSteps[startIndex] || tourSteps[0];
    if (targetStep?.route && pathname !== targetStep.route) {
      router.push(targetStep.route);
    }

    updateTourMutation.mutate({ tourKey, status: 'IN_PROGRESS', currentStep: startIndex });
  }, [tourData, updateTourMutation, router, pathname]);

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

  // Contextual first-time tour auto-start when user visits /projects/manage or /integrations
  useEffect(() => {
    if (!isSuccess || !tourData || run || currentTourKey) return;

    if (pathname === '/projects/manage') {
      const manualTour = tourData.find(t => t.tourKey === 'testiez-project-manual');
      const hasLocalDone = typeof window !== 'undefined' && localStorage.getItem('tour_manual_project_done') === 'true';
      if (!hasLocalDone && (!manualTour || manualTour.status === 'NOT_STARTED')) {
        startTour('testiez-project-manual');
      }
    } else if (pathname === '/integrations') {
      const importTour = tourData.find(t => t.tourKey === 'testiez-project-import');
      const hasLocalDone = typeof window !== 'undefined' && localStorage.getItem('tour_import_migration_done') === 'true';
      if (!hasLocalDone && (!importTour || importTour.status === 'NOT_STARTED')) {
        startTour('testiez-project-import');
      }
    }
  }, [pathname, isSuccess, tourData, run, currentTourKey, startTour]);

  const stopTour = useCallback(() => {
    setRun(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_tour_key');
      localStorage.setItem('initial_tour_completed', 'true');
    }
  }, []);

  const skipTour = useCallback(() => {
    setRun(false);
    const skippedTourKey = currentTourKey;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_tour_key');
      localStorage.setItem('initial_tour_completed', 'true');
      if (skippedTourKey === 'testiez-project-manual') localStorage.setItem('tour_manual_project_done', 'true');
      if (skippedTourKey === 'testiez-project-import') localStorage.setItem('tour_import_migration_done', 'true');
    }
    if (skippedTourKey) {
      updateTourMutation.mutate({ tourKey: skippedTourKey, status: 'SKIPPED', currentStep: stepIndex });
    }

    // Check if there is a parent tour to return to (e.g. returning to member tour after skipping role tour)
    let parentTour: ReturnTourContext | null = returnTour;
    if (!parentTour && typeof window !== 'undefined') {
      const stored = localStorage.getItem('tour_return_context');
      if (stored) {
        try {
          parentTour = JSON.parse(stored);
        } catch {}
      }
    }

    if (parentTour && parentTour.tourKey !== skippedTourKey) {
      setReturnTour(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tour_return_context');
      }
      setTimeout(() => {
        startTour(parentTour!.tourKey, false, parentTour!.stepIndex, null);
      }, 150);
      return;
    }

    setCurrentTourKey(null);
  }, [currentTourKey, stepIndex, updateTourMutation, returnTour, startTour]);

  const completeTour = useCallback(() => {
    setRun(false);
    const completedTourKey = currentTourKey;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_tour_key');
      localStorage.setItem('initial_tour_completed', 'true');
      if (completedTourKey === 'testiez-project-manual') localStorage.setItem('tour_manual_project_done', 'true');
      if (completedTourKey === 'testiez-project-import') localStorage.setItem('tour_import_migration_done', 'true');
    }
    if (completedTourKey) {
      updateTourMutation.mutate({ tourKey: completedTourKey, status: 'COMPLETED', currentStep: stepIndex });
    }

    // Check if there is a parent tour to return to (e.g. returning to member tour after finishing role tour)
    let parentTour: ReturnTourContext | null = returnTour;
    if (!parentTour && typeof window !== 'undefined') {
      const stored = localStorage.getItem('tour_return_context');
      if (stored) {
        try {
          parentTour = JSON.parse(stored);
        } catch {}
      }
    }

    if (parentTour && parentTour.tourKey !== completedTourKey) {
      setReturnTour(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tour_return_context');
      }
      setTimeout(() => {
        startTour(parentTour!.tourKey, false, parentTour!.stepIndex, null);
      }, 150);
      return;
    }

    setCurrentTourKey(null);
  }, [currentTourKey, stepIndex, updateTourMutation, returnTour, startTour]);

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
        returnTour,
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
