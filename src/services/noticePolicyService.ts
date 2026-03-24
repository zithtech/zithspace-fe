import { api } from "@/lib/axios";

export interface NoticePolicy {
  id: string;
  policyName: string;
  code: string;
  description?: string;
  levelType: string;
  levelId: string;
  noticePeriodDays: number;
  probationPeriodDays?: number;
  probationNoticeDays?: number;
  buyoutCalculatingType?: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoticePolicyPayload {
  policy_name: string;
  code: string;
  description?: string;
  level_type: string;
  level_id: string;
  notice_period_days: number;
  probotion_period_days?: number;
  probation_notice_days?: number;
  buyout_calculating_type?: string;
  status: boolean;
}

export class NoticePolicyService {
  static async getAll() {
    return await api.get<NoticePolicy[]>("/api/exit/notice-policy");
  }

  static async getById(id: string) {
    return await api.get<NoticePolicy>(`/api/exit/notice-policy/${id}`);
  }

  static async create(payload: NoticePolicyPayload) {
    return await api.post("/api/exit/notice-policy", payload);
  }

  static async update(id: string, payload: NoticePolicyPayload) {
    return await api.put(`/api/exit/notice-policy/${id}`, payload);
  }

  static async delete(id: string) {
    return await api.delete(`/api/exit/notice-policy/${id}`);
  }
}
