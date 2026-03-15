import { api, apiClient } from "@/lib/axios";

export interface JobRequisitionData {
  id?: string;
  ticketId?: string;

  // Basic Job Information
  jobTitle: string;
  jobCode?: string;
  clientId?: string;
  clientContactPerson?: string;
  openingsCount: number;
  jobType: string;
  priority: string;
  status: string;

  // Candidate Requirements
  experience?: string;
  mandatorySkills?: string[];
  secondarySkills?: string[];
  education?: string;
  certification?: string;
  communicationSkills?: string;

  // Job Description
  jobRole?: string;
  jobDetails?: string;
  responsibilities?: string;
  interviewProcess?: any;

  // Visa & Work Authorization
  allowedVisaTypes?: string[];
  excludedVisaTypes?: string[];
  securityClearance?: boolean;

  // Location & Work Mode
  jobLocation?: string;
  workMode: string;
  timeZone?: string;
  relocationAllowed?: boolean;

  // Billing & Rate Information
  maxBillRate?: number;
  recruiterRate?: number;
  minPayRate?: number;
  overtimeMultiplier?: number;

  // Hiring Timeline
  startDate?: string;
  submissionDeadline?: string;
  interviewStartDate?: string;
  expectedClosureDate?: string;

  // Recruiter Assignment
  accountManagerId?: string;
  deliveryManagerId?: string;
  assignedRecruiters?: string[];
  maxSubmissionsPerRec?: number;

  // Candidate Submission Rules
  maxTotalSubmissions?: number;
  exclusiveCandidate?: boolean;
  blindCvRequired?: boolean;
  sourceFormat?: string;

  // Screening Questions & Attachments & Notes
  screeningQuestions?: any;
  attachments?: any;
  internalNotes?: string;

  // Relations (populated from API)
  client?: { id?: string; name?: string; company?: string };
  createdBy?: { id?: string; name?: string; workEmail?: string };
  accountManager?: { id?: string; name?: string; workEmail?: string };
  deliveryManager?: { id?: string; name?: string; workEmail?: string };
  // For display purposes — array of user objects from API
  [key: string]: any;
}

export interface RequisitionFilters {
  search?: string;
  status?: string;
  priority?: string;
  clientId?: string;
  visa?: string;
  startDateFrom?: string;
  startDateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedRequisitionResponse {
  data: JobRequisitionData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SelectOption {
  value: string;
  label: string;
  [key: string]: any;
}

export const RecruitmentService = {
  getAllRequisitions: async (
    filters: RequisitionFilters = {},
  ): Promise<PaginatedRequisitionResponse> => {
    // Build query string from filters
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    const url = queryString
      ? `/api/recruitment?${queryString}`
      : "/api/recruitment";

    // Use apiClient directly since the response has both data and pagination at top level
    const response = await apiClient.get(url);
    if (response.data.success) {
      return {
        data: response.data.data || [],
        pagination: response.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
    throw new Error(response.data.error || "Failed to fetch requisitions");
  },

  getRequisitionById: async (id: string): Promise<JobRequisitionData> => {
    const response = await api.get(`/api/recruitment/${id}`);
    return response;
  },

  createRequisition: async (
    data: Partial<JobRequisitionData>,
  ): Promise<JobRequisitionData> => {
    const response = await api.post("/api/recruitment", data);
    return response;
  },

  updateRequisition: async (
    id: string,
    data: Partial<JobRequisitionData>,
  ): Promise<JobRequisitionData> => {
    const response = await api.put(`/api/recruitment/${id}`, data);
    return response;
  },

  deleteRequisition: async (id: string): Promise<void> => {
    await api.delete(`/api/recruitment/${id}`);
  },

  deleteBatchRequisitions: async (ids: string[]): Promise<void> => {
    await api.delete("/api/recruitment/bulk/delete", { data: { ids } });
  },

  // ---- Dropdown helpers ----

  getClientsForSelect: async (): Promise<SelectOption[]> => {
    const response = await api.get("/api/clients/select");
    return response;
  },

  getMembersForSelect: async (): Promise<SelectOption[]> => {
    const response = await api.get("/api/members/select");
    return response;
  },
};
