import { useQuery } from "@tanstack/react-query";
import { ProjectService } from "@/services/projectService";
import { MembersService } from "@/services/membersService";
import { SettingsService } from "@/services/settingsService";
import TicketService from "@/services/ticketService";
import DocumentHubService from "@/services/documentHub";
import { useAuth } from "@/context/AuthContext";

// Query keys for global data
export const globalDataKeys = {
  projects: ["global", "projects"] as const,
  allProjects: ["global", "allProjects"] as const,
  members: ["global", "members"] as const,
  projectMembers: ["global", "projectMembers"] as const,
  ticketConfig: ["global", "ticketConfig"] as const,
  tickets: ["global", "userTicketsByProject"],
  documentHub: ["documentHub"],
};

/**
 * Hook to fetch and cache all available projects (for selection)
 */
export const useAllProjects = (options?: { enabled?: boolean }) => {
  const { user } = useAuth();
  return useQuery<{ value: string; label: string; code: string }[]>({
    queryKey: [...globalDataKeys.allProjects, user?.tenantId],
    queryFn: () => ProjectService.getProjectsForSelect(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!user && options?.enabled !== false,
    ...options,
  });
};

/**
 * Hook to fetch and cache user projects.
 * Always passes explicitOnly=true so only projects the user is a member of
 * (or project manager of) are returned, regardless of their role/permissions.
 * This is used for the project-switcher popup in TicketList.
 * Cached for 5 minutes (rarely changes)
 */
export const useUserProjects = (options?: { enabled?: boolean }) => {
  const { user } = useAuth();
  return useQuery({
    // Use a distinct cache key so this doesn't collide with the non-explicit variant
    queryKey: [...globalDataKeys.projects, user?.tenantId, user?.id, 'explicit'],
    queryFn: () => ProjectService.getUserProjects(true), // explicitOnly=true: always filter by membership
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    enabled: !!user && options?.enabled !== false,
    ...options,
  });
};

export const useUserTicketsByProjects = (
  projectId: string | undefined,
  options?: { enabled?: boolean },
) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...globalDataKeys.tickets, user?.tenantId, projectId],
    queryFn: () => TicketService.getProjectTickets(projectId as string),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    enabled: Boolean(projectId) && !!user && options?.enabled !== false,
    ...options,
  });
};

export const useDocumentHub = (
  documentId: string | undefined,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: [...globalDataKeys.documentHub, documentId],
    queryFn: () => DocumentHubService.getDocumentHub(documentId as string),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    enabled: Boolean(documentId) && options?.enabled !== false,
    ...options,
  });
};

/**
 * Hook to fetch and cache all members
 * Cached for 5 minutes (rarely changes)
 */
export const useMembers = (options?: { enabled?: boolean }) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...globalDataKeys.members, user?.tenantId],
    queryFn: () => MembersService.getMembersForSelect(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user && options?.enabled !== false,
    ...options,
  });
};

/**
 * Hook to fetch and cache ticket configurations
 * Cached for 10 minutes (rarely changes)
 */
export const useTicketConfig = (options?: { enabled?: boolean }) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...globalDataKeys.ticketConfig, user?.tenantId],
    queryFn: () => SettingsService.getTicketConfigurations(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!user && options?.enabled !== false,
    ...options,
  });
};

/**
 * Hook to fetch and cache project members
 * Cached for 5 minutes
 */
export const useProjectMembers = (projectId: string | undefined, options?: { enabled?: boolean }) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...globalDataKeys.projectMembers, user?.tenantId, projectId],
    queryFn: () => ProjectService.getProjectMembers(projectId as string),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: Boolean(projectId) && !!user && options?.enabled !== false,
    ...options,
  });
};
