import { api } from "@/lib/axios";

export interface ExitType {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExitTypePayload {
  name: string;
  code: string;
  is_active?: boolean;
}

export class ExitTypeService {
  static async getAll() {
    return await api.get<ExitType[]>("/api/exit/exit-type");
  }

  static async getById(id: string) {
    return await api.get<ExitType>(`/api/exit/exit-type/${id}`);
  }

  static async create(payload: ExitTypePayload) {
    return await api.post("/api/exit/exit-type", payload);
  }

  static async update(id: string, payload: ExitTypePayload) {
    return await api.put(`/api/exit/exit-type/${id}`, payload);
  }

  static async delete(id: string) {
    return await api.delete(`/api/exit/exit-type/${id}`);
  }
}
