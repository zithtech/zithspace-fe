import { useState, useCallback } from 'react';
import leadSettingsService, { LeadStatus, LeadAction } from '@/services/leadSettings.service';

export const useLeadSettings = () => {
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [actions, setActions] = useState<LeadAction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leadSettingsService.getStatuses();
      setStatuses(data);
    } catch (error) {
      console.error('Error fetching lead statuses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leadSettingsService.getActions();
      setActions(data);
    } catch (error) {
      console.error('Error fetching lead actions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createStatus = async (data: Partial<LeadStatus>) => {
    setLoading(true);
    try {
      await leadSettingsService.createStatus(data);
      await fetchStatuses();
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, data: Partial<LeadStatus>) => {
    setLoading(true);
    try {
      await leadSettingsService.updateStatus(id, data);
      await fetchStatuses();
    } finally {
      setLoading(false);
    }
  };

  const deleteStatus = async (id: string) => {
    setLoading(true);
    try {
      await leadSettingsService.deleteStatus(id);
      await fetchStatuses();
    } finally {
      setLoading(false);
    }
  };

  const createAction = async (data: Partial<LeadAction>) => {
    setLoading(true);
    try {
      await leadSettingsService.createAction(data);
      await fetchActions();
    } finally {
      setLoading(false);
    }
  };

  const updateAction = async (id: string, data: Partial<LeadAction>) => {
    setLoading(true);
    try {
      await leadSettingsService.updateAction(id, data);
      await fetchActions();
    } finally {
      setLoading(false);
    }
  };

  const deleteAction = async (id: string) => {
    setLoading(true);
    try {
      await leadSettingsService.deleteAction(id);
      await fetchActions();
    } finally {
      setLoading(false);
    }
  };

  return {
    statuses,
    actions,
    loading,
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
