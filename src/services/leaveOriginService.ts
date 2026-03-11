// src/services/leaveOriginService.ts
import { apiClient } from "@/lib/axios";

const API_URL = "/api/leave-origins";

export interface OriginLeaveType {
  id: string;
  leaveTypeId: string;
  leaveType?: { id: string; name: string }; // Populated relation
  unit: number;
  period: string;
  accrualInterval: number; // ⭐ add
  carryForward: boolean;
  status: string;
}

export interface LeaveOriginStructure {
  id: string;
  origin: string;
  subOriginId: string;
  leaveTypes: OriginLeaveType[];
}

export interface CreateLeaveOriginStructureData {
  origin: string;
  subOriginId: string;
  leaveTypes?: Omit<CreateOriginLeaveTypeData, "leaveOriginId">[];
}

export interface CreateOriginLeaveTypeData {
  leaveOriginId: string;
  leaveTypeId: string;
  unit: number;
  period: string;
  carryForward: boolean;
  status: string;
}

export const leaveOriginService = {
  getAll: async (): Promise<LeaveOriginStructure[]> => {
    const response = await apiClient.get(API_URL);
    return response.data.data;
  },

  createStructure: async (
    data: CreateLeaveOriginStructureData,
  ): Promise<LeaveOriginStructure> => {
    const response = await apiClient.post(`${API_URL}/structure`, data);
    return response.data.data;
  },

  updateStructure: async (
    id: string,
    data: { leaveTypes: any[] },
  ): Promise<LeaveOriginStructure> => {
    const response = await apiClient.put(`${API_URL}/structure/${id}`, data);
    return response.data.data;
  },

  createLeaveType: async (
    data: CreateOriginLeaveTypeData,
  ): Promise<OriginLeaveType> => {
    const response = await apiClient.post(`${API_URL}/type`, data);
    return response.data.data;
  },

  updateLeaveType: async (
    id: string,
    data: Partial<CreateOriginLeaveTypeData>,
  ): Promise<OriginLeaveType> => {
    const response = await apiClient.put(`${API_URL}/type/${id}`, data);
    return response.data.data;
  },

  deleteStructure: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_URL}/structure/${id}`);
  },

  deleteLeaveType: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_URL}/type/${id}`);
  },
};

export default leaveOriginService;
