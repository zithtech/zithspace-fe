import { useState, useCallback, useEffect } from 'react';
import { RBACService, RBACRole } from '@/services/rbacService';
import { message } from 'antd';

export function useRoles() {
  const [roles, setRoles] = useState<RBACRole[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await RBACService.listRoles();
      setRoles(data);
    } catch (error: any) {
      console.error("Failed to fetch roles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return { roles, loading, fetchRoles };
}
