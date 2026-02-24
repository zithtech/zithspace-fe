import { useCallback, useEffect, useState } from "react";
import {
  Employee,
  EmployeeService,
  CreateEmployeeData,
  UpdateEmployeeData,
} from "@/services/employeeServices";

/* =====================================================
   EMPLOYEE MAIN HOOK (LIST + CRUD + SELECT)
===================================================== */

export function useEmployee(employeeId?: string) {
  /* ================= STATES ================= */

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);

  const [selectOptions, setSelectOptions] = useState<
    Array<{ value: string; label: string; workEmail: string }>
  >([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= GET ALL EMPLOYEES ================= */

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await EmployeeService.getEmployees();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= GET EMPLOYEE BY ID ================= */

  const fetchEmployeeById = useCallback(async () => {
    if (!employeeId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await EmployeeService.getEmployeeById(employeeId);
      setEmployee(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch employee");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  /* ================= CREATE EMPLOYEE ================= */

  const createEmployee = async (data: CreateEmployeeData) => {
    try {
      setLoading(true);
      setError(null);

      const created = await EmployeeService.createEmployee(data);
      await fetchEmployees(); // refresh list
      return created;
    } catch (err: any) {
      setError(err.message || "Failed to create employee");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ================= UPDATE EMPLOYEE ================= */

  const updateEmployee = async (id: string, data: UpdateEmployeeData) => {
    try {
      setLoading(true);
      setError(null);

      const updated = await EmployeeService.updateEmployee(id, data);
      await fetchEmployees(); // refresh list
      return updated;
    } catch (err: any) {
      setError(err.message || "Failed to update employee");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE EMPLOYEE ================= */

  const deleteEmployee = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      await EmployeeService.deleteEmployee(id);
      await fetchEmployees(); // refresh list
    } catch (err: any) {
      setError(err.message || "Failed to delete employee");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ================= EMPLOYEES FOR SELECT ================= */

  const fetchEmployeesForSelect = useCallback(async () => {
    try {
      const data = await EmployeeService.getEmployeesForSelect();
      setSelectOptions(data);
    } catch (err) {
      console.error("Failed to load employee select options");
    }
  }, []);

  /* ================= AUTO LOAD ================= */

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchEmployeeById();
  }, [fetchEmployeeById]);

  useEffect(() => {
    fetchEmployeesForSelect();
  }, [fetchEmployeesForSelect]);

  /* ================= RETURN ================= */

  return {
    // data
    employees,
    employee,
    selectOptions,

    // state
    loading,
    error,

    // actions
    refreshEmployees: fetchEmployees,
    fetchEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
}
