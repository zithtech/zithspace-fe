import { useState, useCallback } from 'react';
import leadSettingsService, { LeadStatus, LeadAction, LeadPlatform, LeadSettingsPaginationParams } from '@/services/leadSettings.service';

export const useLeadSettings = () => {
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [actions, setActions] = useState<LeadAction[]>([]);
  const [platforms, setPlatforms] = useState<LeadPlatform[]>([]);
  const [statusesPagination, setStatusesPagination] = useState({ current: 1, pageSize: 15, total: 0, totalPages: 1 });
  const [actionsPagination, setActionsPagination] = useState({ current: 1, pageSize: 15, total: 0, totalPages: 1 });
  const [platformsPagination, setPlatformsPagination] = useState({ current: 1, pageSize: 15, total: 0, totalPages: 1 });
  const [statusesStats, setStatusesStats] = useState<any>(null);
  const [actionsStats, setActionsStats] = useState<any>(null);
  const [platformsStats, setPlatformsStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatuses = useCallback(async (params?: LeadSettingsPaginationParams) => {
    setLoading(true);
    try {
      const res = await leadSettingsService.getStatuses(params);
      if (res && res.data && res.pagination) {
        setStatuses(res.data);
        setStatusesPagination({
          current: res.pagination.page,
          pageSize: res.pagination.limit,
          total: res.pagination.total,
          totalPages: res.pagination.totalPages,
        });
        if (res.stats) setStatusesStats(res.stats);
        return res;
      } else {
        const list = Array.isArray(res) ? res : res?.data || [];
        setStatuses(list);
        setStatusesPagination({
          current: 1,
          pageSize: list.length || 15,
          total: list.length,
          totalPages: 1,
        });
        return res;
      }
    } catch (error) {
      console.error('Error fetching lead statuses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActions = useCallback(async (params?: LeadSettingsPaginationParams) => {
    setLoading(true);
    try {
      const res = await leadSettingsService.getActions(params);
      if (res && res.data && res.pagination) {
        setActions(res.data);
        setActionsPagination({
          current: res.pagination.page,
          pageSize: res.pagination.limit,
          total: res.pagination.total,
          totalPages: res.pagination.totalPages,
        });
        if (res.stats) setActionsStats(res.stats);
        return res;
      } else {
        const list = Array.isArray(res) ? res : res?.data || [];
        setActions(list);
        setActionsPagination({
          current: 1,
          pageSize: list.length || 15,
          total: list.length,
          totalPages: 1,
        });
        return res;
      }
    } catch (error) {
      console.error('Error fetching lead actions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlatforms = useCallback(async (params?: LeadSettingsPaginationParams) => {
    setLoading(true);
    try {
      const res = await leadSettingsService.getPlatforms(params);
      if (res && res.data && res.pagination) {
        setPlatforms(res.data);
        setPlatformsPagination({
          current: res.pagination.page,
          pageSize: res.pagination.limit,
          total: res.pagination.total,
          totalPages: res.pagination.totalPages,
        });
        if (res.stats) setPlatformsStats(res.stats);
        return res;
      } else {
        const list = Array.isArray(res) ? res : res?.data || [];
        setPlatforms(list);
        setPlatformsPagination({
          current: 1,
          pageSize: list.length || 15,
          total: list.length,
          totalPages: 1,
        });
        return res;
      }
    } catch (error) {
      console.error('Error fetching lead platforms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createStatus = async (data: Partial<LeadStatus>) => {
    setLoading(true);
    try {
      await leadSettingsService.createStatus(data);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, data: Partial<LeadStatus>) => {
    setLoading(true);
    try {
      await leadSettingsService.updateStatus(id, data);
    } finally {
      setLoading(false);
    }
  };

  const deleteStatus = async (id: string) => {
    setLoading(true);
    try {
      await leadSettingsService.deleteStatus(id);
    } finally {
      setLoading(false);
    }
  };

  const createAction = async (data: Partial<LeadAction>) => {
    setLoading(true);
    try {
      await leadSettingsService.createAction(data);
    } finally {
      setLoading(false);
    }
  };

  const updateAction = async (id: string, data: Partial<LeadAction>) => {
    setLoading(true);
    try {
      await leadSettingsService.updateAction(id, data);
    } finally {
      setLoading(false);
    }
  };

  const deleteAction = async (id: string) => {
    setLoading(true);
    try {
      await leadSettingsService.deleteAction(id);
    } finally {
      setLoading(false);
    }
  };

  const createPlatform = async (data: Partial<LeadPlatform>) => {
    setLoading(true);
    try {
      await leadSettingsService.createPlatform(data);
    } finally {
      setLoading(false);
    }
  };

  const updatePlatform = async (id: string, data: Partial<LeadPlatform>) => {
    setLoading(true);
    try {
      await leadSettingsService.updatePlatform(id, data);
    } finally {
      setLoading(false);
    }
  };

  const deletePlatform = async (id: string) => {
    setLoading(true);
    try {
      await leadSettingsService.deletePlatform(id);
    } finally {
      setLoading(false);
    }
  };

  return {
    statuses,
    actions,
    platforms,
    statusesPagination,
    actionsPagination,
    platformsPagination,
    statusesStats,
    actionsStats,
    platformsStats,
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
