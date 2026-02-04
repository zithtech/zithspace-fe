import { api } from "@/lib/axios";

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  type: "Days" | "Hours";
  days: number | null;
  hours: number | null;
  isPaid: boolean;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string };
  updatedBy?: { id: string; name: string };
}

export type CreateLeaveTypePayload = Omit<LeaveType, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">;
export type UpdateLeaveTypePayload = Partial<CreateLeaveTypePayload>;

const leaveTypeService = {
  async getAll(): Promise<LeaveType[]> {
    return await api.get<LeaveType[]>("/api/leave-types");
  },

  async getById(id: string): Promise<LeaveType> {
    return await api.get<LeaveType>(`/api/leave-types/${id}`);
  },

  async create(data: CreateLeaveTypePayload): Promise<LeaveType> {
    return await api.post<LeaveType>("/api/leave-types", data);
  },

  async update(id: string, data: UpdateLeaveTypePayload): Promise<LeaveType> {
    return await api.put<LeaveType>(`/api/leave-types/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/leave-types/${id}`);
  },
};

export default leaveTypeService;