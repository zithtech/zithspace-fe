import { apiClient } from "@/lib/axios";

export interface TransactionRow {
  id: string;
  section: string;
  module: string;
  page: string | null;
  action: string;
  actionLabel: string | null;
  entityType: string | null;
  entityId: string | null;
  entityLabel: string | null;
  parentEntityType: string | null;
  parentEntityId: string | null;
  actor: {
    avatarUrl: any;
    id: string;
    type: string;
    name: string | null;
    email: string | null;
  };
  impersonatorId: string | null;
  changedFields: string[] | null;
  beforeData: Record<string, any> | null;
  afterData: Record<string, any> | null;
  requestMethod: string | null;
  requestPath: string | null;
  statusCode: number | null;
  durationMs: number | null;
  correlationId: string | null;
  source: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface TransactionHistoryListParams {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  section?: string;
  module?: string;
  page?: string;
  action?: string | string[];
  correlationId?: string;
  search?: string;
  from?: string; // ISO datetime
  to?: string;
  cursor?: string;
  limit?: number;
}

export interface TransactionHistoryListResponse {
  success: boolean;
  data: TransactionRow[];
  /** Present in cursor mode (drawer) */
  nextCursor?: string | null;
  /** Total matching rows for these filters (always present) */
  total: number;
}

/** Used by the global page (offset pagination). */
export interface TransactionHistoryPagedParams
  extends Omit<TransactionHistoryListParams, "cursor"> {
  pageNum: number; // 1-based
}

export interface TransactionHistoryPagedResponse {
  success: boolean;
  data: TransactionRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransactionHistoryFilters {
  sections: string[];
  modules: { section: string; module: string }[];
  pages: { module: string; page: string }[];
  actions: string[];
  entityTypes: string[];
}

export const TransactionHistoryService = {
  async list(params: TransactionHistoryListParams = {}): Promise<TransactionHistoryListResponse> {
    const res = await apiClient.get<TransactionHistoryListResponse>(
      "/api/transaction-history",
      { params }
    );
    return res.data;
  },

  async listPaged(
    params: TransactionHistoryPagedParams
  ): Promise<TransactionHistoryPagedResponse> {
    // `pageNum` is the 1-based page index for offset pagination. Sent as
    // `pageNum` (not `page`) to avoid colliding with the nav-page filter.
    const res = await apiClient.get<TransactionHistoryPagedResponse>(
      "/api/transaction-history",
      { params }
    );
    return res.data;
  },

  async filters(): Promise<TransactionHistoryFilters> {
    const res = await apiClient.get<{ success: boolean; data: TransactionHistoryFilters }>(
      "/api/transaction-history/filters"
    );
    return res.data.data;
  },
};
