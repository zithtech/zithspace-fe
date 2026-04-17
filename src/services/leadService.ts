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
  platform?: string;
  timeline_start?: string;
  timeline_end?: string;
  posted_on: string;
  documents: { name: string; url: string }[];
  created_at: string;
  updated_at: string;
  
  // Job Metadata
  external_job_id?: string;
  experience_level?: string;
  job_type?: string;
  budget?: string;
  hourly_rate?: string;
  
  // Client Quality Data
  client_rating?: string;
  client_spend?: string;
  client_jobs_posted?: string;
  client_payment_verified?: boolean;
  client_phone_verified?: boolean;
  
  // AI & Proposal Data
  ai_score?: number;
  proposal_text?: string;
  template_used?: string;
  internal_notes?: string;
  skill_analysis?: {
    matchedSkills: string[];
    missingSkills: string[];
    matchPercentage: number;
  };
  ai_summary?: string;
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
  platform?: string;
  timeline?: [any, any] | null;
  postedOn?: any;
  documents?: { name: string; url: string }[];
  
  // Job Metadata
  externalJobId?: string;
  experienceLevel?: string;
  jobType?: string;
  budget?: string;
  hourlyRate?: string;
  
  // Client Quality Data
  clientRating?: string;
  clientSpend?: string;
  clientJobsPosted?: string;
  clientPaymentVerified?: boolean;
  clientPhoneVerified?: boolean;
  
  // AI & Proposal Data
  aiScore?: number;
  proposalText?: string;
  templateUsed?: string;
  internalNotes?: string;
  skillAnalysis?: any;
  aiSummary?: string;
  ai_summary?: string;
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
   * Fetch a single lead by ID
   */
  static async getById(id: string): Promise<Lead> {
    try {
      return await api.get<Lead>(`/api/leads/${id}`);
    } catch (error) {
      console.error('Failed to fetch lead:', error);
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
