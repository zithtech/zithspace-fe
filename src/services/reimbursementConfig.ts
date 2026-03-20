














import { api, ApiError } from "@/lib/axios";

/* ================================
   TYPES
================================ */

export interface Approver {
  level: number;
  approverType: string;
  approverId?: string | null;
}

export interface ReimbursementConfiguration {
  id: string;
  origin: string;
  subOrigin: string;
  categoryType: string;
  amount: number;
  period: "MONTH" | "YEAR";
  status: "ACTIVE" | "INACTIVE";
  approvers: Approver[];
  monthlyAmount: number;
  yearlyAmount: number;
  policyId?: string; // Add if needed
  ruleId?: string;   // Add if needed
}

export interface CreateReimbursementConfigurationData {
  origin: string;
  subOrigin: string;
  categoryType: string;
  amount: number;
  period: "MONTH" | "YEAR";
  status?: "ACTIVE" | "INACTIVE";
  approvers?: Approver[];
}

export interface UpdateReimbursementConfigurationData
  extends Partial<CreateReimbursementConfigurationData> {}

/* ================================
   SERVICE
================================ */

export class ReimbursementConfigurationService {
  /** Get all */
  // static async getConfigurations(): Promise<ReimbursementConfiguration[]> {
  //   try {
  //     const response = await api.get('/api/reimbursement-configurations');

  //     // Handle different response structures
  //     if (response.data?.data && Array.isArray(response.data.data)) {
  //       return response.data.data;
  //     } else if (Array.isArray(response.data)) {
  //       return response.data;
  //     } else if (response.data?.success && response.data?.data) {
  //       return response.data.data;
  //     }

  //     return [];
  //   } catch (error) {
  //     if (error instanceof ApiError) throw new Error(error.message);
  //     throw new Error("Failed to fetch configurations");
  //   }
  // }
/** Get all */
static async getConfigurations(): Promise<ReimbursementConfiguration[]> {
  try {
    const response = await api.get('/api/reimbursement-configurations');
    
    console.log('Full response:', response); // Debug log

    // The response itself is already the array of configurations
    if (Array.isArray(response)) {
      console.log('Returning array directly:', response);
      return response;
    }
    
    // If response has data property that is array
    if (response && Array.isArray(response.data)) {
      return response.data;
    }
    
    // If response has success and data properties
    if (response?.success && Array.isArray(response?.data)) {
      return response.data;
    }

    console.warn('Unexpected response structure:', response);
    return [];
  } catch (error) {
    console.error('Error fetching configurations:', error);
    if (error instanceof ApiError) throw new Error(error.message);
    throw new Error("Failed to fetch configurations");
  }
}

  /** Get by ID */
  static async getConfigurationById(
    id: string
  ): Promise<ReimbursementConfiguration> {
    try {
      const response = await api.get(
        `/api/reimbursement-configurations/${id}`
      );

      // Handle different response structures
      if (response.data?.data) {
        return response.data.data;
      } else if (response.data) {
        return response.data;
      }

      throw new Error("Invalid response structure");
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error("Failed to fetch configuration");
    }
  }

  /** Create */
  // static async createConfiguration(
  //   data: CreateReimbursementConfigurationData
  // ): Promise<ReimbursementConfiguration> {
  //   try {
  //     const response = await api.post(
  //       '/api/reimbursement-configurations',
  //       data
  //     );

  //     console.log('Create response:', response.data); // Debug log

  //     // Handle different response structures
  //     if (response.data?.data) {
  //       return response.data.data;
  //     } else if (response.data) {
  //       // If the API returns the created object directly
  //       return response.data as ReimbursementConfiguration;
  //     }

  //     throw new Error("Invalid response structure");
  //   } catch (error) {
  //     console.error('Create configuration error:', error);
  //     if (error instanceof ApiError) {
  //       throw new Error(error.message);
  //     }
  //     throw new Error("Failed to create configuration");
  //   }
  // }
  /** Create */
/** Create */
/** Create */
static async createConfiguration(
  data: CreateReimbursementConfigurationData
): Promise<ReimbursementConfiguration> {
  try {
    const response = await api.post('/api/reimbursement-configurations', data);
    
    console.log('Create response:', response); // Debug log

    // The response might be the created object directly
    if (response && response.id) {
      return response;
    }
    
    // If response has data property with the created object
    if (response?.data && response.data.id) {
      return response.data;
    }
    
    // If response has success and data properties
    if (response?.success && response?.data) {
      return response.data;
    }

    throw new Error("Invalid response structure");
  } catch (error) {
    console.error('Create configuration error:', error);
    if (error instanceof ApiError) throw new Error(error.message);
    throw new Error("Failed to create configuration");
  }
}
  /** Update */
  // static async updateConfiguration(
  //   id: string,
  //   data: UpdateReimbursementConfigurationData
  // ): Promise<void> {
  //   try {
  //     const response = await api.put(`/api/reimbursement-configurations/${id}`, data);
  //     console.log('Update response:', response.data); // Debug log
      
  //     // You might not need to return anything for update
  //     return;
  //   } catch (error) {
  //     console.error('Update configuration error:', error);
  //     if (error instanceof ApiError) throw new Error(error.message);
  //     throw new Error("Failed to update configuration");
  //   }
  // }
  /** Update */
static async updateConfiguration(
  id: string,
  data: UpdateReimbursementConfigurationData
): Promise<void> {
  try {
    const response = await api.put(`/api/reimbursement-configurations/${id}`, data);
    console.log('Update response:', response); // Debug log
    return;
  } catch (error) {
    console.error('Update configuration error:', error);
    if (error instanceof ApiError) throw new Error(error.message);
    throw new Error("Failed to update configuration");
  }
}

  /** Delete (Soft delete) */
  // static async deleteConfiguration(id: string): Promise<void> {
  //   try {
  //     const response = await api.delete(`/api/reimbursement-configurations/${id}`);
  //     console.log('Delete response:', response.data); // Debug log
  //   } catch (error) {
  //     console.error('Delete configuration error:', error);
  //     if (error instanceof ApiError) throw new Error(error.message);
  //     throw new Error("Failed to delete configuration");
  //   }
  // }
  /** Delete (Soft delete) */
// static async deleteConfiguration(id: string): Promise<void> {
//   try {
//     const response = await api.delete(`/api/reimbursement-configurations/${id}`);
//     console.log('Delete response:', response); // Debug log
//   } catch (error) {
//     console.error('Delete configuration error:', error);
//     if (error instanceof ApiError) throw new Error(error.message);
//     throw new Error("Failed to delete configuration");
//   }
// }
/** Delete (Hard Delete) */
static async deleteConfiguration(id: string): Promise<void> {
  try {
    const response = await api.delete(`/api/reimbursement-configurations/${id}`);
    console.log('Delete response:', response); // Debug log
  } catch (error) {
    console.error('Delete configuration error:', error);
    if (error instanceof ApiError) throw new Error(error.message);
    throw new Error("Failed to delete configuration");
  }
}
}