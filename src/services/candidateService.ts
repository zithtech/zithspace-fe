import { apiClient } from "@/lib/axios";

export interface CandidateDocument {
  fileName: string;
  base64: string;
}

export interface CandidateWorkExperience {
  id?: string;
  companyName: string;
  companyWebsite?: string | null;
  jobTitle: string;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  employmentType?: string | null;
  workMode?: string | null;
  skillsUsed?: string[];
  responsibilities?: string | null;
}

export interface CandidateSkill {
  id?: string;
  skillName: string | string[];
  yearsOfExperience: number | string;
  lastUsedYear: string;
}

export interface CandidateEducation {
  id?: string;
  degreeName: string;
  specialization?: string | null;
  university: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
}

export interface CandidateInterviewSlot {
  id?: string;
  interviewDate: string;
  startTime: string;
  endTime: string;
  timezone?: string | null;
}

export interface CandidatePayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  timezone?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  preferredContactMethod?: string | null;
  currentRole?: string | null;
  yearsOfExperience?: number | string | null;
  primarySkills?: string[];
  secondarySkills?: string[];
  professionalSummary?: string | null;
  workAuthorizationType?: string | null;
  visaValidityDate?: string | null;
  willingToTransferVisa?: boolean;
  preferredEmploymentType?: string | null;
  expectedRate?: number | string | null;
  rateUnit?: string | null;
  willingToRelocate?: string | null;
  preferredWorkMode?: string | null;
  earliestAvailable?: string | null;
  joiningDate?: string | null;
  noticePeriod?: number | string | null;
  statusConfig?: string;
  actionConfig?: string;
  skillRate?: string;
  internalNotes?: string | null;
  candidateTags?: string[];
  isActive?: boolean;
  workExperience?: CandidateWorkExperience[];
  skillsMatrix?: CandidateSkill[];
  education?: CandidateEducation[];
  interviewSlots?: CandidateInterviewSlot[];
  resume?: CandidateDocument | null;
  passport?: CandidateDocument | null;
  drivingLicense?: CandidateDocument | null;
  visaDocument?: CandidateDocument | null;
  identityProof?: CandidateDocument | null;
  certifications?: CandidateDocument[] | null;
}

export interface CandidateResponse extends Omit<CandidatePayload, "resume" | "passport" | "drivingLicense" | "visaDocument" | "identityProof" | "certifications" | "workExperience" | "skillsMatrix" | "education"> {
  id: string;
  tenantId: string;
  resumeUrl?: string | null;
  passportUrl?: string | null;
  drivingLicenseUrl?: string | null;
  visaDocumentUrl?: string | null;
  identityProofUrl?: string | null;
  certificationsUrls?: string[] | null;
  createdAt: string;
  updatedAt: string;
  workExperiences?: CandidateWorkExperience[];
  skills?: CandidateSkill[];
  educations?: CandidateEducation[];
}

const API_URL = "/api/candidates";

export const candidateService = {
  getAll: async (): Promise<CandidateResponse[]> => {
    const response = await apiClient.get(API_URL);
    return response.data.data || response.data;
  },

  getById: async (id: string): Promise<CandidateResponse> => {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data.data || response.data;
  },

  createCandidate: async (data: CandidatePayload): Promise<CandidateResponse> => {
    const response = await apiClient.post(API_URL, data);
    return response.data.data || response.data;
  },

  updateCandidate: async (id: string, data: Partial<CandidatePayload>): Promise<CandidateResponse> => {
    const response = await apiClient.put(`${API_URL}/${id}`, data);
    return response.data.data || response.data;
  },

deleteCandidate: async (id: string): Promise<any> => {
  try {
    const response = await apiClient.delete(`${API_URL}/${id}`);
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Delete candidate API error:", error);

    throw new Error(
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Failed to delete candidate"
    );
  }
},
}

export default candidateService;