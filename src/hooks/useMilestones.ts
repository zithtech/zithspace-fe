import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MilestoneService, Milestone, MilestoneFormData } from "@/services/milestoneService";
import { message } from "antd";

export const useMilestones = (projectId?: string) => {
  const queryClient = useQueryClient();

  // Fetch milestones
  const { data: milestones = [], isLoading, error } = useQuery({
    queryKey: ["milestones", projectId],
    queryFn: () => MilestoneService.getMilestones(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create milestone
  const createMutation = useMutation({
    mutationFn: (data: MilestoneFormData) => MilestoneService.createMilestone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      message.success("Milestone created successfully!");
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Failed to create milestone");
    },
  });

  // Update milestone
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MilestoneFormData> }) =>
      MilestoneService.updateMilestone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      message.success("Milestone updated successfully!");
    },
  });

  // Delete milestone
  const deleteMutation = useMutation({
    mutationFn: (id: string) => MilestoneService.deleteMilestone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      message.success("Milestone deleted successfully!");
    },
  });

  // Update sprints (multi-assignment)
  const updateSprintsMutation = useMutation({
    mutationFn: ({ id, sprintIds }: { id: string; sprintIds: string[] }) =>
      MilestoneService.updateMilestoneSprints(id, sprintIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      message.success("Sprint assignments updated successfully!");
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Failed to update sprints");
    },
  });

  return {
    milestones,
    isLoading,
    error,
    createMilestone: createMutation.mutateAsync,
    updateMilestone: updateMutation.mutateAsync,
    deleteMilestone: deleteMutation.mutateAsync,
    updateMilestoneSprints: updateSprintsMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingSprints: updateSprintsMutation.isPending,
  };
};
