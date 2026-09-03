import { api, apiClient, ApiError } from "@/lib/axios";

/**
 * Sprint Reports v2 — generated report snapshots.
 *
 * The reports workspace lists every completed sprint in a project (one row per
 * sprint) with its generated report summary. Reports are generated automatically
 * when a sprint completes; `generate` backfills sprints completed earlier.
 */

export interface SprintReportListItem {
  sprintId: string;
  sprintName: string | null;
  sprintGoal: string | null;
  status: string | null;
  startedAt: string | null;
  completedAt: string | null;
  committedPoints: number;
  completedPoints: number;
  hasReport: boolean;
  healthScore: number | null;
  healthBand: string | null;
  completionPct: number | null;
  totalTickets: number | null;
  completedTickets: number | null;
  generatedAt: string | null;
  generatedById: string | null;
  generatedByName: string | null;
}

export interface SprintReportDetail {
  sprintId: string;
  projectId: string;
  sprintName: string | null;
  sprintGoal: string | null;
  status: string | null;
  healthScore: number | null;
  healthBand: string | null;
  completionPct: number | null;
  totalTickets: number;
  completedTickets: number;
  committedPoints: number;
  completedPoints: number;
  report: Record<string, any>;
  generatedById: string | null;
  generatedAt: string | null;
  updatedAt: string | null;
}

export const SprintReportsService = {
  /** List completed sprints + their generated report summary for a project. */
  async list(projectId: string, extraParams?: Record<string, any>): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('projectId', projectId);
      
      if (extraParams) {
        Object.entries(extraParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }

      const response = await apiClient.get<any>(
        `/api/sprint-reports?${params.toString()}`
      );
      
      if (response?.data?.pagination) {
        return { data: response.data.data, pagination: response.data.pagination, stats: response.data.stats };
      }
      return response?.data?.data || [];
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to load sprint reports");
    }
  },

  /** Fetch the stored report snapshot (summary + full report_data) for a sprint. */
  async getBySprint(sprintId: string): Promise<SprintReportDetail> {
    try {
      return await api.get<SprintReportDetail>(
        `/api/sprint-reports/sprint/${sprintId}`
      );
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to load sprint report");
    }
  },

  /** Generate (or regenerate) the report snapshot for a sprint. */
  async generate(sprintId: string): Promise<SprintReportListItem> {
    try {
      return await api.post<SprintReportListItem>(
        `/api/sprint-reports/sprint/${sprintId}/generate`,
        {}
      );
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error("Failed to generate sprint report");
    }
  },
};

export default SprintReportsService;
