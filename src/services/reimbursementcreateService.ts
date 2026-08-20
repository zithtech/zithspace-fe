// services/reimbursementService.ts
import { api, ApiError } from "@/lib/axios";

/* ================================
   TYPES
================================ */

export interface ReimbursementItem {
  category: string;
  date: string;        // ISO string
  billNo: string;
  amount: number;
  description: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}
export interface CategoryLimit {
  categoryId: string;
  maxAmount: number;
  periodType: "MONTH" | "YEAR";
}

export interface ReimbursementResponse {
  id: string;
  tenantId: string;
  employeeId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    category: string;
    date: string;
    billNo: string;
    amount: number;
    description: string;
    attachments: Attachment[];
  }[];
    createdBy?: {
    id: string;
    name: string;
    email?: string;
    employee?: {
      employee_code: string;
      first_name?: string;
      last_name?: string;
    };
  };
  employeeName?: string; // If directly available
  employeeCode?: string; // If directly available
}


/* ================================
   CREATE DTO
================================ */

export interface CreateReimbursementData {
  items: ReimbursementItem[];
  files: File[];
  status?: "DRAFT" | "SUBMITTED";
}

export interface UpdateReimbursementData {
  status?: "DRAFT" | "SUBMITTED";
   items?: ReimbursementItem[];  // allow updating items
  files?: File[]; 
}

/* ================================
   SERVICE
================================ */

export class ReimbursementService {
 







static async createReimbursement(
  data: CreateReimbursementData
): Promise<ReimbursementResponse> {
  try {
    const formData = new FormData();

    // Send items as JSON string - this will be parsed in API route
    formData.append("items", JSON.stringify(data.items));

    // Append all files
    data.files.forEach((file) => {
      formData.append("files", file);
    });

    // Optional status
    if (data.status) formData.append("status", data.status);

    // Log the FormData contents for debugging
    console.log("📦 Sending FormData:");
    console.log("- items:", JSON.stringify(data.items, null, 2));
    console.log("- files:", data.files.map(f => f.name));
    console.log("- status:", data.status);

    const response = await api.post("/api/reimbursements", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("📦 API Response:", response); // Debug log

    // Handle different response structures
    // Case 1: response.data.data exists (your expected structure)
    if (response.data?.data) {
      return response.data.data as ReimbursementResponse;
    }
    
    // Case 2: response.data is the actual data
    if (response.data) {
      return response.data as ReimbursementResponse;
    }
    
    // Case 3: response itself is the data
    if (response && response.id) {
      return response as ReimbursementResponse;
    }

    throw new Error("Invalid response structure from server");
  } catch (error: any) {
    console.error("Create reimbursement error:", error);
    if (error instanceof ApiError) throw error;
    
    // Better error message
    const errorMessage = error?.response?.data?.error || 
                        error?.message || 
                        "Failed to create reimbursement";
    throw new Error(errorMessage);
  }
}
 
/** Get all reimbursements */
static async getAllReimbursements(): Promise<ReimbursementResponse[]> {
  try {
    const response = await api.get("/api/reimbursements");
    
    // Debug log to see the actual response structure
    console.log('📦 getAllReimbursements response:', response);
    console.log('📦 response.data:', response.data);
    
    // Handle different response structures
    
    // Case 1: response.data is directly the array
    if (Array.isArray(response.data)) {
      console.log('✅ Case 1: response.data is array');
      return response.data as ReimbursementResponse[];
    }
    
    // Case 2: response.data has data property that is array
    if (response.data && Array.isArray(response.data.data)) {
      console.log('✅ Case 2: response.data.data is array');
      return response.data.data as ReimbursementResponse[];
    }
    
    // Case 3: response.data has success and data properties
    if (response.data && response.data.success === true) {
      if (Array.isArray(response.data.data)) {
        console.log('✅ Case 3: response.data.data is array');
        return response.data.data as ReimbursementResponse[];
      }
    }
    
    // Case 4: response itself is the array
    if (Array.isArray(response)) {
      console.log('✅ Case 4: response is array');
      return response as ReimbursementResponse[];
    }
    
    // If no valid data found, return empty array
    console.log('⚠️ No valid data found, response structure:', response.data);
    return [];
    
  } catch (error: any) {
    console.error("Get all reimbursements error:", error);
    if (error instanceof ApiError) throw error;
    throw new Error(error?.response?.data?.error || "Failed to fetch reimbursements");
  }
}

  
/** Get reimbursement by ID */
static async getReimbursementById(id: string): Promise<ReimbursementResponse> {
  try {
    console.log(`🔍 Getting reimbursement by ID: ${id}`);
    
    const response = await api.get(`/api/reimbursements/${id}`);
    
    // DEBUG: Log the ENTIRE response
    console.log('📦 FULL API RESPONSE:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      config: response.config
    });
    
    console.log('📦 response.data type:', typeof response.data);
    console.log('📦 response.data keys:', response.data ? Object.keys(response.data) : 'no keys');
    
    // Handle different response structures
    
    // Case 1: response.data is the reimbursement object directly
    if (response.data && response.data.id && response.data.items) {
      console.log('✅ Case 1: response.data is the reimbursement object');
      return response.data as ReimbursementResponse;
    }
    
    // Case 2: response.data has success and data properties
    if (response.data && response.data.success === true) {
      console.log('✅ Case 2: response has success: true');
      
      if (response.data.data) {
        console.log('📦 response.data.data:', response.data.data);
        
        // Check if response.data.data has the reimbursement
        if (response.data.data.id && response.data.data.items) {
          console.log('✅ response.data.data is the reimbursement object');
          return response.data.data as ReimbursementResponse;
        }
        
        // Check if response.data.data is the reimbursement object
        return response.data.data as ReimbursementResponse;
      }
    }
    
    // Case 3: response.data has data property that is the reimbursement
    if (response.data && response.data.data) {
      console.log('✅ Case 3: response.data.data exists');
      
      if (response.data.data.id && response.data.data.items) {
        console.log('✅ response.data.data has id and items');
        return response.data.data as ReimbursementResponse;
      }
      
      return response.data.data as ReimbursementResponse;
    }
    
    // Case 4: response itself might be the data (unlikely with axios)
    if (response && response.id && response.items) {
      console.log('✅ Case 4: response itself is the reimbursement');
      return response as unknown as ReimbursementResponse;
    }
    
    // If we can't find the data, throw a clear error
    console.error('❌ Unexpected response structure:', response);
    throw new Error('Unexpected response structure from API');
    
  } catch (error: any) {
    console.error(`❌ Get reimbursement by ID (${id}) error:`, error);
    if (error instanceof ApiError) throw error;
    throw new Error(error?.response?.data?.error || "Failed to fetch reimbursement");
  }
}



















static async updateReimbursement(
  id: string,
  data: UpdateReimbursementData
): Promise<ReimbursementResponse> {
  try {
    const formData = new FormData();

    // Append status (even if empty)
    formData.append("status", data.status || "");
    
    // Append items (always stringify, even if empty)
    const itemsString = data.items ? JSON.stringify(data.items) : "[]";
    formData.append("items", itemsString);
    
    // Append files if they exist
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append("files", file);
      });
    }

    console.log(`📦 Updating reimbursement ${id} with:`);
    console.log("- status:", data.status);
    console.log("- items:", itemsString);
    console.log("- files count:", data.files?.length || 0);

    const response = await api.put(`/api/reimbursements/${id}`, formData, {
      headers: { 
        "Content-Type": "multipart/form-data" 
      },
    });

    console.log('✅ Full response:', response);
    console.log('✅ response.data:', response.data);

    // Your API returns: { success: true, data: reimbursement, message: "..." }
    // Check if response.data has success and data properties
    if (response.data && response.data.success === true && response.data.data) {
      console.log('✅ Found data in response.data.data');
      return response.data.data as ReimbursementResponse;
    }
    
    // If response.data itself is the reimbursement object
    if (response.data && response.data.id) {
      console.log('✅ response.data is the reimbursement object');
      return response.data as ReimbursementResponse;
    }
    
    // If response itself is the reimbursement object (unlikely but check)
    if (response && response.id) {
      console.log('✅ response is the reimbursement object');
      return response as unknown as ReimbursementResponse;
    }
    
    console.error('❌ Unexpected response structure:', response.data);
    throw new Error('Unexpected response structure from API');
    
  } catch (error: any) {
    console.error(`❌ Update reimbursement (${id}) error:`, error);
    if (error instanceof ApiError) throw error;
    throw new Error(
      error?.response?.data?.error || "Failed to update reimbursement"
    );
  }
}



  /** Delete reimbursement */
  static async deleteReimbursement(id: string): Promise<void> {
    try {
      await api.delete(`/api/reimbursements/${id}`);
    } catch (error: any) {
      console.error(`Delete reimbursement (${id}) error:`, error);
      if (error instanceof ApiError) throw error;
      throw new Error(error?.response?.data?.error || "Failed to delete reimbursement");
    }
  }

























static async getUserCategoryLimits(): Promise<CategoryLimit[]> {
  try {
    const response = await api.get("/api/reimbursements/user/limits");
    
    // DEBUG: Log the ENTIRE response object
    console.log('📦 FULL RESPONSE OBJECT:', JSON.stringify(response, null, 2));
    console.log('📦 response.status:', response.status);
    console.log('📦 response.data:', response.data);
    console.log('📦 response.config:', response.config);
    
    // Try different possible response structures
    // Case 1: response itself is the data array
    if (Array.isArray(response)) {
      console.log('✅ Case 1: response is array');
      return response as CategoryLimit[];
    }
    
    // Case 2: response.data is the data array
    if (response.data && Array.isArray(response.data)) {
      console.log('✅ Case 2: response.data is array');
      return response.data as CategoryLimit[];
    }
    
    // Case 3: response.data has success and data properties
    if (response.data && response.data.success === true) {
      if (Array.isArray(response.data.data)) {
        console.log('✅ Case 3: response.data.data is array');
        return response.data.data as CategoryLimit[];
      }
    }
    
    // Case 4: response.data is an object with the data
    if (response.data && typeof response.data === 'object') {
      // Try to find any array property
      for (const key in response.data) {
        if (Array.isArray(response.data[key])) {
          console.log(`✅ Case 4: Found array in response.data.${key}`);
          return response.data[key] as CategoryLimit[];
        }
      }
    }
    
    console.log('⚠️ No valid data found, response:', response);
    return [];
    
  } catch (error: any) {
    console.error("Get user category limits error:", error);
    return [];
  }
}



 static async getApprovalList(): Promise<ReimbursementResponse[]> {
    try {
          const response = await api.get("/api/reimbursements/manager/approvals");
      
      // Debug log - same as your pattern
      console.log('📦 Manager approvals response:', response);
      console.log('📦 response.data:', response.data);
      
      // Handle response structure - same as your getAllReimbursements pattern
      
      // Case 1: response.data is directly the array
      if (Array.isArray(response.data)) {
        console.log('✅ Case 1: response.data is array');
        return response.data as ReimbursementResponse[];
      }
      
      // Case 2: response.data has data property that is array
      if (response.data && Array.isArray(response.data.data)) {
        console.log('✅ Case 2: response.data.data is array');
        return response.data.data as ReimbursementResponse[];
      }
      
      // Case 3: response.data has success and data properties
      if (response.data && response.data.success === true) {
        if (Array.isArray(response.data.data)) {
          console.log('✅ Case 3: response.data.data is array');
          return response.data.data as ReimbursementResponse[];
        }
      }
      
      // Case 4: response itself is the array
      if (Array.isArray(response)) {
        console.log('✅ Case 4: response is array');
        return response as ReimbursementResponse[];
      }
      
      console.log('⚠️ No valid data found, response structure:', response.data);
      return [];
      
    } catch (error: any) {
      console.error("Get manager approvals error:", error);
      // Don't throw, return empty array - same as getUserCategoryLimits
      return [];
    }
  }




  






















static async rejectItem(reimbursementItemId: string, remarks?: string): Promise<any> {
  try {
    console.log("📤 Sending reject request for item:", reimbursementItemId, "remarks:", remarks);
    
    const response = await api.post("/api/reimbursements/reject", {
      reimbursementItemId,
      remarks: remarks || "Rejected by manager"
    });
    
    console.log("📥 Response received:", response);
    
    if (response && response.success === true) {
      console.log('✅ Item rejected successfully');
      return response;
    }
    
    if (response && response.message) {
      throw new Error(response.message);
    }
    
    if (response) {
      return { success: true, ...response };
    }
    
    throw new Error('Failed to reject item');
    
  } catch (error: any) {
    console.error("❌ Reject item error:", error);
    throw error;
  }
}

static async approveItem(reimbursementItemId: string): Promise<any> {
  try {
    console.log("📤 Sending approve request for item:", reimbursementItemId);
    
    const response = await api.post("/api/reimbursements/approve", {
      reimbursementItemId
    });
    
    console.log("📥 Approve response:", response);
    
    if (response && response.success === true) {
      console.log('✅ Item approved successfully');
      return response;
    }
    
    if (response && response.message) {
      throw new Error(response.message);
    }
    
    if (response) {
      return { success: true, ...response };
    }
    
    throw new Error('Failed to approve item');
    
  } catch (error: any) {
    console.error("❌ Approve item error:", error);
    throw error;
  }
}










static async getFinanceItems(): Promise<any> {
  try {
    console.log('📤 Service: Calling API...');
    const response = await api.get("/api/reimbursements/finance/items");
    
    console.log('📥 Service: Raw response:', response);
    console.log('📥 Service: response.data:', response.data);
    console.log('📥 Service: Is response an array?', Array.isArray(response));
    console.log('📥 Service: Is response.data an array?', Array.isArray(response.data));
    
    // CASE 1: The response itself is the array (what's happening now)
    if (Array.isArray(response)) {
      console.log('✅ Service: Response itself is array with length:', response.length);
      return response;
    }
    
    // CASE 2: The response.data is the array
    if (response.data && Array.isArray(response.data)) {
      console.log('✅ Service: response.data is array with length:', response.data.length);
      return response.data;
    }
    
    // CASE 3: The response has success and data properties
    if (response.data && response.data.success === true && Array.isArray(response.data.data)) {
      console.log('✅ Service: Wrapped response with data array length:', response.data.data.length);
      return response.data.data;
    }
    
    console.warn('⚠️ Service: Unexpected response structure:', response);
    return [];
    
  } catch (error) {
    console.error('❌ Service: Error fetching finance items:', error);
    throw error;
  }
}






static async markAsPaid(reimbursementItemId: string) {
    try {
      console.log("📤 Sending mark as paid request for item:", reimbursementItemId);

      const response = await api.put(`/api/reimbursements/${reimbursementItemId}/mark-paid`);

      console.log("📥 Response received:", response.data);

      if (response.data?.success) {
        console.log("✅ Item marked as paid successfully");
        return response.data;
      }

      throw new Error(response.data?.message || "Failed to mark item as paid");
    } catch (error: any) {
      console.error("❌ Mark as paid error:", error);
      throw error;
    }
  }



}