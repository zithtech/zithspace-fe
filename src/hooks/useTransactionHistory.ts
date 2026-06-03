"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TransactionHistoryService,
  TransactionHistoryListParams,
  TransactionRow,
} from "@/services/transactionHistoryService";

interface UseTransactionHistoryOptions extends TransactionHistoryListParams {
  /** Skip the initial fetch (used when the drawer hasn't opened yet) */
  enabled?: boolean;
}

export function useTransactionHistory(opts: UseTransactionHistoryOptions) {
  const { enabled = true, ...filters } = opts;
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stringified deps so callers can pass new object literals without thrashing
  const filterKey = JSON.stringify(filters);

  const load = useCallback(
    async (cursor?: string) => {
      const isMore = !!cursor;
      isMore ? setLoadingMore(true) : setLoading(true);
      setError(null);
      try {
        const res = await TransactionHistoryService.list({ ...filters, cursor });
        setRows((prev) => (isMore ? [...prev, ...res.data] : res.data));
        setNextCursor(res.nextCursor ?? null);
      } catch (err: any) {
        setError(err?.response?.data?.error ?? err?.message ?? "Failed to load history");
      } finally {
        isMore ? setLoadingMore(false) : setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKey]
  );

  useEffect(() => {
    if (!enabled) return;
    setRows([]);
    setNextCursor(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, enabled]);

  const loadMore = useCallback(() => {
    if (nextCursor && !loadingMore) void load(nextCursor);
  }, [nextCursor, loadingMore, load]);

  const refresh = useCallback(() => {
    setRows([]);
    setNextCursor(null);
    void load();
  }, [load]);

  return {
    rows,
    nextCursor,
    hasMore: !!nextCursor,
    loading,
    loadingMore,
    error,
    loadMore,
    refresh,
  };
}
