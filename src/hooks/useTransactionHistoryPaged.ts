"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TransactionHistoryService,
  TransactionHistoryPagedParams,
  TransactionRow,
} from "@/services/transactionHistoryService";

interface UseTransactionHistoryPagedOptions
  extends Omit<TransactionHistoryPagedParams, "pageNum"> {
  pageNum: number;
  limit: number;
  enabled?: boolean;
}

/**
 * Offset-paginated hook for the global activity page. Replaces (not appends)
 * rows on every fetch and exposes `total` / `totalPages` for the pager UI.
 *
 * The drawer keeps using the cursor-based `useTransactionHistory`.
 */
export function useTransactionHistoryPaged(opts: UseTransactionHistoryPagedOptions) {
  const { enabled = true, pageNum, limit, ...filters } = opts;
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stringify so callers can pass new object literals each render without thrashing
  const filterKey = JSON.stringify(filters);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await TransactionHistoryService.listPaged({
        ...filters,
        pageNum,
        limit,
      });
      setRows(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? "Failed to load history");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, pageNum, limit]);

  useEffect(() => {
    if (!enabled) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, pageNum, limit, enabled]);

  return {
    rows,
    total,
    totalPages,
    loading,
    error,
    refresh: load,
  };
}
