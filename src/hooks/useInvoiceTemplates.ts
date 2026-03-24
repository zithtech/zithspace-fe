import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import InvoiceTemplateService, {
  CreateInvoiceTemplateData,
  UpdateInvoiceTemplateData,
} from "@/services/invoiceTemplateService";
import { message } from "antd";

export const templateKeys = {
  all: ["invoice-templates"] as const,
  lists: () => [...templateKeys.all, "list"] as const,
  details: () => [...templateKeys.all, "detail"] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
};

export const useInvoiceTemplates = () => {
  return useQuery({
    queryKey: templateKeys.lists(),
    queryFn: InvoiceTemplateService.getTemplates,
    staleTime: 5 * 60 * 1000,
  });
};

export const useInvoiceTemplate = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => InvoiceTemplateService.getTemplateById(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!id,
  });
};

export const useCreateInvoiceTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceTemplateData) =>
      InvoiceTemplateService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      message.success("Template created successfully");
    },
    onError: (error: any) => {
      message.error(error.message || "Failed to create template");
    },
  });
};

export const useUpdateInvoiceTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceTemplateData }) =>
      InvoiceTemplateService.updateTemplate(id, data),
    onSuccess: (updatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.setQueryData(templateKeys.detail(updatedTemplate.id), updatedTemplate);
      message.success("Template updated successfully");
    },
    onError: (error: any) => {
      message.error(error.message || "Failed to update template");
    },
  });
};

export const useDeleteInvoiceTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => InvoiceTemplateService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      message.success("Template deleted successfully");
    },
    onError: (error: any) => {
      message.error(error.message || "Failed to delete template");
    },
  });
};
