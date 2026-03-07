

// import { api, ApiError } from '@/lib/axios';

// /* ================================
//    TYPES
// ================================ */

// export interface ReimbursementConfiguration {
//   id: string;
//   tenantId: string;
//   origin: string;
//   subOrigin: string;
//   categoryType: string;
//   amount: number;
//   period: 'MONTH' | 'YEAR';
//   status: string;
//   monthlyAmount?: number;
//   yearlyAmount?: number;
//   createdById: string;
//   updatedById?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface CreateReimbursementConfigData {
//   origin: string;
//   subOrigin: string;
//   categoryType: string;
//   amount: number;
//   period: 'MONTH' | 'YEAR';
//   status?: string;
// }

// export interface UpdateReimbursementConfigData
//   extends Partial<CreateReimbursementConfigData> {}

// /* ================================
//    SERVICE
// ================================ */

// export class ReimbursementService {
//   /** Get all reimbursement configs */
//   static async getConfigs(): Promise<ReimbursementConfiguration[]> {
//     try {
//       const response = await api.get('/api/reimbursement-configurations');
      
//       // Log the full response for debugging
//       console.log('Full API Response:', response);
//       console.log('Response data:', response.data);
      
//       // The API is returning the array directly
//       if (Array.isArray(response)) {
//         console.log('Response is array directly:', response);
//         return response;
//       }
      
//       // If response has data property that is array
//       if (response.data && Array.isArray(response.data)) {
//         console.log('Response.data is array:', response.data);
//         return response.data;
//       }
      
//       // If response is the array itself
//       if (Array.isArray(response)) {
//         return response;
//       }
      
//       console.error('Unexpected response structure:', response);
//       return [];
//     } catch (error) {
//       console.error('Error in getConfigs:', error);
//       if (error instanceof ApiError) {
//         throw new Error(error.message);
//       }
//       throw new Error('Failed to fetch reimbursement configurations');
//     }
//   }

//   /** Get config by ID */
//   static async getConfigById(id: string): Promise<ReimbursementConfiguration> {
//     try {
//       const response = await api.get(`/api/reimbursement-configurations/${id}`);
      
//       if (response && typeof response === 'object') {
//         return response as ReimbursementConfiguration;
//       }
//       if (response.data && typeof response.data === 'object') {
//         return response.data as ReimbursementConfiguration;
//       }
//       throw new Error('Invalid response structure');
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error('Failed to fetch reimbursement configuration');
//     }
//   }

//   /** Create new config */
//   static async createConfig(
//     data: CreateReimbursementConfigData
//   ): Promise<ReimbursementConfiguration> {
//     try {
//       const response = await api.post('/api/reimbursement-configurations', data);
      
//       if (response && typeof response === 'object' && 'id' in response) {
//         return response as ReimbursementConfiguration;
//       }
//       if (response.data && typeof response.data === 'object') {
//         return response.data as ReimbursementConfiguration;
//       }
//       throw new Error('Invalid response structure');
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error('Failed to create reimbursement configuration');
//     }
//   }

//   /** Update config */
//   static async updateConfig(
//     id: string,
//     data: UpdateReimbursementConfigData
//   ): Promise<ReimbursementConfiguration> {
//     try {
//       const response = await api.put(`/api/reimbursement-configurations/${id}`, data);
      
//       if (response && typeof response === 'object' && 'id' in response) {
//         return response as ReimbursementConfiguration;
//       }
//       if (response.data && typeof response.data === 'object') {
//         return response.data as ReimbursementConfiguration;
//       }
//       throw new Error('Invalid response structure');
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error('Failed to update reimbursement configuration');
//     }
//   }

//   /** Delete config */
//   static async deleteConfig(id: string): Promise<void> {
//     try {
//       await api.delete(`/api/reimbursement-configurations/${id}`);
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error('Failed to delete reimbursement configuration');
//     }
//   }
// }










































// import { api, ApiError } from '@/lib/axios';

// /* =========================================================
//    TYPES
// ========================================================= */

// export type OriginType =
//   | 'position'
//   | 'grade'
//   | 'department'
//   | 'employee';

// export type PeriodType = 'MONTH' | 'YEAR';

// export type ApproverType =
//   | 'manager'
//   | 'role'
//   | 'specific_employee';

// /* ------------------------------
//    APPROVER
// -------------------------------- */
// export interface PolicyApprover {
//   id?: string;
//   level: number;
//   approverType: ApproverType;
//   approverId?: string | null;

//   createdById?: string;
//   updatedById?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

// /* ------------------------------
//    RULE
// -------------------------------- */
// export interface PolicyRule {
//   id?: string;
//   categoryId: string;
//   maxAmount: number;
//   periodType: PeriodType;
//   isActive?: boolean;

//   approvers: PolicyApprover[];

//   createdById?: string;
//   updatedById?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

// /* ------------------------------
//    POLICY
// -------------------------------- */
// export interface ReimbursementPolicy {
//   id: string;
//   tenantId?: string;

//   originType: OriginType;
//   originId: string;
//   isActive: boolean;

//   rules: PolicyRule[];

//   createdById: string;
//   updatedById?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// /* =========================================================
//    CREATE / UPDATE PAYLOADS
// ========================================================= */

// export interface CreateReimbursementPolicyData {
//   originType: OriginType;
//   originId: string;
//   isActive?: boolean;

//   rules: {
//     categoryId: string;
//     maxAmount: number;
//     periodType: PeriodType;
//     isActive?: boolean;

//     approvers: {
//       level: number;
//       approverType: ApproverType;
//       approverId?: string | null;
//     }[];
//   }[];
// }

// export interface UpdateReimbursementPolicyData
//   extends Partial<CreateReimbursementPolicyData> {}

// /* =========================================================
//    SERVICE
// ========================================================= */

// export class ReimbursementService {
//   /* ======================================================
//      GET ALL POLICIES
//   ====================================================== */
//   static async getConfigs(): Promise<ReimbursementPolicy[]> {
//     try {
//       const response = await api.get('/api/reimbursements');

//       if (response?.data) {
//         return response.data;
//       }

//       return response;
//     } catch (error) {
//       console.error('Error fetching reimbursement policies:', error);

//       if (error instanceof ApiError) {
//         throw new Error(error.message);
//       }

//       throw new Error('Failed to fetch reimbursement policies');
//     }
//   }

//   /* ======================================================
//      GET POLICY BY ID
//   ====================================================== */
//   static async getConfigById(
//     id: string
//   ): Promise<ReimbursementPolicy> {
//     try {
//       const response = await api.get(`/api/reimbursements/${id}`);

//       if (response?.data) {
//         return response.data;
//       }

//       return response;
//     } catch (error) {
//       console.error('Error fetching reimbursement policy:', error);

//       if (error instanceof ApiError) {
//         throw new Error(error.message);
//       }

//       throw new Error('Failed to fetch reimbursement policy');
//     }
//   }

//   /* ======================================================
//      CREATE POLICY (Nested)
//   ====================================================== */
//   static async createConfig(
//     data: CreateReimbursementPolicyData
//   ): Promise<ReimbursementPolicy> {
//     try {
//       const response = await api.post(
//         '/api/reimbursements',
//         data
//       );

//       if (response?.data) {
//         return response.data;
//       }

//       return response;
//     } catch (error) {
//       console.error('Error creating reimbursement policy:', error);

//       if (error instanceof ApiError) {
//         throw new Error(error.message);
//       }

//       throw new Error('Failed to create reimbursement policy');
//     }
//   }

//   /* ======================================================
//      UPDATE POLICY
//   ====================================================== */
//   static async updateConfig(
//     id: string,
//     data: UpdateReimbursementPolicyData
//   ): Promise<ReimbursementPolicy> {
//     try {
//       const response = await api.put(
//         `/api/reimbursements/${id}`,
//         data
//       );

//       if (response?.data) {
//         return response.data;
//       }

//       return response;
//     } catch (error) {
//       console.error('Error updating reimbursement policy:', error);

//       if (error instanceof ApiError) {
//         throw new Error(error.message);
//       }

//       throw new Error('Failed to update reimbursement policy');
//     }
//   }

//   /* ======================================================
//      DELETE POLICY
//   ====================================================== */
//   static async deleteConfig(id: string): Promise<void> {
//     try {
//       await api.delete(`/api/reimbursements/${id}`);
//     } catch (error) {
//       console.error('Error deleting reimbursement policy:', error);

//       if (error instanceof ApiError) {
//         throw new Error(error.message);
//       }

//       throw new Error('Failed to delete reimbursement policy');
//     }
//   }
// }

// import { api, ApiError } from '@/lib/axios';

// /* =========================================================
//    TYPES
// ========================================================= */

// export type OriginType = 
//   | 'Grade' 
//   | 'Department' 
//   | 'Sub-department' 
//   | 'Position' 
//   | 'User';

// export type PeriodType = 'MONTH' | 'YEAR';

// export type ApproverType = 'manager' | 'role' | 'specific_employee';

// /* ------------------------------
//    APPROVER
// -------------------------------- */
// export interface PolicyApprover {
//   id?: string;
//   level: number;
//   approverType: ApproverType;
//   approverId?: string | null;
//   policyRuleId?: string;
//   createdById?: string;
//   updatedById?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

// /* ------------------------------
//    RULE
// -------------------------------- */
// export interface PolicyRule {
//   id?: string;
//   policyId?: string;
//   categoryId: string;
//   maxAmount: number;
//   periodType: PeriodType;
//   isActive?: boolean;
//   approvers: PolicyApprover[];
//   createdById?: string;
//   updatedById?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

// /* ------------------------------
//    POLICY
// -------------------------------- */
// export interface ReimbursementPolicy {
//   id: string;
//   tenantId?: string;
//   originType: OriginType;
//   originId: string;
//   isActive: boolean;
//   rules: PolicyRule[];
//   createdById: string;
//   updatedById?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// /* ------------------------------
//    FRONTEND CONFIG TYPE
// -------------------------------- */
// export interface ReimbursementConfig {
//   id: string;
//   origin: string;
//   subOrigin: string;
//   subOriginId: string;
//   categoryType: string;
//   amount: number;
//   period: PeriodType;
//   status: 'ACTIVE' | 'INACTIVE';
//   monthlyAmount?: number;
//   yearlyAmount?: number;
//   ruleId?: string;
//   policyId?: string;
// }

// /* =========================================================
//    API PAYLOADS
// ========================================================= */

// export interface CreateReimbursementPolicyData {
//   origin: OriginType;
//   subOrigin: string;
//   categoryType: string;
//   amount: number;
//   period: PeriodType;
//   status: 'ACTIVE' | 'INACTIVE';
//   approvers?: Array<{
//     level: number;
//     approverType: ApproverType;
//     approverId?: string | null;
//   }>;
// }

// export interface UpdateReimbursementPolicyData extends Partial<CreateReimbursementPolicyData> {}

// /* =========================================================
//    SERVICE
// ========================================================= */

// export class ReimbursementService {
  
//   /**
//    * Transform backend policy + rules to frontend configs
//    */
//   private static transformPolicyToConfigs(policy: ReimbursementPolicy): ReimbursementConfig[] {
//     return policy.rules.map(rule => {
//       let monthlyAmount = 0;
//       let yearlyAmount = 0;

//       if (rule.periodType === 'MONTH') {
//         monthlyAmount = Number(rule.maxAmount);
//         yearlyAmount = Number(rule.maxAmount) * 12;
//       } else {
//         yearlyAmount = Number(rule.maxAmount);
//         monthlyAmount = Number(rule.maxAmount) / 12;
//       }

//       return {
//         id: rule.id || policy.id,
//         origin: policy.originType,
//         subOrigin: policy.originId,
//         subOriginId: policy.originId,
//         categoryType: rule.categoryId,
//         amount: Number(rule.maxAmount),
//         period: rule.periodType,
//         status: policy.isActive && rule.isActive !== false ? 'ACTIVE' : 'INACTIVE',
//         monthlyAmount,
//         yearlyAmount,
//         ruleId: rule.id,
//         policyId: policy.id,
//       };
//     });
//   }

//   /* ======================================================
//      GET ALL CONFIGS
//   ====================================================== */
//   static async getConfigs(): Promise<ReimbursementConfig[]> {
//     try {
//       const response = await api.get('/api/reimbursement-configurations');
      
//       let policies: ReimbursementPolicy[] = [];
      
//       if (response?.data?.data) {
//         policies = response.data.data;
//       } else if (Array.isArray(response?.data)) {
//         policies = response.data;
//       } else if (response?.data) {
//         policies = [response.data];
//       }

//       const allConfigs: ReimbursementConfig[] = [];
      
//       for (const policy of policies) {
//         const configs = this.transformPolicyToConfigs(policy);
//         allConfigs.push(...configs);
//       }

//       return allConfigs;
//     } catch (error) {
//       console.error('Error fetching reimbursement policies:', error);
//       if (error instanceof ApiError) {
//         throw new Error(error.message);
//       }
//       throw new Error('Failed to fetch reimbursement policies');
//     }
//   }

//   /* ======================================================
//      GET CONFIG BY ID
//   ====================================================== */
//   static async getConfigById(id: string): Promise<ReimbursementConfig> {
//     try {
//       const response = await api.get(`/api/reimbursement-configurations/${id}`);
      
//       let policy: ReimbursementPolicy;
      
//       if (response?.data?.data) {
//         policy = response.data.data;
//       } else if (response?.data) {
//         policy = response.data;
//       } else {
//         throw new Error('Configuration not found');
//       }

//       const configs = this.transformPolicyToConfigs(policy);
//       const config = configs.find(c => c.id === id || c.ruleId === id);
      
//       if (!config) {
//         throw new Error('Configuration not found');
//       }

//       return config;
//     } catch (error) {
//       console.error('Error fetching reimbursement policy:', error);
//       if (error instanceof ApiError) {
//         throw new Error(error.message);
//       }
//       throw new Error('Failed to fetch reimbursement policy');
//     }
//   }

//   /* ======================================================
//      CREATE CONFIG - Fixed with items array
//   ====================================================== */
//   static async createConfig(
//     data: CreateReimbursementPolicyData
//   ): Promise<ReimbursementConfig> {
//     try {
//       // Backend expects items array
//       const payload = {
//         items: [{
//           origin: data.origin,
//           subOrigin: data.subOrigin,
//           categoryType: data.categoryType,
//           amount: Number(data.amount),
//           period: data.period,
//           status: data.status,
//           approvers: data.approvers || [
//             { level: 1, approverType: 'manager', approverId: null },
//             { level: 2, approverType: 'role', approverId: null },
//             { level: 3, approverType: 'specific_employee', approverId: null },
//           ],
//         }]
//       };

//       console.log('Creating config with payload:', JSON.stringify(payload, null, 2));
      
//       const response = await api.post('/api/reimbursement-configurations', payload);
      
//       let policy: ReimbursementPolicy;
      
//       if (response?.data?.data) {
//         policy = response.data.data;
//       } else if (response?.data) {
//         policy = response.data;
//       } else {
//         throw new Error('Failed to create configuration');
//       }

//       const configs = this.transformPolicyToConfigs(policy);
//       return configs[0];
//     } catch (error) {
//       console.error('Error creating reimbursement policy:', error);
//       if (error instanceof ApiError) {
//         throw new Error(error.message);
//       }
//       throw new Error('Failed to create reimbursement policy');
//     }
//   }

//   /* ======================================================
//      CREATE BULK CONFIGS
//   ====================================================== */
//   static async createBulkConfigs(
//     configs: CreateReimbursementPolicyData[]
//   ): Promise<ReimbursementConfig[]> {
//     try {
//       const items = configs.map(data => ({
//         origin: data.origin,
//         subOrigin: data.subOrigin,
//         categoryType: data.categoryType,
//         amount: Number(data.amount),
//         period: data.period,
//         status: data.status,
//         approvers: data.approvers || [
//           { level: 1, approverType: 'manager', approverId: null },
//           { level: 2, approverType: 'role', approverId: null },
//           { level: 3, approverType: 'specific_employee', approverId: null },
//         ],
//       }));

//       const payload = { items };

//       console.log('Creating bulk configs with payload:', JSON.stringify(payload, null, 2));
      
//       const response = await api.post('/api/reimbursement-configurations', payload);
      
//       let policies: ReimbursementPolicy[];
      
//       if (response?.data?.data) {
//         policies = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
//       } else if (Array.isArray(response?.data)) {
//         policies = response.data;
//       } else {
//         throw new Error('Failed to create configurations');
//       }

//       const allConfigs: ReimbursementConfig[] = [];
//       for (const policy of policies) {
//         const configs = this.transformPolicyToConfigs(policy);
//         allConfigs.push(...configs);
//       }

//       return allConfigs;
//     } catch (error) {
//       console.error('Error creating reimbursement policies:', error);
//       if (error instanceof ApiError) {
//         throw new Error(error.message);
//       }
//       throw new Error('Failed to create reimbursement policies');
//     }
//   }

//   /* ======================================================
//      UPDATE CONFIG
//   ====================================================== */
//   static async updateConfig(
//     id: string,
//     data: UpdateReimbursementPolicyData
//   ): Promise<ReimbursementConfig> {
//     try {
//       // Backend expects items array for update as well
//       const payload = {
//         items: [{
//           origin: data.origin,
//           subOrigin: data.subOrigin,
//           categoryType: data.categoryType,
//           amount: Number(data.amount),
//           period: data.period,
//           status: data.status,
//           approvers: data.approvers || [
//             { level: 1, approverType: 'manager', approverId: null },
//             { level: 2, approverType: 'role', approverId: null },
//             { level: 3, approverType: 'specific_employee', approverId: null },
//           ],
//         }]
//       };

//       console.log('Updating config with payload:', JSON.stringify(payload, null, 2));
      
//       const response = await api.put(`/api/reimbursement-configurations/${id}`, payload);
      
//       let policy: ReimbursementPolicy;
      
//       if (response?.data?.data) {
//         policy = response.data.data;
//       } else if (response?.data) {
//         policy = response.data;
//       } else {
//         throw new Error('Failed to update configuration');
//       }

//       const configs = this.transformPolicyToConfigs(policy);
//       const config = configs.find(c => c.id === id || c.ruleId === id);
      
//       if (!config) {
//         throw new Error('Updated configuration not found');
//       }

//       return config;
//     } catch (error) {
//       console.error('Error updating reimbursement policy:', error);
//       if (error instanceof ApiError) {
//         throw new Error(error.message);
//       }
//       throw new Error('Failed to update reimbursement policy');
//     }
//   }

//   /* ======================================================
//      DELETE CONFIG
//   ====================================================== */
//   static async deleteConfig(id: string): Promise<void> {
//     try {
//       await api.delete(`/api/reimbursements/${id}`);
//     } catch (error) {
//       console.error('Error deleting reimbursement policy:', error);
//       if (error instanceof ApiError) {
//         throw new Error(error.message);
//       }
//       throw new Error('Failed to delete reimbursement policy');
//     }
//   }
// }





























// import { api, ApiError } from "@/lib/axios";

// /* ================================
//    TYPES
// ================================ */

// export interface Approver {
//   level: number;
//   approverType: string;
//   approverId?: string | null;
// }

// export interface ReimbursementConfiguration {
//   id: string;
//   origin: string;
//   subOrigin: string;
//   categoryType: string;
//   amount: number;
//   period: "MONTH" | "YEAR";
//   status: "ACTIVE" | "INACTIVE";
//   approvers: Approver[];
//   monthlyAmount: number;
//   yearlyAmount: number;
// }

// export interface CreateReimbursementConfigurationData {
//   origin: string;
//   subOrigin: string;
//   categoryType: string;
//   amount: number;
//   period: "MONTH" | "YEAR";
//   status?: "ACTIVE" | "INACTIVE";
//   approvers?: Approver[];
// }

// export interface UpdateReimbursementConfigurationData
//   extends Partial<CreateReimbursementConfigurationData> {}

// /* ================================
//    SERVICE
// ================================ */

// export class ReimbursementConfigurationService {
//   /** Get all */
//   static async getConfigurations(): Promise<ReimbursementConfiguration[]> {
//     try {
//       const response = await api.get('/api/reimbursement-configurations');

//       if (response.data && Array.isArray(response.data.data)) {
//         return response.data.data;
//       }

//       return [];
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error("Failed to fetch configurations");
//     }
//   }

//   /** Get by ID */
//   static async getConfigurationById(
//     id: string
//   ): Promise<ReimbursementConfiguration> {
//     try {
//       const response = await api.get(
//         `/api/reimbursement-configurations/${id}`
//       );

//       if (response.data?.data) {
//         return response.data.data;
//       }

//       throw new Error("Invalid response structure");
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error("Failed to fetch configuration");
//     }
//   }

//   /** Create */
//   static async createConfiguration(
//     data: CreateReimbursementConfigurationData
//   ): Promise<ReimbursementConfiguration> {
//     try {
//       const response = await api.post(
//         '/api/reimbursement-configurations',
//         data
//       );

//       if (response.data?.data) {
//         return response.data.data;
//       }

//       throw new Error("Invalid response structure");
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error("Failed to create configuration");
//     }
//   }

//   /** Update */
//   static async updateConfiguration(
//     id: string,
//     data: UpdateReimbursementConfigurationData
//   ): Promise<void> {
//     try {
//       await api.put(`/api/reimbursement-configurations/${id}`, data);
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error("Failed to update configuration");
//     }
//   }

//   /** Delete (Soft delete) */
//   static async deleteConfiguration(id: string): Promise<void> {
//     try {
//       await api.delete(`/api/reimbursement-configurations/${id}`);
//     } catch (error) {
//       if (error instanceof ApiError) throw new Error(error.message);
//       throw new Error("Failed to delete configuration");
//     }
//   }
// }















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