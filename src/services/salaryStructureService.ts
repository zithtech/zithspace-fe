import { api, ApiError } from "@/lib/axios";

export interface SalaryStructureComponentData {
  componentId: number;
  calculationType: "FIXED" | "PERCENTAGE";
  percentageBasis?: "GROSS" | "BASIC" | null;
  value: number;
  calculatedAmount?: number | null;
  displayOrder?: number | null;
}

export interface CreateSalaryStructureData {
  name: string;
  employeeType: string;
  grossSalary: number;
  effectiveFrom: string;
  description?: string;
  components: SalaryStructureComponentData[];
}

export interface UpdateSalaryStructureData extends Partial<CreateSalaryStructureData> {
  isActive?: boolean;
}

export interface SalaryStructure {
  id: string;
  tenantId: string;
  name: string;
  employeeType: string;
  grossSalary: number;
  effectiveFrom: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  components: any[]; // Full component details including the nested `component` model
}

export class SalaryStructureService {
  static async getSalaryStructures(): Promise<SalaryStructure[]> {
    try {
      return await api.get<SalaryStructure[]>("/api/salary-structures");
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch salary structures");
    }
  }

  static async getSalaryStructure(id: string): Promise<SalaryStructure> {
    try {
      return await api.get<SalaryStructure>(`/api/salary-structures/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to fetch salary structure");
    }
  }

  static async createSalaryStructure(data: CreateSalaryStructureData): Promise<SalaryStructure> {
    try {
      return await api.post<SalaryStructure>("/api/salary-structures", data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to create salary structure");
    }
  }

  static async updateSalaryStructure(id: string, data: UpdateSalaryStructureData): Promise<SalaryStructure> {
    try {
      return await api.put<SalaryStructure>(`/api/salary-structures/${id}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update salary structure");
    }
  }

  static async deleteSalaryStructure(id: string): Promise<void> {
    try {
      await api.delete(`/api/salary-structures/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to delete salary structure");
    }
  }

  static async updateSalaryStructureStatus(id: string, isActive: boolean): Promise<SalaryStructure> {
    try {
      return await api.patch<SalaryStructure>(`/api/salary-structures/${id}/status`, { isActive });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update salary structure status");
    }
  }

  static async calculatePreview(grossSalary: number, components: SalaryStructureComponentData[]): Promise<any[]> {
    try {
      // The api utility is assumed to handle response unwrapping,
      // so we directly return the result of the post call.
      return await api.post<any[]>("/api/salary-structures/calculate", { grossSalary, components });
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to calculate salary preview");
    }
  }
}
