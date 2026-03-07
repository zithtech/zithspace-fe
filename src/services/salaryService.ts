import { api } from "@/lib/axios";
import { EmployeeSalaryRecord } from "@/types/salary";

export const salaryService = {
    fetchEmployeeSalaries: async (): Promise<EmployeeSalaryRecord[]> => {
        return api.get("/api/employee-salary");
    },

    fetchSalaryDashboard: async (): Promise<any> => {
        return api.get("/api/employee-salary/dashboard");
    },

    addSalary: async (data: any): Promise<any> => {
        return api.post("/api/employee-salary", data);
    },

    updateEmployeeSalary: async (id: string, data: any): Promise<any> => {
        return api.put(`/api/employee-salary/${id}`, data);
    },

    deleteSalary: async (id: string): Promise<void> => {
        return api.delete(`/api/employee-salary/${id}`);
    },

    fetchSalaryStructures: async (): Promise<any[]> => {
        return api.get("/api/salary-structures");
    }
};
