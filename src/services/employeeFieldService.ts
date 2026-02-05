// import { api } from "@/lib/axios";

// export interface EmployeeField {
//   id: number;
//   companyId: number;
//   systemKey: string;
//   displayName: string;
//   isVisible: boolean;
// }

// /* ✅ CREATE TYPE */
// export interface CreateEmployeeFieldData {
//   companyId: number;
//   systemKey: string;
//   displayName?: string;
//   isVisible?: boolean;
// }

// /* ✅ UPDATE TYPE (MISSING BEFORE) */
// export interface UpdateEmployeeFieldData {
//   displayName: string;
// }

// export class EmployeeFieldService {
//   static async getFields(params: { companyId: number }) {
//     return api.get<EmployeeField[]>("/api/employee-fields", { params });
//   }

//   static async createField(data: CreateEmployeeFieldData) {
//     return api.post<EmployeeField>("/api/employee-fields", data);
//   }

//   static async updateField(
//     id: number,
//     data: UpdateEmployeeFieldData
//   ) {
//     return api.put<EmployeeField>(
//       `/api/employee-fields/${id}`,
//       data
//     );
//   }

//   static async toggleVisibility(id: number) {
//     return api.patch<EmployeeField>(
//       `/api/employee-fields/${id}/visibility`
//     );
//   }

//   static async deleteField(id: number) {
//     return api.delete(`/api/employee-fields/${id}`);
//   }
// }



// import { api, ApiError } from "@/lib/axios";
// import type { EmployeeField } from "@/types/employeeField";

// export interface CreateEmployeeFieldData {
//   companyId: number;
//   systemKey: string;
//   displayName?: string;
//   isVisible?: boolean;
// }

// export interface UpdateEmployeeFieldData {
//   displayName?: string;
// }

// export class EmployeeFieldService {
//   /** Get all fields (company scoped via header) */
//   static async getAll(companyId: number): Promise<EmployeeField[]> {
//     try {
//       return await api.get<EmployeeField[]>("/api/employee-fields", {
//         headers: {
//           "x-company-id": companyId,
//         },
//       });
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error("Failed to fetch employee fields");
//     }
//   }

//   /** Create field */
//   static async create(data: CreateEmployeeFieldData): Promise<EmployeeField> {
//     try {
//       return await api.post<EmployeeField>("/api/employee-fields", data);
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error("Failed to create employee field");
//     }
//   }

//   /** Update display name */
//   static async update(
//     id: number,
//     data: UpdateEmployeeFieldData,
//   ): Promise<EmployeeField> {
//     try {
//       return await api.put<EmployeeField>(
//         `/api/employee-fields/${id}`,
//         data,
//       );
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error("Failed to update employee field");
//     }
//   }

//   /** Toggle visibility */
//   static async toggleVisibility(id: number): Promise<EmployeeField> {
//     try {
//       return await api.patch<EmployeeField>(
//         `/api/employee-fields/${id}/visibility`,
//       );
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error("Failed to toggle visibility");
//     }
//   }

//   /** Delete field */
//   static async delete(id: number): Promise<void> {
//     try {
//       await api.delete(`/api/employee-fields/${id}`);
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error("Failed to delete employee field");
//     }
//   }
// }


import { api, apiUtils, ApiError } from "@/lib/axios";
import type {
  EmployeeField,
  CreateEmployeeFieldData,
  UpdateEmployeeFieldData,
  EmployeeFieldFilters,
} from "@/types/employeeField";

export class EmployeeFieldService {
  /**
   * Get all employee fields for a company
   */
  static async getAll(companyId: number): Promise<EmployeeField[]> {
    try {
      const headers = {
        'x-company-id': companyId.toString()
      };
      
      const response = await api.get<EmployeeField[]>("/api/employee-fields", { headers });
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch employee fields");
    }
  }

  /**
   * Create employee field
   */
  static async create(data: CreateEmployeeFieldData): Promise<EmployeeField> {
    try {
      const response = await api.post<EmployeeField>("/api/employee-fields", data);
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to create employee field");
    }
  }

  /**
   * Update employee field (display name only)
   */
  static async update(id: number, data: UpdateEmployeeFieldData): Promise<EmployeeField> {
    try {
      return await api.put<EmployeeField>(`/api/employee-fields/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update employee field");
    }
  }

  /**
   * Toggle field visibility
   */
  static async toggleVisibility(id: number): Promise<EmployeeField> {
    try {
      return await api.patch<EmployeeField>(`/api/employee-fields/${id}/visibility`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to toggle field visibility");
    }
  }

  /**
   * Delete employee field
   */
  static async delete(id: number): Promise<void> {
    try {
      await api.delete(`/api/employee-fields/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to delete employee field");
    }
  }
}