'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, notification, Tabs } from 'antd';
import { Plus, Trash2, Monitor, Shield, CreditCard, Users, ClipboardList } from 'lucide-react';
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
      <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <Tabs
          defaultActiveKey="IT"
          size="large"
          tabBarStyle={{ marginBottom: 24, borderBottom: '1px solid var(--border-slate-200)' }}
          style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
          className="checklist-tabs"
          items={['IT', 'ADMIN', 'FINANCE', 'HR'].map(dept => {
            const deptIcons: any = {
              'IT': <Monitor size={16} />,
              'ADMIN': <Shield size={16} />,
              'FINANCE': <CreditCard size={16} />,
              'HR': <Users size={16} />
            };
            
            const deptColors: any = {
              'IT': 'var(--premium-blue)',
              'ADMIN': '#8b5cf6',
              'FINANCE': '#10b981',
              'HR': '#f59e0b'
            };

            const deptBg: any = {
              'IT': 'var(--bg-blue-50)',
              'ADMIN': 'rgba(139, 92, 246, 0.1)',
              'FINANCE': 'rgba(16, 185, 129, 0.1)',
              'HR': 'rgba(245, 158, 11, 0.1)'
            };

            return {
              key: dept,
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                  <span style={{ color: deptColors[dept] }}>{deptIcons[dept]}</span>
                  {dept} Checklist
                </span>
              ),
              children: (
                <div style={{ 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-slate-200)', 
                  borderRadius: 8, 
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1
                }}>
                  <div style={{ 
                    padding: '24px', 
                    borderBottom: '1px solid var(--border-slate-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-slate-50)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ 
                        width: 48, height: 48, borderRadius: 12, 
                        background: deptBg[dept], color: deptColors[dept],
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {React.cloneElement(deptIcons[dept], { size: 24 })}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, color: 'var(--text-slate-900)', fontSize: 18, fontWeight: 600 }}>{dept} Tasks</h4>
                        <div style={{ fontSize: 13, color: 'var(--text-slate-500)', marginTop: 4 }}>
                          Manage the clearance items required by the {dept} department.
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      background: 'var(--bg-primary)', 
                      padding: '6px 12px', 
                      borderRadius: 20, 
                      fontSize: 13, 
                      fontWeight: 600, 
                      color: deptColors[dept],
                      border: `1px solid ${deptBg[dept]}`
                    }}>
                      {dynamicChecklists[dept]?.length || 0} Items
                    </div>
                  </div>
                  
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24, maxWidth: 600 }}>
                      <input 
                        type="text" 
                        placeholder={`Add new task for ${dept}...`} 
                        style={{ 
                          flex: 1, padding: '12px 16px', border: '1px solid var(--border-slate-200)', 
                          borderRadius: 8, background: 'var(--bg-slate-50)', color: 'var(--text-slate-900)',
                          fontSize: 14, outline: 'none', transition: 'all 0.2s'
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = deptColors[dept];
                          e.target.style.background = 'var(--bg-primary)';
                          e.target.style.boxShadow = `0 0 0 2px ${deptBg[dept]}`;
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = 'var(--border-slate-200)';
                          e.target.style.background = 'var(--bg-slate-50)';
                          e.target.style.boxShadow = 'none';
                        }}
                        onChange={e => setNewItemName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddConfig(dept);
                        }}
                      />
                      <Button 
                        type="primary" 
                        icon={<Plus size={16} />} 
                        onClick={() => handleAddConfig(dept)} 
                        loading={loading}
                        style={{ height: 'auto', borderRadius: 8, padding: '0 24px', background: deptColors[dept], fontWeight: 600, border: 'none' }}
                      >
                        Add Task
                      </Button>
                    </div>
                    
                    {dynamicChecklists[dept]?.length === 0 ? (
                      <div style={{ 
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', 
                        justifyContent: 'center', padding: '60px 0', color: 'var(--text-slate-400)',
                        border: '1px dashed var(--border-slate-200)', borderRadius: 8, background: 'var(--bg-slate-50)'
                      }}>
                        <ClipboardList size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
                        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-slate-600)' }}>No tasks configured</div>
                        <div style={{ fontSize: 13, marginTop: 6 }}>Add the first clearance task above to get started.</div>
                      </div>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
                        {dynamicChecklists[dept]?.map((item, idx) => (
                          <li key={item.id} style={{ 
                            display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 20px', 
                            background: 'var(--bg-primary)', border: '1px solid var(--border-slate-200)', 
                            borderRadius: 8, transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.01)'
                          }}>
                              <div style={{ 
                                width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-slate-100)', 
                                color: 'var(--text-slate-500)', fontSize: 12, fontWeight: 600,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                              }}>
                                {idx + 1}
                              </div>
                              <span style={{ fontSize: 14, color: 'var(--text-slate-700)', flex: 1, lineHeight: 1.5 }}>
                                {item.itemName}
                              </span>
                              <button 
                                onClick={() => handleDeleteConfig(item.id)} 
                                style={{ 
                                  background: 'none', border: 'none', cursor: 'pointer', 
                                  color: 'var(--text-slate-400)', padding: 6, display: 'flex',
                                  alignItems: 'center', justifyContent: 'center', borderRadius: 6,
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                                onMouseOut={e => { e.currentTarget.style.color = 'var(--text-slate-400)'; e.currentTarget.style.background = 'transparent'; }}
                                disabled={loading}
                                title="Remove Task"
                              >
                                <Trash2 size={16} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )
              };
            })}
          />
      </div>
    </>
  );
}
