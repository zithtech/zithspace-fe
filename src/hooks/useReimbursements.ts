"use client";

import { useEffect, useState } from "react";
import { ReimbursementService } from "@/services/reimbursementService";
import { Reimbursement } from "@/types/reimbursement";

export function useReimbursements() {
  const [data, setData] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await ReimbursementService.getAll();
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    data,
    loading,
    reload: loadData,
  };
}
