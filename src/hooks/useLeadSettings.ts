import { useState, useCallback } from 'react';
import leadSettingsService, { LeadStatus, LeadAction, LeadPlatform } from '@/services/leadSettings.service';

export const useLeadSettings = () => {
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [actions, setActions] = useState<LeadAction[]>([]);
  const [platforms, setPlatforms] = useState<LeadPlatform[]>([]);
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

  const fetchPlatforms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leadSettingsService.getPlatforms();
      setPlatforms(data);
    } catch (error) {
      console.error('Error fetching lead platforms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPlatform = async (data: Partial<LeadPlatform>) => {
    setLoading(true);
    try {
      await leadSettingsService.createPlatform(data);
      await fetchPlatforms();
    } finally {
      setLoading(false);
    }
  };

  const updatePlatform = async (id: string, data: Partial<LeadPlatform>) => {
    setLoading(true);
    try {
      await leadSettingsService.updatePlatform(id, data);
      await fetchPlatforms();
    } finally {
      setLoading(false);
    }
  };

  const deletePlatform = async (id: string) => {
    setLoading(true);
    try {
      await leadSettingsService.deletePlatform(id);
      await fetchPlatforms();
    } finally {
      setLoading(false);
    }
  };

  return {
    statuses,
    actions,
    platforms,
    loading,
    fetchStatuses,
    fetchActions,
    fetchPlatforms,
    createStatus,
    updateStatus,
    deleteStatus,
    createAction,
    updateAction,
    deleteAction,
    createPlatform,
    updatePlatform,
    deletePlatform,
  };
};
