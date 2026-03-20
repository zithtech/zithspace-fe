import { api } from "@/lib/axios";

export interface RecruitmentStatusPayload {
    name: string;
    category: string;
    color: string;
    appliesTo: string[];
    isDefault: boolean;
    isFinalStage: boolean;
    isActive: boolean;
}

export interface RecruitmentActionPayload {
    name: string;
    type: string;
    icon: string;
    color: string;
    isActive: boolean;
}

export const RecruitmentStatusService = {
    getAll: () => api.get("/api/recruitment-statuses").then(res => res.data),
    create: (data: RecruitmentStatusPayload) => api.post("/api/recruitment-statuses", data).then(res => res.data),
    update: (id: string, data: Partial<RecruitmentStatusPayload>) => api.put(`/api/recruitment-statuses/${id}`, data).then(res => res.data),
    delete: (id: string) => api.delete(`/api/recruitment-statuses/${id}`).then(res => res.data),
};

export const RecruitmentActionService = {
    getAll: () => api.get("/api/recruitment-actions").then(res => res.data),
    create: (data: RecruitmentActionPayload) => api.post("/api/recruitment-actions", data).then(res => res.data),
    update: (id: string, data: Partial<RecruitmentActionPayload>) => api.put(`/api/recruitment-actions/${id}`, data).then(res => res.data),
    delete: (id: string) => api.delete(`/api/recruitment-actions/${id}`).then(res => res.data),
};