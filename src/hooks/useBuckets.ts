import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BucketService, {
  Bucket,
  CreateBucketData,
  UpdateBucketData,
} from "@/services/bucketService";
import { message } from "antd";
import { ticketKeys } from "./useTickets";

/**
 * React Query Hooks for Bucket Management
 * 
 * Provides hooks for bucket CRUD operations with optimistic updates
 * and automatic cache invalidation
 */

// ==================== Query Keys ====================

export const bucketKeys = {
  all: ["buckets"] as const,
  lists: () => [...bucketKeys.all, "list"] as const,
  list: (projectId?: string) => [...bucketKeys.lists(), { projectId }] as const,
  details: () => [...bucketKeys.all, "detail"] as const,
  detail: (id: string) => [...bucketKeys.details(), id] as const,
  ticketsBase: (id: string) => [...bucketKeys.all, "tickets", id] as const,
  tickets: (id: string, page?: number, limit?: number) => [...bucketKeys.ticketsBase(id), page, limit] as const,
};

// ==================== Queries ====================

/**
 * Fetch all buckets with optional project filter
 * 
 * @param projectId - Optional project ID to filter buckets
 * @param enabled - Whether to enable the query (default: true)
 */
export const useBuckets = (projectId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: bucketKeys.list(projectId),
    queryFn: () => BucketService.getBuckets(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  });
};

/**
 * Fetch single bucket by ID
 * 
 * @param bucketId - Bucket ID
 * @param enabled - Whether to enable the query
 */
export const useBucket = (bucketId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: bucketKeys.detail(bucketId),
    queryFn: () => BucketService.getBucketById(bucketId),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!bucketId,
  });
};

/**
 * Fetch tickets in a bucket with pagination
 * 
 * @param bucketId - Bucket ID
 * @param page - Page number
 * @param limit - Items per page
 */
export const useBucketTickets = (
  bucketId: string,
  page: number = 1,
  limit: number = 20
) => {
  return useQuery({
    queryKey: bucketKeys.tickets(bucketId, page, limit),
    queryFn: () => BucketService.getBucketTickets(bucketId, page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!bucketId,
    placeholderData: (previousData) => previousData, // Keep previous page while fetching
  });
};

// ==================== Mutations ====================

/**
 * Create a new bucket
 * 
 * Optimistically adds bucket to cache
 */
export const useCreateBucket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBucketData) => BucketService.createBucket(data),
    onMutate: async (newBucketData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: bucketKeys.all });

      // Snapshot previous values
      const previousBucketLists = queryClient.getQueriesData({
        queryKey: bucketKeys.lists()
      });

      // Create optimistic bucket
      const tempId = `temp-${Date.now()}`;
      const optimisticBucket: Bucket = {
        id: tempId,
        tenantId: '', // Will be set by backend
        projectId: newBucketData.projectId || null,
        name: newBucketData.name,
        description: newBucketData.description || null,
        color: newBucketData.color || null,
        isShared: newBucketData.isShared || false,
        createdById: '', // Current user
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: {
          id: '',
          name: 'You',
          workEmail: '',
        },
        _count: {
          tickets: 0,
          members: 0,
        },
        userRole: 'owner',
      };

      // Optimistically update cache
      previousBucketLists.forEach(([queryKey, oldData]: [any, any]) => {
        const params = queryKey[2] || {};

        // Filter: only add to matching project lists
        if (params.projectId && params.projectId !== newBucketData.projectId) {
          return;
        }

        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return [optimisticBucket];
          if (!Array.isArray(old)) return old;
          return [optimisticBucket, ...old];
        });
      });

      return { previousBucketLists };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousBucketLists) {
        context.previousBucketLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      message.error("Failed to create bucket");
    },
    onSuccess: (savedBucket) => {
      // Replace optimistic bucket with real one
      queryClient.setQueriesData({ queryKey: bucketKeys.lists() }, (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((bucket: Bucket) =>
          bucket.id.startsWith('temp-') && bucket.name === savedBucket.name
            ? savedBucket
            : bucket
        );
      });

      message.success("Bucket created successfully");
    },
  });
};

/**
 * Update bucket
 * 
 * Optimistically updates bucket in cache
 */
export const useUpdateBucket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBucketData }) =>
      BucketService.updateBucket(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: bucketKeys.all });

      const previousBucketLists = queryClient.getQueriesData({
        queryKey: bucketKeys.lists()
      });
      const previousBucket = queryClient.getQueryData<Bucket>(bucketKeys.detail(id));

      // Optimistically update lists
      queryClient.setQueriesData({ queryKey: bucketKeys.lists() }, (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((bucket: Bucket) =>
          bucket.id === id ? { ...bucket, ...data, updatedAt: new Date().toISOString() } : bucket
        );
      });

      // Optimistically update detail
      if (previousBucket) {
        queryClient.setQueryData(bucketKeys.detail(id), {
          ...previousBucket,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousBucketLists, previousBucket };
    },
    onError: (err, variables, context) => {
      if (context?.previousBucketLists) {
        context.previousBucketLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousBucket) {
        queryClient.setQueryData(bucketKeys.detail(variables.id), context.previousBucket);
      }
      message.error("Failed to update bucket");
    },
    onSuccess: (savedBucket) => {
      queryClient.setQueryData(bucketKeys.detail(savedBucket.id), savedBucket);
      queryClient.setQueriesData({ queryKey: bucketKeys.lists() }, (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((bucket: Bucket) =>
          bucket.id === savedBucket.id ? savedBucket : bucket
        );
      });
      message.success("Bucket updated successfully");
    },
  });
};

/**
 * Delete bucket
 * 
 * Optimistically removes bucket from cache
 */
export const useDeleteBucket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => BucketService.deleteBucket(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: bucketKeys.all });

      const previousBucketLists = queryClient.getQueriesData({
        queryKey: bucketKeys.lists()
      });

      // Optimistically remove bucket
      queryClient.setQueriesData({ queryKey: bucketKeys.lists() }, (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.filter((bucket: Bucket) => bucket.id !== id);
      });

      return { previousBucketLists };
    },
    onError: (err, id, context) => {
      if (context?.previousBucketLists) {
        context.previousBucketLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      message.error("Failed to delete bucket");
    },
    onSuccess: (data, id) => {
      queryClient.removeQueries({ queryKey: bucketKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all }); // Invalidate tickets as they may have been unassigned
      message.success("Bucket deleted successfully");
    },
  });
};

/**
 * Add member to bucket
 */
export const useAddBucketMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bucketId, userId, role }: {
      bucketId: string;
      userId: string;
      role: 'editor' | 'viewer'
    }) => BucketService.addBucketMember(bucketId, userId, role),
    onSuccess: (updatedBucket) => {
      queryClient.setQueryData(bucketKeys.detail(updatedBucket.id), updatedBucket);
      queryClient.invalidateQueries({ queryKey: bucketKeys.lists() });
      message.success("Member added successfully");
    },
    onError: () => {
      message.error("Failed to add member");
    },
  });
};

/**
 * Remove member from bucket
 */
export const useRemoveBucketMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bucketId, userId }: { bucketId: string; userId: string }) =>
      BucketService.removeBucketMember(bucketId, userId),
    onSuccess: (updatedBucket) => {
      queryClient.setQueryData(bucketKeys.detail(updatedBucket.id), updatedBucket);
      queryClient.invalidateQueries({ queryKey: bucketKeys.lists() });
      message.success("Member removed successfully");
    },
    onError: () => {
      message.error("Failed to remove member");
    },
  });
};

/**
 * Assign tickets to bucket (bulk operation)
 */
export const useAssignTicketsToBucket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bucketId, ticketIds }: { bucketId: string; ticketIds: string[] }) =>
      BucketService.assignTicketsToBucket(bucketId, ticketIds),
    onSuccess: (result, variables) => {
      // Invalidate bucket detail and tickets
      queryClient.invalidateQueries({ queryKey: bucketKeys.detail(variables.bucketId) });
      queryClient.invalidateQueries({ queryKey: bucketKeys.ticketsBase(variables.bucketId) });

      // Invalidate ticket queries as bucketId has changed
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });

      message.success(`${result.assignedCount} ticket(s) assigned to bucket`);
    },
    onError: () => {
      message.error("Failed to assign tickets");
    },
  });
};

/**
 * Unassign tickets from bucket (bulk operation)
 */
export const useUnassignTicketsFromBucket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bucketId, ticketIds }: { bucketId: string; ticketIds: string[] }) =>
      BucketService.unassignTicketsFromBucket(bucketId, ticketIds),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: bucketKeys.detail(variables.bucketId) });
      queryClient.invalidateQueries({ queryKey: bucketKeys.ticketsBase(variables.bucketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: () => {
    },
  });
};

/**
 * Move all tickets in bucket to specific sprint
 */
export const useMoveBucketToSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bucketId, sprintId }: { bucketId: string; sprintId: string }) =>
      BucketService.moveBucketToSprint(bucketId, sprintId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: bucketKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: (error: any) => {
    },
  });
};

/**
 * Move all tickets in bucket back to backlog
 */
export const useMoveBucketToBacklog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bucketId: string) => BucketService.moveBucketToBacklog(bucketId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: bucketKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: (error: any) => {
    },
  });
};
