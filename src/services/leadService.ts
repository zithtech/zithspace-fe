import { api, apiUtils, PaginatedResponse } from '@/lib/axios';

export interface Lead {
  id: string;
  tenant_id: string;
  client_name: string;
  client_mail: string;
  client_phone?: string;
  client_location?: string;
  title: string;
  summary?: string;
  skills: string[];
  duration?: string;
  hour_based_amount: number;
  job_link?: string;
  est_project_duration?: string;
  status: string;
  actions_item?: string;
  timeline_start?: string;
  timeline_end?: string;
  posted_on: string;
  documents: { name: string; url: string }[];
  created_at: string;
  updated_at: string;
}

export interface LeadPayload {
  clientName: string;
  clientMail: string;
  clientPhone?: string;
  clientLocation?: string;
  title: string;
  summary?: string;
  skills?: string[];
  duration?: string;
  hourBasedAmount?: number;
  jobLink?: string;
  estOrProjectDuration?: string;
  status?: string;
  actions?: string;
  timeline?: [any, any] | null;
  postedOn?: any;
  documents?: { name: string; url: string }[];
}

export class LeadService {
  /**
   * Fetch all leads for the current tenant
   */
  static async getAll(): Promise<Lead[]> {
    try {
      return await api.get<Lead[]>('/api/leads');
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      throw error;
    }
  }

  /**
   * Create a new lead
   */
  static async create(data: any): Promise<Lead> {
    try {
      return await api.post<Lead>('/api/leads', data);
    } catch (error) {
      console.error('Failed to create lead:', error);
      throw error;
    }
  }

  /**
   * Update an existing lead
   */
  static async update(id: string, data: any): Promise<Lead> {
    try {
      return await api.put<Lead>(`/api/leads/${id}`, data);
    } catch (error) {
      console.error('Failed to update lead:', error);
      throw error;
    }
  }

  /**
   * Delete a lead
   */
  static async delete(id: string): Promise<void> {
    try {
      await api.delete(`/api/leads/${id}`);
    } catch (error) {
      console.error('Failed to delete lead:', error);
      throw error;
    }
  }
}

export default LeadService;
