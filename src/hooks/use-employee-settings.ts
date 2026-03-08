import { useState, useEffect } from "react";
import {
  EmployeeSettingService,
  EmployeeSetting,
  UpdateEmployeeSettingData,
} from "@/services/employeeSettingService";

export function useEmployeeSetting() {
  /* ================= STATES ================= */

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [setting, setSetting] = useState<EmployeeSetting | null>(null);

  /* ================= FETCH SETTINGS ================= */

  const fetchSetting = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await EmployeeSettingService.getEmployeeSetting();
      // Handle different response structures (Axios response vs direct data)
      const body = response.data ? response.data : response;
      setSetting(body.data || body || null);
    } catch (err: any) {
      // Check for 404 status specifically
      if (err.response?.status === 404) {
        setSetting(null);
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch employee settings",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= UPDATE SETTINGS ================= */

  const updateSetting = async (employeeCodePrefix: string) => {
    if (!setting?.id) return false;

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await EmployeeSettingService.updateEmployeeSetting(
        setting.id,
        { employeeCodePrefix },
      );

      // Handle different response structures
      const body = response.data ? response.data : response;
      const updatedData = body.data || body;
      setSetting(updatedData || null);
      setSuccess(true);

      return true;
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update employee settings",
      );
      setSuccess(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /* ================= SAVE (UPDATE ONLY) ================= */

  const saveSetting = async (data: UpdateEmployeeSettingData) => {
    const prefix = data.employeeCodePrefix.trim() || "EMP";
    // Strictly update existing record. Backend ensures record exists on fetch.
    if (setting && setting.id) {
      return await updateSetting(prefix);
    }
    console.warn("Cannot save settings: No existing setting ID found.");
    return false;
  };

  /* ================= RESET ================= */

  const resetSettingState = () => {
    setError(null);
    setSuccess(false);
  };

  /* ================= INIT LOAD ================= */

  useEffect(() => {
    fetchSetting();
  }, []);

  /* ================= RETURN ================= */

  return {
    // state
    loading,
    error,
    success,
    setting,

    // actions
    fetchSetting,
    updateSetting,
    saveSetting,
    resetSettingState,
  };
}
