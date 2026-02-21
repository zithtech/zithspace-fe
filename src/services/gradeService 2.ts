import { api } from "@/lib/axios";

export interface GradePayload {
  name: string;
  code: string;
  levelOrder: number;
  description?: string;
  isActive: boolean;
}

export interface GradeAPIResponse {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  levelOrder: number;
  description: string | null;
  isActive: boolean;
  createdById: string;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string };
  updatedBy?: { id: string; name: string } | null;
}

export const GradeService = {
  getAllGrades: () => api.get<GradeAPIResponse[]>("/api/grades"),
  getGradeById: (id: string) => api.get<GradeAPIResponse>(`/api/grades/${id}`),
  createGrade: (payload: GradePayload) => api.post<GradeAPIResponse>("/api/grades", payload),
  updateGrade: (id: string, payload: Partial<GradePayload>) =>
    api.put<GradeAPIResponse>(`/api/grades/${id}`, payload),
  deleteGrade: (id: string) => api.delete(`/api/grades/${id}`),
};