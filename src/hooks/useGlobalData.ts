import { useQuery } from "@tanstack/react-query";
import { ProjectService } from "@/services/projectService";
import { MembersService } from "@/services/membersService";
import { SettingsService } from "@/services/settingsService";
import TicketService from "@/services/ticketService";
import DocumentHubService from "@/services/documentHub";

// Query keys for global data
export const globalDataKeys = {
  projects: ["global", "projects"] as const,
  members: ["global", "members"] as const,
  ticketConfig: ["global", "ticketConfig"] as const,
  tickets: ["global", "userTicketsByProject"],
  documentHub: ["documentHub"],
};

/**
 * Hook to fetch and cache user projects
 * Cached for 5 minutes (rarely changes)
 */
export const useUserProjects = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: globalDataKeys.projects,
    queryFn: () => ProjectService.getUserProjects(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    ...options,
  });
};

export const useUserTicketsByProjects = (
  projectId: string | undefined,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: [...globalDataKeys.tickets, projectId],
    queryFn: () => TicketService.getProjectTickets(projectId as string),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    enabled: Boolean(projectId) && options?.enabled !== false,
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
  return useQuery({
    queryKey: globalDataKeys.members,
    queryFn: () => MembersService.getMembersForSelect(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Hook to fetch and cache ticket configurations
 * Cached for 10 minutes (rarely changes)
 */
export const useTicketConfig = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: globalDataKeys.ticketConfig,
    queryFn: () => SettingsService.getTicketConfigurations(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};
