import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryService, CreateCategoryData, CreateRequestData, ManagerActionData, FinanceActionData, AddAttachmentData } from '@/services/categoryService';
import { message } from 'antd';

export const categoryKeys = {
  all: ['reimbursement-categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (params: any) => [...categoryKeys.lists(), params] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};


export const useUploadFile = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const response = await CategoryService.uploadFile(file);
      
      console.log('📤 Raw API response:', response);
      console.log('📦 File object:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // ✅ Add missing fields from the File object
      return {
        success: response.success,
        filename: response.filename,
        url: response.url,
        fileSize: response.fileSize || file.size,  // Add from File if missing
        fileType: response.fileType || file.type || 'application/octet-stream',  // Add from File if missing
      };
    },
    onError: (error: any) => {
      message.error(error.message || 'File upload failed');
    },
  });
};

export const requestKeys = {
  all: ['reimbursement-requests'] as const,
  lists: () => [...requestKeys.all, 'list'] as const,
  list: (params: any) => [...requestKeys.lists(), params] as const,
  details: () => [...requestKeys.all, 'detail'] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
  approvals: (id: string) => [...requestKeys.detail(id), 'approvals'] as const,
  attachments: (id: string) => [...requestKeys.detail(id), 'attachments'] as const,
};

// --- Category Hooks ---

export const useCategories = (params: any = {}) => {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => CategoryService.getCategories(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => CategoryService.getCategoryById(id),
    enabled: !!id,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryData) => CategoryService.createCategory(data),
    onSuccess: () => {
      message.success('Category created successfully');
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to create category');
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoryData> }) => 
      CategoryService.updateCategory(id, data),
    onSuccess: (data) => {
      message.success('Category updated successfully');
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(data.id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to update category');
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => CategoryService.deleteCategory(id),
    onSuccess: () => {
      message.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to delete category');
    },
  });
};

// --- Request Hooks ---

export const useRequests = (params: any = {}) => {
  return useQuery({
    queryKey: requestKeys.list(params),
    queryFn: () => CategoryService.getRequests(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useRequest = (id: string) => {
  return useQuery({
    queryKey: requestKeys.detail(id),
    queryFn: () => CategoryService.getRequestById(id),
    enabled: !!id,
  });
};

export const useCreateRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRequestData) => CategoryService.createRequest(data),
    onSuccess: () => {
      message.success('Reimbursement request created');
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to create request');
    },
  });
};

export const useUpdateRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRequestData> }) => 
      CategoryService.updateRequest(id, data),
    onSuccess: (data) => {
      message.success('Request updated');
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(data.id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to update request');
    },
  });
};

export const useDeleteRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => CategoryService.deleteRequest(id),
    onSuccess: () => {
      message.success('Request deleted');
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to delete request');
    },
  });
};

// --- Action Hooks ---

export const useManagerAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ManagerActionData }) => 
      CategoryService.managerAction(id, data),
    onSuccess: (data) => {
      message.success(`Request ${data.status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: requestKeys.approvals(data.id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Action failed');
    },
  });
};

export const useFinanceAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FinanceActionData }) => 
      CategoryService.financeAction(id, data),
    onSuccess: (data) => {
      message.success(`Request marked as ${data.financeStatus?.toLowerCase() || data.status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: requestKeys.approvals(data.id) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Action failed');
    },
  });
};

// --- Item Hooks ---

export const useAddItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: any }) => 
      CategoryService.addItem(requestId, data),
    onSuccess: (_, { requestId }) => {
      message.success('Item added');
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(requestId) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to add item');
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, itemId, data }: { requestId: string; itemId: string; data: any }) => 
      CategoryService.updateItem(requestId, itemId, data),
    onSuccess: (_, { requestId }) => {
      message.success('Item updated');
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(requestId) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to update item');
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, itemId }: { requestId: string; itemId: string }) => 
      CategoryService.deleteItem(requestId, itemId),
    onSuccess: (_, { requestId }) => {
      message.success('Item deleted');
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(requestId) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to delete item');
    },
  });
};

// --- Approval & Attachment Hooks ---

export const useApprovals = (requestId: string) => {
  return useQuery({
    queryKey: requestKeys.approvals(requestId),
    queryFn: () => CategoryService.getApprovals(requestId),
    enabled: !!requestId,
  });
};

export const useAttachments = (requestId: string) => {
  return useQuery({
    queryKey: requestKeys.attachments(requestId),
    queryFn: () => CategoryService.getAttachments(requestId),
    enabled: !!requestId,
  });
};

export const useAddAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: AddAttachmentData }) => 
      CategoryService.addAttachment(requestId, data),
    onSuccess: (_, { requestId }) => {
      message.success('Attachment uploaded');
      queryClient.invalidateQueries({ queryKey: requestKeys.attachments(requestId) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to upload attachment');
    },
  });
};

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, attachmentId }: { requestId: string; attachmentId: string }) => 
      CategoryService.deleteAttachment(requestId, attachmentId),
    onSuccess: (_, { requestId }) => {
      message.success('Attachment deleted');
      queryClient.invalidateQueries({ queryKey: requestKeys.attachments(requestId) });
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to delete attachment');
    },
  });
};
