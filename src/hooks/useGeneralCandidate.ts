import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import generalCandidateService, { GeneralCandidatePayload } from "@/services/generalCandidateService";
import { message } from "antd";

export const useGeneralCandidates = () => {
  const queryClient = useQueryClient();

  // Fetch all candidates
  const { data: candidates, isLoading, error, refetch } = useQuery({
    queryKey: ["general-candidates"],
    queryFn: () => generalCandidateService.getAll(),
  });

  // Create candidate
  const createMutation = useMutation({
    mutationFn: (data: GeneralCandidatePayload) => generalCandidateService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["general-candidates"] });
      message.success("Candidate added successfully");
    },
    onError: (error: any) => {
      message.error(error.message || "Failed to add candidate");
    },
  });

  // Update candidate
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GeneralCandidatePayload> }) =>
      generalCandidateService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["general-candidates"] });
      message.success("Candidate updated successfully");
    },
    onError: (error: any) => {
      message.error(error.message || "Failed to update candidate");
    },
  });

  // Delete candidate
  const deleteMutation = useMutation({
    mutationFn: (id: string) => generalCandidateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["general-candidates"] });
      message.success("Candidate deleted successfully");
    },
    onError: (error: any) => {
      message.error(error.message || "Failed to delete candidate");
    },
  });

  return {
    candidates,
    isLoading,
    error,
    refetch,
    createCandidate: createMutation.mutateAsync,
    updateCandidate: updateMutation.mutateAsync,
    deleteCandidate: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const useGeneralCandidate = (id: string) => {
  return useQuery({
    queryKey: ["general-candidate", id],
    queryFn: () => generalCandidateService.getById(id),
    enabled: !!id,
  });
};
