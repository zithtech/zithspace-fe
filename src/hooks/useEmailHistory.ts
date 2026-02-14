import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import EmailHistoryService, {
  EmailLog,
  EmailLogFilter,
  EmailStats,
  ModuleConfig,
  StatusConfig,
  MODULE_CONFIGS,
  STATUS_CONFIGS
} from "@/services/emailHistoryService";
import { message } from "antd";

/* ==================== QUERY KEYS ==================== */

export const emailHistoryKeys = {
  all: ["email-history"] as const,
  logs: () => [...emailHistoryKeys.all, "logs"] as const,
  logList: (params?: EmailLogFilter) => 
    [...emailHistoryKeys.logs(), params ?? {}] as const,
  details: () => [...emailHistoryKeys.all, "detail"] as const,
  detail: (id: string) => [...emailHistoryKeys.details(), id] as const,
  modules: () => [...emailHistoryKeys.all, "modules"] as const,
  stats: () => [...emailHistoryKeys.all, "stats"] as const,
  invoice: (invoiceId: string) => 
    [...emailHistoryKeys.all, "invoice", invoiceId] as const,
};

/* ==================== QUERIES ==================== */

/**
 * Fetch email logs with filters & pagination
 */
export const useEmailLogs = (
  params?: EmailLogFilter,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: emailHistoryKeys.logList(params),
    queryFn: () => EmailHistoryService.getEmailLogs(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled,
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Fetch single email log by ID
 */
export const useEmailLog = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: emailHistoryKeys.detail(id),
    queryFn: () => EmailHistoryService.getEmailLogById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!id,
  });
};

/**
 * Fetch all unique modules (DYNAMIC)
 */
export const useEmailModules = (enabled: boolean = true) => {
  return useQuery({
    queryKey: emailHistoryKeys.modules(),
    queryFn: () => EmailHistoryService.getModules(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled,
  });
};

/**
 * Fetch email statistics
 */
export const useEmailStats = (enabled: boolean = true) => {
  return useQuery({
    queryKey: emailHistoryKeys.stats(),
    queryFn: () => EmailHistoryService.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  });
};

/**
 * Fetch invoice-specific email history
 */
export const useInvoiceEmailHistory = (
  invoiceId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: emailHistoryKeys.invoice(invoiceId),
    queryFn: () => EmailHistoryService.getInvoiceEmailHistory(invoiceId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: enabled && !!invoiceId,
  });
};

/* ==================== DYNAMIC CONFIG HOOKS ==================== */

/**
 * Get module configuration (DYNAMIC)
 */
export const useModuleConfig = (module: string): ModuleConfig => {
  return EmailHistoryService.getModuleConfig(module);
};

/**
 * Get all module configurations (DYNAMIC - from API + static)
 */
export const useAllModuleConfigs = () => {
  const { data: modules = [] } = useEmailModules();
  
  const configs: Record<string, ModuleConfig> = { ...MODULE_CONFIGS };
  
  // Add configs for modules not in static config
  modules.forEach(module => {
    if (!configs[module]) {
      configs[module] = {
        color: '#8c8c8c',
        bgColor: '#f5f5f5',
        icon: 'MailOutlined',
        label: module.charAt(0) + module.slice(1).toLowerCase()
      };
    }
  });
  
  return configs;
};

/**
 * Get status configuration
 */
export const useStatusConfig = (status: string): StatusConfig => {
  return EmailHistoryService.getStatusConfig(status);
};

/**
 * Get all status configurations
 */
export const useAllStatusConfigs = () => {
  return STATUS_CONFIGS;
};

/* ==================== MUTATIONS ==================== */

/**
 * Download attachment
 */
export const useDownloadAttachment = () => {
  return useMutation({
    mutationFn: ({ url, filename }: { url: string; filename: string }) =>
      EmailHistoryService.downloadAttachment(url, filename),
    onError: (error: any) => {
      message.error(error.message || "Failed to download attachment");
    },
    onSuccess: () => {
      message.success("Download started");
    },
  });
};

/* ==================== UTILITY HOOKS ==================== */

/**
 * Refresh email history data
 */
export const useRefreshEmailHistory = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: emailHistoryKeys.logs() });
    queryClient.invalidateQueries({ queryKey: emailHistoryKeys.stats() });
    queryClient.invalidateQueries({ queryKey: emailHistoryKeys.modules() });
    message.success("Email history refreshed");
  };
};

/**
 * Get module badge count
 */
export const useModuleCounts = () => {
  const { data: stats } = useEmailStats();
  
  return (module: string): number => {
    return stats?.byModule?.find(m => m.module === module)?.count || 0;
  };
};

/**
 * Get status badge count
 */
export const useStatusCounts = () => {
  const { data: stats } = useEmailStats();
  
  return (status: string): number => {
    return stats?.byStatus?.find(s => s.status === status)?.count || 0;
  };
};

/**
 * Format email timestamp
 */
export const useFormatEmailDate = () => {
  return (date: string): { date: string; time: string; fromNow: string } => {
    const moment = require('moment');
    return {
      date: moment(date).format('MMM DD, YYYY'),
      time: moment(date).format('HH:mm:ss'),
      fromNow: moment(date).fromNow()
    };
  };
};

/**
 * Check if email has tracking data
 */
export const useEmailTracking = (email: EmailLog) => {
  return {
    isOpened: !!email.openedAt,
    isClicked: !!email.clickedAt,
    openedAt: email.openedAt,
    clickedAt: email.clickedAt,
    openRate: email.metadata?.openRate,
    clickRate: email.metadata?.clickRate
  };
};

/* ==================== PREFETCH HOOKS ==================== */

/**
 * Prefetch email log details
 */
export const usePrefetchEmailLog = () => {
  const queryClient = useQueryClient();
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: emailHistoryKeys.detail(id),
      queryFn: () => EmailHistoryService.getEmailLogById(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

/**
 * Prefetch modules list
 */
export const usePrefetchModules = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: emailHistoryKeys.modules(),
      queryFn: () => EmailHistoryService.getModules(),
      staleTime: 10 * 60 * 1000,
    });
  };
};

/**
 * Prefetch email stats
 */
export const usePrefetchStats = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: emailHistoryKeys.stats(),
      queryFn: () => EmailHistoryService.getStats(),
      staleTime: 5 * 60 * 1000,
    });
  };
};