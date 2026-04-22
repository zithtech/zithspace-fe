import { api } from '@/lib/axios';

export interface Escalation {
  id: string;
  subject: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority?: { id: string; name: string };
  category?: { id: string; name: string };
  reportedBy?: { id: string; name: string; workEmail: string };
  assignedTo?: { id: string; name: string; workEmail: string };
  createdBy?: { id: string; name: string; workEmail?: string };
  project?: { id: string; name: string; code?: string };
  tickets?: { id: string; ticket?: { id: string; ticketNumber?: string; title: string; status?: string } }[];
  targetMembers?: { id: string; user?: { id: string; name: string; workEmail?: string; avatar?: string } }[];
  userId?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
}

export class EscalationService {
  static async getEscalations(filters?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
  }): Promise<{ success: boolean; data: Escalation[] }> {
    try {
      const params: Record<string, string> = {};
      if (filters?.userId) params.userId = filters.userId;
      if (filters?.startDate) params.startDate = filters.startDate;
      if (filters?.endDate) params.endDate = filters.endDate;
      if (filters?.status) params.status = filters.status;
      if (filters?.limit) params.limit = String(filters.limit);

      const response = await api.get('/escalations', { params });
      const data = response.data;

      if (Array.isArray(data)) return { success: true, data };
      if (data?.data && Array.isArray(data.data)) return { success: true, data: data.data };
      return { success: true, data: [] };
    } catch {
      return { success: false, data: [] };
    }
  }

  static async getEscalationById(id: string): Promise<Escalation | null> {
    try {
      const response = await api.get(`/escalations/${id}`);
      const data = response.data;
      return data?.data || data || null;
    } catch {
      return null;
    }
  }
}
