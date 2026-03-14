import { useState } from "react";
import { EmployeeOnboardingService } from "@/services/onboardingService";

export function useEmployeeOnboarding() {
  /* ================= STATES ================= */

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [result, setResult] = useState<any>(null);

  /* ================= CREATE ONBOARDING ================= */

  const createOnboarding = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response =
        await EmployeeOnboardingService.createEmployeeOnboarding(data);

      setResult(response);
      setSuccess(true);

      return response;
    } catch (err: any) {
      setError(err.message || "Employee onboarding failed");
      setSuccess(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESET ================= */

  const resetOnboardingState = () => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    setResult(null);
  };

  /* ================= RETURN ================= */

  return {
    // state
    loading,
    error,
    success,
    result,

    // actions
    createOnboarding,
    resetOnboardingState,
  };
}
