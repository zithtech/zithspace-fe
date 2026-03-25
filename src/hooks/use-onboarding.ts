import { useState } from "react";
import { EmployeeOnboardingService } from "@/services/onboardingService";

export function useEmployeeOnboarding() {
  /* ================= STATES ================= */

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [onboardedEmployees, setOnboardedEmployees] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);

  /* ================= FETCH ALL ONBOARDED EMPLOYEES ================= */

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const employees = await EmployeeOnboardingService.getAllEmployees();
      setOnboardedEmployees(employees);
      return employees;
    } catch (err: any) {
      setError(err.message || "Failed to fetch onboarded employees");
      throw err;
    } finally {
      setLoading(false);
    }
  };

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
      await fetchEmployees(); // Refresh list after creation
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
    setOnboardedEmployees([]);
  };

  /* ================= RETURN ================= */

  return {
    // state
    loading,
    error,
    success,
    result,
    onboardedEmployees,

    // actions
    fetchEmployees,
    createOnboarding,
    resetOnboardingState,
  };
}
