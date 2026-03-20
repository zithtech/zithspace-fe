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
      setStatuses(res.data || []);
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
      setActions(res.data || []);
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

  const deleteStatus = async (id: string) => {
    setLoading(true);
    try {
      await RecruitmentStatusService.delete(id);
      await fetchStatuses(); // Refresh list after delete
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

  const deleteAction = async (id: string) => {
    setLoading(true);
    try {
      await RecruitmentActionService.delete(id);
      await fetchActions();
    } finally {
      setLoading(false);
    }
  };

  return {
    statuses, actions, loading, error, fetchStatuses, fetchActions, createStatus, deleteStatus, createAction, deleteAction
  };
};