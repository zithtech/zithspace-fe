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
  implementationId?: string;
  recruitmentClientId?: string;
  vendorIds?: string;
  contactIds?: string[];
  jobRequisitionContacts?: { id: string; contactId: string }[];

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
  pagination: { pageSizeOptions: [10, 20, 25, 50, 100], page: number;
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

export interface RequisitionAttachment {
  id?: string;
  requisitionId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType: string;
  category: string; // job_description, client_requirements, interview_guide
  uploadedAt?: string;
  uploadedBy?: {
    id?: string;
    name: string;
    workEmail?: string;
    position?: string;
  };
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

  getImplementationPartnersForSelect: async (): Promise<SelectOption[]> => {
    const response = await api.get("/api/implementation-partner/select");
    return response;
  },

  getRecruitmentClientsForSelect: async (): Promise<SelectOption[]> => {
    const response = await api.get("/api/recruitment-client/select");
    return response;
  },

  getVendorsForSelect: async (): Promise<SelectOption[]> => {
    const response = await api.get("/api/vendor/select");
    return response;
  },

  getImplementationContacts: async (
    implementationId: string,
  ): Promise<SelectOption[]> => {
    const response = await api.get(
      `/api/implementation-partner/${implementationId}`,
    );
    if (response && response.contactPersons) {
      return response.contactPersons.map((cp: any) => ({
        value: cp.id,
        label: cp.personName || cp.name || "Unnamed Contact",
      }));
    }
    return [];
  },

  getRecruitmentClientContacts: async (
    clientId: string,
  ): Promise<SelectOption[]> => {
    const response = await api.get(`/api/recruitment-client/${clientId}`);
    if (response && response.contacts) {
      return response.contacts.map((c: any) => ({
        value: c.id,
        label: c.personName || c.name || "Unnamed Contact",
      }));
    }
    return [];
  },

  getVendorContacts: async (vendorId: string): Promise<SelectOption[]> => {
    const response = await api.get(`/api/vendor/${vendorId}`);
    if (response && response.contactPersons) {
      return response.contactPersons.map((cp: any) => ({
        value: cp.id,
        label: cp.personName || cp.name || "Unnamed Contact",
      }));
    }
    return [];
  },

  // ---- Attachment Management ----

  uploadAttachment: async (
    requisitionId: string,
    file: string,
    fileName: string,
    category: string,
  ): Promise<RequisitionAttachment> => {
    const response = await api.post(`/api/recruitment/${requisitionId}/attachments`, {
      file,
      fileName,
      category,
    });
    return response;
  },

  getAttachments: async (requisitionId: string): Promise<RequisitionAttachment[]> => {
    const response = await api.get(`/api/recruitment/${requisitionId}/attachments`);
    return Array.isArray(response) ? response : [];
  },

  deleteAttachment: async (
    requisitionId: string,
    attachmentId: string,
  ): Promise<void> => {
    await api.delete(`/api/recruitment/${requisitionId}/attachments/${attachmentId}`);
  },
};
