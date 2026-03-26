import { api } from "@/lib/axios";

export interface Deal {
  id: string;
  clientName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  title: string;
  stageId: string;
  assignedToId?: string;
  estimatedValue?: number;
  cost?: number;
  currency?: string;
  expectedClosingDate?: string;
  probability?: number;
  source?: string;
  tags?: string[];
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  stage?: {
    id: string;
    name: string;
    color: string;
    probability: number;
  };
  assignedTo?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  assignees?: {
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  }[];
  paymentSchedule?: DealPaymentSchedule[];
}

export interface DealPaymentSchedule {
  id: string;
  dealId: string;
  milestone: string;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Paid';
  createdAt: string;
  updatedAt: string;
}

export interface DealActivity {
  id: string;
  dealId: string;
  type: string;
  content: string;
  scheduledAt: string;
  createdAt: string;
}

export interface DealCommunication {
  id: string;
  dealId: string;
  type: string;
  direction: string;
  sender?: string;
  receiver?: string;
  subject?: string;
  content: string;
  timestamp: string;
}

export interface DealTask {
  id: string;
  dealId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: string;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface DealFile {
  id: string;
  dealId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedById?: string;
  uploadedBy?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDealPayload {
  clientName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  title: string;
  stageId: string;
  assignedToId?: string;
  estimatedValue?: number;
  currency?: string;
  expectedClosingDate?: string;
  probability?: number;
  source?: string;
  tags?: string[];
  notes?: string;
  status?: string;
  assigneeIds?: string[];
}

export interface ForecastData {
  metrics: {
    totalPipelineValue: number;
    weightedRevenue: number;
    wonRevenue: number;
    lostRevenue: number;
  };
  charts: {
    revenueByStage: Array<{ stage: string; value: number; count: number }>;
    monthlyForecast: Array<{ month: string; value: number }>;
  };
  deals: Array<{
    id: string;
    title: string;
    value: number;
    probability: number;
    weightedValue: number;
    stage: string;
    assignedTo: string;
  }>;
}

export const dealService = {
  getAllDeals: async (): Promise<Deal[]> => {
    return await api.get<Deal[]>("/api/deals");
  },

  getDealById: async (id: string): Promise<Deal> => {
    return await api.get<Deal>(`/api/deals/${id}`);
  },

  createDeal: async (payload: CreateDealPayload): Promise<Deal> => {
    return await api.post<Deal>("/api/deals", payload);
  },

  updateDeal: async (id: string, payload: Partial<CreateDealPayload>): Promise<Deal> => {
    return await api.put<Deal>(`/api/deals/${id}`, payload);
  },

  deleteDeal: async (id: string): Promise<void> => {
    await api.delete(`/api/deals/${id}`);
  },

  // Deal Details Sub-resources
  getActivities: async (dealId: string): Promise<DealActivity[]> => {
    return await api.get<DealActivity[]>(`/api/deals/${dealId}/activities`);
  },

  createActivity: async (dealId: string, payload: any): Promise<DealActivity> => {
    return await api.post<DealActivity>(`/api/deals/${dealId}/activities`, payload);
  },

  getCommunications: async (dealId: string): Promise<DealCommunication[]> => {
    return await api.get<DealCommunication[]>(`/api/deals/${dealId}/communications`);
  },

  createCommunication: async (dealId: string, payload: any): Promise<DealCommunication> => {
    return await api.post<DealCommunication>(`/api/deals/${dealId}/communications`, payload);
  },

  getTasks: async (dealId: string): Promise<DealTask[]> => {
    return await api.get<DealTask[]>(`/api/deals/${dealId}/tasks`);
  },

  createTask: async (dealId: string, payload: any): Promise<DealTask> => {
    return await api.post<DealTask>(`/api/deals/${dealId}/tasks`, payload);
  },

  updateTaskStatus: async (taskId: string, status: string): Promise<DealTask> => {
    return await api.put<DealTask>(`/api/deals/tasks/${taskId}/status`, { status });
  },

  getFiles: async (dealId: string): Promise<DealFile[]> => {
    return await api.get<DealFile[]>(`/api/deals/${dealId}/files`);
  },

  uploadFile: async (dealId: string, payload: any): Promise<DealFile> => {
    return await api.post<DealFile>(`/api/deals/${dealId}/files`, payload);
  },

  getFinancials: async (dealId: string): Promise<any> => {
    return await api.get<any>(`/api/deals/${dealId}/financials`);
  },

  updateFinancials: async (dealId: string, payload: { estimatedValue: number, cost: number }): Promise<any> => {
    return await api.put<any>(`/api/deals/${dealId}/financials`, payload);
  },

  createPaymentMilestone: async (dealId: string, payload: { milestone: string, amount: number, dueDate: string }): Promise<DealPaymentSchedule> => {
    return await api.post<DealPaymentSchedule>(`/api/deals/${dealId}/financials/milestones`, payload);
  },

  updatePaymentStatus: async (milestoneId: string, status: string): Promise<DealPaymentSchedule> => {
    return await api.put<DealPaymentSchedule>(`/api/deals/financials/milestones/${milestoneId}/status`, { status });
  },

  convertToProject: async (dealId: string, payload: any): Promise<any> => {
    return await api.post<any>(`/api/deals/${dealId}/convert`, payload);
  },

  getPipelineStages: async (): Promise<any[]> => {
    return await api.get<any[]>("/api/pipeline-stages");
  },

  getForecastData: async (filters?: any): Promise<ForecastData> => {
    return await api.get<ForecastData>('/api/deals/forecast', { params: filters });
  }
};
