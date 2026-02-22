import { api } from "@/lib/axios";
import { EmployeeSalaryRecord } from "../types/salary";

export const salaryService = {
    /**
     * Fetch all employee salary records
     */
    fetchEmployeeSalaries: async (): Promise<EmployeeSalaryRecord[]> => {
        return api.get<EmployeeSalaryRecord[]>("/api/employee-salary");
    },

    /**
     * Add a new salary record for an employee
     */
    addSalary: async (
        payload: Partial<EmployeeSalaryRecord>
    ): Promise<EmployeeSalaryRecord> => {
        return api.post<EmployeeSalaryRecord>("/api/employee-salary", payload);
    },

    /**
     * Update an existing salary record
     */
    updateEmployeeSalary: async (
        id: string,
        payload: Partial<EmployeeSalaryRecord>
    ): Promise<EmployeeSalaryRecord> => {
        return api.put<EmployeeSalaryRecord>(`/api/employee-salary/${id}`, payload);
    },

    /**
     * Delete a salary record
     */
    deleteSalary: async (id: string): Promise<void> => {
        return api.delete(`/api/employee-salary/${id}`);
    },

    /**
     * Fetch dashboard summary for salaries
     */
    fetchSalaryDashboard: async (): Promise<any> => {
        return api.get("/api/employee-salary/dashboard");
    },

    /**
     * Fetch all available salary structures
     */
    fetchSalaryStructures: async (): Promise<any[]> => {
        return api.get("/api/salary-structures");
    }
};
