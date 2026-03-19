import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import {
  MailTemplateService,
  MailTemplate,
  CreateMailTemplateData,
  UpdateMailTemplateData,
  MailTemplateFilters,
} from "@/services/mailTemplateService";
import { PaginatedResponse } from "@/lib/axios";

export const mailTemplateKeys = {
  all: ["mail-templates"] as const,
  lists: () => [...mailTemplateKeys.all, "list"] as const,
  list: (filters: MailTemplateFilters) =>
    [...mailTemplateKeys.lists(), filters] as const,
  details: () => [...mailTemplateKeys.all, "detail"] as const,
  detail: (id: string) => [...mailTemplateKeys.details(), id] as const,
};

/**
 * Hook to get all mail templates
 */
export const useMailTemplates = (filters: MailTemplateFilters = {}) => {
  return useQuery<PaginatedResponse<MailTemplate>>({
    queryKey: mailTemplateKeys.list(filters),
    queryFn: () => MailTemplateService.getAllMailTemplates(filters),
  });
};

/**
 * Hook to get a single mail template
 */
export const useMailTemplate = (id: string, enabled = true) => {
  return useQuery<MailTemplate>({
    queryKey: mailTemplateKeys.detail(id),
    queryFn: () => MailTemplateService.getMailTemplate(id),
    enabled: enabled && !!id,
  });
};

/**
 * Hook to create a mail template
 */
export const useCreateMailTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMailTemplateData) =>
      MailTemplateService.createMailTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mailTemplateKeys.lists() });
      message.success("Mail template created successfully");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to create template");
    },
  });
};

/**
 * Hook to update a mail template
 */
export const useUpdateMailTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMailTemplateData }) =>
      MailTemplateService.updateMailTemplate(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(mailTemplateKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: mailTemplateKeys.lists() });
      message.success("Mail template updated successfully");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to update template");
    },
  });
};

/**
 * Hook to update mail template status
 */
export const useUpdateMailTemplateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) =>
      MailTemplateService.updateMailTemplate(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: mailTemplateKeys.lists() });
      const previousTemplates = queryClient.getQueriesData<PaginatedResponse<MailTemplate>>({
        queryKey: mailTemplateKeys.lists(),
      });

      previousTemplates.forEach(([queryKey, oldData]) => {
        if (!oldData) return;
        queryClient.setQueryData(
          queryKey,
          {
            ...oldData,
            data: oldData.data.map((t) => (t.id === id ? { ...t, status } : t))
          }
        );
      });

      return { previousTemplates };
    },
    onError: (_err, _vars, context) => {
      context?.previousTemplates?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      message.error("Failed to update status");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: mailTemplateKeys.lists() });
    },
  });
};

/**
 * Hook to delete a mail template
 */
export const useDeleteMailTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => MailTemplateService.deleteMailTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mailTemplateKeys.all });
      message.success("Mail template deleted successfully");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to delete template");
    },
  });
};
