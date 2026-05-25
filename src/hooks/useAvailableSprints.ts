import { useQuery } from '@tanstack/react-query';
import ReleasePlanService, { ReleasePlan } from '@/services/releasePlanService';
import { usePermission } from '@/hooks/usePermission';

/**
 * Hook to fetch available sprints (active + planning) for a project
 * Used for sprint assignment dropdowns in buckets, trash, archived pages, etc.
 * 
 * @param projectId - The project ID to fetch available sprints for
 * @returns Query result with available sprints data
 */
export function useAvailableSprints(projectId: string | undefined) {
  const { canReadTicketPlan } = usePermission();
  return useQuery<ReleasePlan[], Error>({
    queryKey: ['availableSprints', projectId],
    queryFn: () => ReleasePlanService.getAvailableSprints(projectId!),
    enabled: !!projectId && canReadTicketPlan,
    staleTime: 30 * 1000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}
