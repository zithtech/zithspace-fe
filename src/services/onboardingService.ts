import { api, apiClient, ApiError } from "@/lib/axios";

export class EmployeeOnboardingService {
  /**
   * Create full employee onboarding
   */
  static async createEmployeeOnboarding(data: any): Promise<any> {
    try {
      return await api.post<any>("/api/onboarding", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to complete employee onboarding");
    }
  }

  /**
   * Get all employees (list view)
   */
  static async getAllEmployees(): Promise<any> {
    try {
      return await api.get<any>("/api/onboarding");
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch employees");
    }
  }

  /**
   * Get employee by ID (full details)
   */
  static async getEmployeeById(employeeId: string): Promise<any> {
    try {
      return await api.get<any>(`/api/onboarding/${employeeId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch employee details");
    }
  }

  /**
   * Update employee (full update)
   */
  static async updateEmployee(employeeId: any, data: any): Promise<any> {
    if (!employeeId || employeeId === "undefined") {
      throw new Error("Employee ID is required for update");
    }

    try {
      return await api.put<any>(`/api/onboarding/${employeeId}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update employee");
    }
  }

  /**
   * Delete employee (soft delete)
   */
  static async deleteEmployee(employeeId: string): Promise<any> {
    try {
      return await api.delete<any>(`/api/onboarding/${employeeId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to delete employee");
    }
  }

  /* ===================== ONBOARDING INVITES (public-link flow) ===================== */

  /** HR: create a draft employee + tokenized public link. */
  static async createInvite(data: {
    firstName: string;
    lastName: string;
    workEmail: string;
    personalEmail?: string;
    mobile?: string;
  }): Promise<any> {
    try {
      return await api.post<any>("/api/onboarding/invite", data);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error("Failed to create invite");
    }
  }

  /** HR: list pending/draft onboarding invites. */
  static async listInvites(): Promise<any> {
    try {
      return await api.get<any>("/api/onboarding/invites");
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error("Failed to fetch invites");
    }
  }

  /** HR: edit a draft's name + emails (lightweight — no address/identity wipe). */
  static async updateInviteContact(
    employeeId: string,
    data: { firstName?: string; lastName?: string; workEmail?: string; personalEmail?: string },
  ): Promise<any> {
    try {
      return await api.put<any>(`/api/onboarding/invite/${employeeId}`, data);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error("Failed to update invite");
    }
  }

  /** HR: regenerate an expired invite link. */
  static async regenerateInvite(inviteId: string): Promise<any> {
    try {
      return await api.post<any>(`/api/onboarding/invite/${inviteId}/regenerate`, {});
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error("Failed to regenerate invite");
    }
  }

  /** HR: disable a public link. */
  static async revokeInvite(inviteId: string): Promise<any> {
    try {
      return await api.post<any>(`/api/onboarding/invite/${inviteId}/revoke`, {});
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error("Failed to revoke invite");
    }
  }

  /** HR: finalize a draft → active employee. */
  static async activateEmployee(employeeId: string): Promise<any> {
    try {
      return await api.post<any>(`/api/onboarding/${employeeId}/activate`, {});
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error("Failed to activate employee");
    }
  }

  /* ============== DOCUMENTS-NEEDED CATALOG (Settings → Documents) ============== */

  static async listDocumentTypes(): Promise<any> {
    try {
      return await api.get<any>("/api/onboarding/document-types");
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error("Failed to fetch document types");
    }
  }

  static async createDocumentType(data: { name: string; description?: string }): Promise<any> {
    try {
      return await api.post<any>("/api/onboarding/document-types", data);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error("Failed to create document type");
    }
  }

  static async updateDocumentType(
    id: string,
    data: { name?: string; description?: string; isActive?: boolean },
  ): Promise<any> {
    try {
      return await api.put<any>(`/api/onboarding/document-types/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error("Failed to update document type");
    }
  }

  static async deleteDocumentType(id: string): Promise<any> {
    try {
      return await api.delete<any>(`/api/onboarding/document-types/${id}`);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error("Failed to delete document type");
    }
  }
}

// ── Employee HR Documents ─────────────────────────────────────────────────

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  employeeName: string | null;
  documentName: string;
  documentType: string;
  documentUrl: string;
  status: "uploaded" | "pending" | "expired";
  expiryDate: string | null;
  notes: string | null;
  uploadedAt: string;
  createdById: string | null;
  uploadedByName: string | null;
}

export interface DocumentStats {
  total: number;
  uploaded: number;
  pending: number;
  expired: number;
}

export class EmployeeDocumentService {
  /** List all employee documents with optional filters */
  static async listDocuments(filters?: {
    employeeId?: string;
    documentType?: string;
    status?: string;
    search?: string;
  }): Promise<{ data: EmployeeDocument[]; stats: DocumentStats }> {
    try {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.set("employeeId", filters.employeeId);
      if (filters?.documentType) params.set("documentType", filters.documentType);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.search) params.set("search", filters.search);
      const qs = params.toString();
      const response = await apiClient.get<any>(`/api/onboarding/employee-documents${qs ? `?${qs}` : ""}`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error("Failed to fetch documents");
    }
  }

  /** List my documents with optional filters */
  static async listMyDocuments(filters?: {
    documentType?: string;
    status?: string;
    search?: string;
  }): Promise<{ data: EmployeeDocument[]; stats: DocumentStats }> {
    try {
      const params = new URLSearchParams();
      if (filters?.documentType) params.set("documentType", filters.documentType);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.search) params.set("search", filters.search);
      const qs = params.toString();
      const response = await apiClient.get<any>(`/api/onboarding/my-documents${qs ? `?${qs}` : ""}`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error("Failed to fetch my documents");
    }
  }

  /** Upload an employee document (multipart file + metadata) */
  static async uploadDocument(payload: {
    file: File;
    employeeId: string;
    documentName: string;
    documentType: string;
    status?: string;
    expiryDate?: string;
    notes?: string;
  }): Promise<{ data: EmployeeDocument }> {
    try {
      const formData = new FormData();
      formData.append("file", payload.file);
      formData.append("employeeId", payload.employeeId);
      formData.append("documentName", payload.documentName);
      formData.append("documentType", payload.documentType);
      if (payload.status) formData.append("status", payload.status);
      if (payload.expiryDate) formData.append("expiryDate", payload.expiryDate);
      if (payload.notes) formData.append("notes", payload.notes);
      return await api.post<any>("/api/onboarding/employee-documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error("Failed to upload document");
    }
  }

  /** Soft-delete a document */
  static async deleteDocument(id: string): Promise<void> {
    try {
      await api.delete(`/api/onboarding/employee-documents/${id}`);
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message);
      throw new Error("Failed to delete document");
    }
  }
}

/* ===================== PUBLIC (unauthenticated) onboarding form ===================== */
// Used by the /onboard/[token] page. No auth header is required; the token is the
// credential. We hit the API base directly so the shared axios auth interceptor
// isn't needed.
export class PublicOnboardingService {
  private static base(): string {
    return process.env.NEXT_PUBLIC_API_URL || "";
  }

  static async getInvite(token: string): Promise<any> {
    const res = await fetch(`${this.base()}/api/public/onboarding/${token}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || "This onboarding link is invalid or has expired");
    return json;
  }

  static async submit(token: string, data: any): Promise<any> {
    const res = await fetch(`${this.base()}/api/public/onboarding/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || "Failed to submit details");
    return json;
  }
}
