// import { useCallback, useEffect, useState } from "react";
// import {
//   EmployeeOnboardingService,
//   CreateEmployeeOnboardingData,
//   EmployeeOnboarding,
// } from "@/services/onboardingService";

// /* =====================================================
//    EMPLOYEE ONBOARDING HOOK (CREATE + GET + DELETE)
// ===================================================== */

// export function useEmployeeOnboarding(employeeId?: string) {
//   /* ================= STATES ================= */

//   const [onboarding, setOnboarding] = useState<EmployeeOnboarding | null>(null);

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   /* ================= GET FULL ONBOARDING ================= */

//   const fetchEmployeeOnboarding = useCallback(async () => {
//     if (!employeeId) return;

//     try {
//       setLoading(true);
//       setError(null);

//       const data =
//         await EmployeeOnboardingService.getOnboardingByEmployeeId(employeeId);

//       setOnboarding(data);
//     } catch (err: any) {
//       setError(err.message || "Failed to fetch employee onboarding");
//     } finally {
//       setLoading(false);
//     }
//   }, [employeeId]);

//   /* ================= CREATE FULL ONBOARDING ================= */

//   const createEmployeeOnboarding = async (
//     data: CreateEmployeeOnboardingData,
//   ) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const created = await EmployeeOnboardingService.createOnboarding(data);

//       return created;
//     } catch (err: any) {
//       setError(err.message || "Employee onboarding failed");
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= DELETE FULL ONBOARDING ================= */

//   const deleteEmployeeOnboarding = async (id: string) => {
//     try {
//       setLoading(true);
//       setError(null);

//       await EmployeeOnboardingService.deleteOnboarding(id);
//       setOnboarding(null);
//     } catch (err: any) {
//       setError(err.message || "Failed to delete employee onboarding");
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= AUTO LOAD ================= */

//   useEffect(() => {
//     fetchEmployeeOnboarding();
//   }, [fetchEmployeeOnboarding]);

//   /* ================= RETURN ================= */

//   return {
//     // data
//     onboarding,

//     // state
//     loading,
//     error,

//     // actions
//     fetchEmployeeOnboarding,
//     createEmployeeOnboarding,
//     deleteEmployeeOnboarding,
//   };
// }

import { useState } from "react";
import { EmployeeOnboardingService } from "@/services/onboardingService";

/* =====================================================
   EMPLOYEE ONBOARDING HOOK
===================================================== */

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
