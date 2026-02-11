// import { api, ApiError } from "@/lib/axios";

// /* ================= ONBOARDING INTERFACES ================= */

// /**
//  * Full onboarding response
//  * (backend la include pannina relations ellam varum)
//  */
// export interface EmployeeOnboarding {
//   id: string;

//   // personal
//   first_name: string;
//   last_name: string;
//   employee_code: string;
//   work_email: string;
//   mobile: string;

//   // relations
//   addresses: any[];
//   emergencyContacts: any[];
//   employeeIdentity: any;
//   workDetail: any;
//   employeeTimeline: any;
//   projectMappings: any[];
//   additionalDetails: any[];
//   bankDetail: any;
//   payrollDetail: any;
//   experiences: any[];
//   documents: any[];
//   contacts: any[];
//   assets: any[];
// }

// /* ================= CREATE DTO ================= */

// /**
//  * Backend create() expect pannra full payload
//  * (personal + work + bank + payroll + history + assets)
//  */

// export interface CreateEmployeeOnboardingData {
//   personalDetails: Record<string, any>;
//   workDetail: Record<string, any>;
//   timeline: Record<string, any>;
//   bankDetail: Record<string, any>;
//   payrollDetail: Record<string, any>;
//   experiences?: any[];
//   documents?: any[];
//   contacts?: any[];
//   assets?: any[];
// }

// /* ================= EMPLOYEE ONBOARDING SERVICE ================= */

// export class EmployeeOnboardingService {
//   /**
//    * Create full employee onboarding
//    */
//   static async createOnboarding(
//     data: CreateEmployeeOnboardingData,
//   ): Promise<EmployeeOnboarding> {
//     try {
//       return await api.post<EmployeeOnboarding>(
//         "/api/employee-onboarding",
//         data,
//       );
//     } catch (error) {
//       if (error instanceof ApiError) {
//         throw new Error(error.message);
//       }
//       throw new Error("Failed to create employee onboarding");
//     }
//   }

//   /**
//    * Get full onboarding details by employeeId
//    */
//   static async getOnboardingByEmployeeId(
//     employeeId: string,
//   ): Promise<EmployeeOnboarding> {
//     try {
//       return await api.get<EmployeeOnboarding>(
//         `/api/employee-onboarding/${employeeId}`,
//       );
//     } catch (error) {
//       if (error instanceof ApiError) {
//         throw new Error(error.message);
//       }
//       throw new Error("Failed to fetch employee onboarding details");
//     }
//   }

//   /**
//    * Delete full onboarding by employeeId
//    */
//   static async deleteOnboarding(employeeId: string): Promise<void> {
//     try {
//       await api.delete(`/api/employee-onboarding/${employeeId}`);
//     } catch (error) {
//       if (error instanceof ApiError) {
//         throw new Error(error.message);
//       }
//       throw new Error("Failed to delete employee onboarding");
//     }
//   }
// }
import { api, ApiError } from "@/lib/axios";

/* ================= EMPLOYEE ONBOARDING SERVICE ================= */

export class EmployeeOnboardingService {
  /**
   * Create full employee onboarding
   */
  static async createEmployeeOnboarding(data: any): Promise<any> {
    try {
      return await api.post<any>("/api/onboarding", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to complete employee onboarding");
    }
  }
}
