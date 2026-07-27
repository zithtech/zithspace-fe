'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, notification } from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import { EmployeeExitService } from '@/services/employeeExitService';

export default function ChecklistConfigPage() {
  const [loading, setLoading] = useState(false);
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const [dynamicChecklists, setDynamicChecklists] = useState<Record<string, any[]>>({});
  const [newItemName, setNewItemName] = useState('');

  const fetchChecklistConfigs = useCallback(async () => {
    try {
      const data = await EmployeeExitService.getChecklistConfigs();
      const grouped: Record<string, any[]> = { IT: [], ADMIN: [], FINANCE: [], HR: [] };
      (data || []).forEach((item: any) => {
        if (!grouped[item.department]) {
          grouped[item.department] = [];
        }
        grouped[item.department].push(item);
      });
      setDynamicChecklists(grouped);
    } catch (error) {
      console.error("Failed to load configs", error);
    }
  }, []);

  useEffect(() => {
    fetchChecklistConfigs();
  }, [fetchChecklistConfigs]);

  const handleAddConfig = async (dept: string) => {
    if (!newItemName.trim()) return;
    try {
      setLoading(true);
      await EmployeeExitService.addChecklistConfig(dept, newItemName);
      setNewItemName('');
      await fetchChecklistConfigs();
      notificationApi.success({ message: 'Added successfully' });
    } catch (e: any) {
      notificationApi.error({ message: 'Failed to add item', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (id: string) => {
    try {
      setLoading(true);
      await EmployeeExitService.deleteChecklistConfig(id);
      await fetchChecklistConfigs();
      notificationApi.success({ message: 'Deleted successfully' });
    } catch (e: any) {
      notificationApi.error({ message: 'Failed to delete item', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {notificationContextHolder}
      <div style={{ background: 'var(--bg-primary)', padding: 24, borderRadius: 8, border: '1px solid var(--border-color)' }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 24 }}>Checklist Configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {['IT', 'ADMIN', 'FINANCE', 'HR'].map(dept => (
            <div key={dept} style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-secondary)' }}>
              <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontSize: 16 }}>{dept} Checklist</h4>
              
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input 
                  type="text" 
                  placeholder="New item..." 
                  className="exit-search-input" 
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  onChange={e => setNewItemName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleAddConfig(dept);
                    }
                  }}
                />
                <Button type="primary" icon={<Plus size={16} />} onClick={() => handleAddConfig(dept)} loading={loading} />
              </div>
              
              {dynamicChecklists[dept]?.length === 0 ? (
                <div style={{ color: 'var(--text-slate-400)', fontSize: 13 }}>No items configured.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {dynamicChecklists[dept]?.map(item => (
                    <li key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.itemName}</span>
                      <button onClick={() => handleDeleteConfig(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} disabled={loading}><Trash2 size={14} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
