import { useState, useCallback } from 'react';
import { 
  RecruitmentStatusService, 
  RecruitmentActionService, 
  RecruitmentStatusPayload, 
  RecruitmentActionPayload 
} from '../services/recruitmentSettingsService';

export const useRecruitmentSettings = () => {
  const [statuses, setStatuses] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await RecruitmentStatusService.getAll();
      setStatuses(Array.isArray(res) ? res : (res?.data || []));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch statuses');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await RecruitmentActionService.getAll();
      setActions(Array.isArray(res) ? res : (res?.data || []));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch actions');
    } finally {
      setLoading(false);
    }
  }, []);

  const createStatus = async (data: RecruitmentStatusPayload) => {
    setLoading(true);
    try {
      await RecruitmentStatusService.create(data);
      await fetchStatuses(); // Refresh list after create
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, data: Partial<RecruitmentStatusPayload>) => {
    setLoading(true);
    try {
      const res = await RecruitmentStatusService.update(id, data);
      if (res && res.success === false) throw new Error(res.error || "Failed to update status");
      await fetchStatuses(); // Refresh list after update
    } finally {
      setLoading(false);
    }
  };

  const deleteStatus = async (id: string) => {
    setLoading(true);
    try {
      const res = await RecruitmentStatusService.delete(id);
      if (res && res.success === false) throw new Error(res.error || "Failed to delete status");
      setStatuses(prev => (Array.isArray(prev) ? prev : []).filter(s => s?.id !== id));
    } catch (err) {
      console.error("Delete status error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createAction = async (data: RecruitmentActionPayload) => {
    setLoading(true);
    try {
      await RecruitmentActionService.create(data);
      await fetchActions();
    } finally {
      setLoading(false);
    }
  };

  const updateAction = async (id: string, data: Partial<RecruitmentActionPayload>) => {
    setLoading(true);
    try {
      const res = await RecruitmentActionService.update(id, data);
      if (res && res.success === false) throw new Error(res.error || "Failed to update action");
      await fetchActions();
    } finally {
      setLoading(false);
    }
  };

  const deleteAction = async (id: string) => {
    setLoading(true);
    try {
      const res = await RecruitmentActionService.delete(id);
      if (res && res.success === false) throw new Error(res.error || "Failed to delete action");
      setActions(prev => (Array.isArray(prev) ? prev : []).filter(a => a?.id !== id));
    } catch (err) {
      console.error("Delete action error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    statuses, 
    actions, 
    loading, 
    error, 
    fetchStatuses, 
    fetchActions, 
    createStatus, 
    updateStatus, 
    deleteStatus, 
    createAction, 
    updateAction, 
    deleteAction
  };
};