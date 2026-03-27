import { useState, useCallback, useEffect } from 'react';
import { MembersService } from '@/services/membersService';

export interface MemberSelectOption {
  value: string;
  label: string;
  email: string;
  position: string;
  role: string;
}

export function useMembersSelect() {
  const [users, setUsers] = useState<MemberSelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await MembersService.getMembersForSelect();
      setUsers(data as any);
    } catch (error: any) {
      console.error("Failed to fetch members for select:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, fetchUsers };
}
