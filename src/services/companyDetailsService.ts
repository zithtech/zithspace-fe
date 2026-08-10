import { api } from "@/lib/axios";

/**
 * Company Details — the registered company profile plus its branch locations.
 * Replaces the old CompanyLocationService: a tenant now has ONE registered
 * company (legal name, GST, primary contact, head-office address) and any
 * number of branches hanging off it.
 */

export interface CompanyAddress {
  doorNumber?: string | null;
  floor?: string | null;
  building?: string | null;
  area?: string | null;
  street?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
}

export interface CompanyDetails extends CompanyAddress {
  id: string;
  registeredName: string;
  gstNumber?: string | null;
  primaryEmail: string;
  primaryPhone: string;
  /** Normalised server-side to always carry a scheme, e.g. https://example.com. */
  website?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyBranch extends CompanyAddress {
  id: string;
  branchName: string;
  /** true → this branch uses the company's primary email. */
  useCompanyEmail: boolean;
  /** null whenever useCompanyEmail is true. */
  branchEmail?: string | null;
  /** Resolved server-side: the branch email, or the company's primary email. */
  effectiveEmail?: string | null;
  branchPhone?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveCompanyDetailsData extends CompanyAddress {
  registeredName: string;
  gstNumber?: string | null;
  primaryEmail: string;
  primaryPhone: string;
  website?: string | null;
}

export interface CompanyBranchData extends CompanyAddress {
  branchName: string;
  useCompanyEmail: boolean;
  branchEmail?: string | null;
  branchPhone?: string | null;
  isActive?: boolean;
}

export interface CompanyOverview {
  company: CompanyDetails | null;
  branches: CompanyBranch[];
}

const API_URL = "/api/company-details";

// `api` already returns response.data.data, but stay tolerant of a raw
// `{ success, data }` envelope so a null payload never leaks through as the
// envelope object itself.
const unwrap = (payload: any) =>
  payload && typeof payload === 'object' && 'success' in payload ? payload.data : payload;

export const CompanyDetailsService = {
  /** Company profile + branches in one round trip. */
  getOverview: async (): Promise<CompanyOverview> => {
    const data = unwrap(await api.get<any>(API_URL));
    return { company: data?.company ?? null, branches: data?.branches ?? [] };
  },

  getCompany: async (): Promise<CompanyDetails | null> => {
    return unwrap(await api.get<any>(`${API_URL}/company`)) || null;
  },

  /** Upsert — creates the company row on first save, updates it thereafter. */
  saveCompany: async (data: SaveCompanyDetailsData): Promise<CompanyDetails> => {
    return unwrap(await api.put<any>(`${API_URL}/company`, data));
  },

  getBranches: async (): Promise<CompanyBranch[]> => {
    const data = unwrap(await api.get<any>(`${API_URL}/branches`));
    return Array.isArray(data) ? data : [];
  },

  createBranch: async (data: CompanyBranchData): Promise<CompanyBranch> => {
    return unwrap(await api.post<any>(`${API_URL}/branches`, data));
  },

  updateBranch: async (id: string, data: CompanyBranchData): Promise<CompanyBranch> => {
    return unwrap(await api.put<any>(`${API_URL}/branches/${id}`, data));
  },

  deleteBranch: async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/branches/${id}`);
  },
};

/** Single-line address for cards, dropdown labels and letter placeholders. */
export const formatAddress = (a?: CompanyAddress | null): string => {
  if (!a) return "";
  return [
    [a.doorNumber, a.floor].filter(Boolean).join(", "),
    a.building,
    a.street,
    a.area,
    a.city,
    a.district,
    a.state,
    a.pincode,
    a.country,
  ]
    .filter((part) => part && String(part).trim())
    .join(", ");
};
