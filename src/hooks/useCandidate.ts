import { useState } from "react";
import { message } from "antd";
import { useRouter } from "next/navigation";
import candidateService from "@/services/candidateService";

export const useCandidate = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const createCandidate = async (payload: any) => {
    setIsSubmitting(true);
    try {
      const res = await candidateService.createCandidate(payload);
      
      // The api wrapper throws if search fails or success is false
      // If we are here, it succeeded.
      message.success({
        content: "Candidate created successfully.",
        style: { marginTop: '80px' }
      });
      router.refresh(); 
      router.push("/recruitment/candidate-management"); 
    } catch (error: any) {
      console.error("Error creating candidate:", error);
      message.error({
        content: error.details?.error || error.message || "An error occurred while creating the candidate.",
        style: { marginTop: '80px' }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCandidate = async (id: string, payload: any) => {
    setIsSubmitting(true);
    try {
      const res = await candidateService.updateCandidate(id, payload);
      
      message.success({
        content: "Candidate updated successfully.",
        style: { marginTop: '80px' }
      });
      router.refresh(); 
      router.push("/recruitment/candidate-management"); 
    } catch (error: any) {
      console.error("Error updating candidate:", error);
      message.error({
        content: error.details?.error || error.message || "An error occurred while updating the candidate.",
        style: { marginTop: '80px' }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createCandidate, updateCandidate, isSubmitting };
};