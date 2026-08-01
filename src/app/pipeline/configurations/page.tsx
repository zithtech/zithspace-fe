'use client';

import React, { useEffect, useState } from 'react';
import { PipelineService as pipelineClient } from '@/services/pipelineService';
import { Plus, X, GripVertical, Edit2, Trash2, Eye, LayoutGrid, List, MoreVertical, FileText, Settings, AlignLeft } from 'lucide-react';
import { PositionService, Position } from '@/services/positionService';
import { AutoComplete, Drawer, Table, Dropdown, Button } from 'antd';
import '@/app/proposals/library.css';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { commonDrawerProps, drawerFormStyles, SectionCard } from "@/components/common/DrawerSection";
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { SearchableDropdown } from "@/components/common/SearchableDropdown";

export default function ConfigurationsPage() {
  const menuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
    <div className="pp-menu-item">
      <span className="pp-menu-ic" style={{ color, background: tint }}>{icon}</span>
      <span className="pp-menu-text">
        <span className="pp-menu-title">{title}</span>
        <span className="pp-menu-desc">{desc}</span>
      </span>
    </div>
  );

  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<any>(null);
  const [viewConfig, setViewConfig] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'card'|'table'>('table');

  const fetchConfigs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await pipelineClient.listConfigs();
      if (res.success) {
        setConfigs(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return (
    <>
      <div className="pl-topbar">
        <div className="pl-topbar-meta">
          <span className="pl-meta-item"><span className="pl-pulse" /><strong>{configs.length}</strong> configurations</span>
        </div>
        <div className="pl-topbar-actions flex items-center gap-3">
          <div className="pp-segmented">
            <button
              type="button"
              className={viewMode === "table" ? "is-active" : ""}
              onClick={() => setViewMode("table")}
              aria-label="Table view"
            >
              <List size={14} />
            </button>
            <button
              type="button"
              className={viewMode === "card" ? "is-active" : ""}
              onClick={() => setViewMode("card")}
              aria-label="Card view"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
          <button
            onClick={() => { setEditConfig(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
          >
            <Plus size={14} /> New Configuration
          </button>
        </div>
      </div>

      <div className="pl-divider" />

      <div className="pl-body">
        {loading ? (
          <div className="col-span-full text-center py-8 text-slate-500 w-full">Loading configurations...</div>
        ) : configs.length === 0 ? (
          <div className="col-span-full text-center py-8 text-slate-500 w-full">No configurations found.</div>
        ) : viewMode === 'card' ? (
          <div className="pp-grid">
            {configs.map((c) => {
              const initials = c.role.substring(0, 2).toUpperCase();
              
              const menuItems = [
                { key: "view", label: menuLabel("View Details", "Open configuration", <Eye size={14} />, '#3b82f6', 'rgba(59,130,246,0.12)'), onClick: () => setViewConfig(c) },
                { key: "edit", label: menuLabel("Edit Configuration", "Modify configuration", <Edit2 size={14} />, '#64748b', 'rgba(100,116,139,0.12)'), onClick: () => { setEditConfig(c); setIsModalOpen(true); } },
                { type: "divider" as const },
                {
                  key: "delete",
                  label: (
                    <ConfirmDialog
                      title="Delete configuration?"
                      description="Are you sure you want to delete this configuration?"
                      tone="danger"
                      confirmText="Delete"
                      onConfirm={async () => {
                        try {
                          await pipelineClient.deleteConfig(c.id);
                          fetchConfigs();
                        } catch (err) {
                          alert('Failed to delete configuration');
                        }
                      }}
                    >
                      <div style={{ margin: '-5px -12px', padding: '5px 12px' }} onClick={e => e.stopPropagation()}>
                        {menuLabel("Delete Configuration", "Remove configuration", <Trash2 size={14} />, '#ef4444', 'rgba(239,68,68,0.12)')}
                      </div>
                    </ConfirmDialog>
                  )
                }
              ];

              return (
                <div key={c.id} className="pc-card">
                  <div className="pc-top">
                    <div
                      className="pc-avatar"
                      style={{
                        background: `linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)`,
                      }}
                    >
                      {initials}
                    </div>
                    <div className="pc-identity-body">
                      <div className="pc-title" style={{ fontSize: '13px' }}>
                        {c.role}
                      </div>
                      <div className="pc-client-line">
                        <span className="pc-client-key">Experience:</span>
                        <span className="pc-client-val">{c.min_experience} - {c.max_experience} Yrs</span>
                      </div>
                    </div>
                    <Dropdown menu={{ items: menuItems }} overlayClassName="pp-action-pop" trigger={["click"]} placement="bottomRight">
                      <button type="button" className="pc-actions" onClick={e => e.stopPropagation()}>
                        <MoreVertical size={16} />
                      </button>
                    </Dropdown>
                  </div>
                  <div className="pc-foot">
                    <div className="pc-foot-row">
                      <span className="pc-foot-item">
                        <span className="pc-foot-key">Rounds:</span>
                        <span className="pc-foot-val">{c.rounds?.length || 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="pp-table-wrap">
            <Table
              size="small"
              dataSource={configs}
              rowKey="id"
              pagination={false}
              className="pp-table"
              scroll={{ x: 800 }}
              onRow={(record) => ({
                onClick: (e) => {
                  const t = e.target as HTMLElement;
                  if (t.closest('button, input, .ant-select, .ant-dropdown, .ant-popover, .ant-popconfirm, .ant-modal, .ant-menu, .ant-dropdown-menu')) return;
                  setViewConfig(record);
                },
                className: 'pp-row',
                style: { cursor: 'pointer' }
              })}
              columns={[
                {
                  title: "ROLE",
                  key: "role",
                  render: (_, record) => (
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="flex h-7.5 w-7.5 items-center justify-center rounded-none text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--bg-blue-50)', color: '#3b82f6', width: 30, height: 30 }}>
                        {record.role.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate" style={{ lineHeight: 1.25 }}>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-[13px] truncate">{record.role}</div>
                      </div>
                    </div>
                  )
                },
                {
                  title: "EXPERIENCE (YRS)",
                  key: "experience",
                  render: (_, record) => <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">{record.min_experience} - {record.max_experience} Yrs</span>
                },
                {
                  title: "ROUNDS",
                  key: "rounds",
                  render: (_, record) => <span className="text-[13px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800">{record.rounds?.length || 0} Rounds</span>
                },
                {
                  title: "ACTIONS",
                  key: "actions",
                  align: "center",
                  width: 80,
                  fixed: "right",
                  render: (_, record) => {
                    const menuItems = [
                      { key: "view", label: menuLabel("View Details", "Open configuration", <Eye size={14} />, '#3b82f6', 'rgba(59,130,246,0.12)'), onClick: () => setViewConfig(record) },
                      { key: "edit", label: menuLabel("Edit Configuration", "Modify configuration", <Edit2 size={14} />, '#64748b', 'rgba(100,116,139,0.12)'), onClick: () => { setEditConfig(record); setIsModalOpen(true); } },
                      { type: "divider" as const },
                      {
                        key: "delete",
                        label: (
                          <ConfirmDialog
                            title="Delete configuration?"
                            description="Are you sure you want to delete this configuration?"
                            tone="danger"
                            confirmText="Delete"
                            onConfirm={async () => {
                              try {
                                await pipelineClient.deleteConfig(record.id);
                                fetchConfigs();
                              } catch (err) {
                                alert('Failed to delete configuration');
                              }
                            }}
                          >
                            <div style={{ margin: '-5px -12px', padding: '5px 12px' }} onClick={e => e.stopPropagation()}>
                              {menuLabel("Delete Configuration", "Remove configuration", <Trash2 size={14} />, '#ef4444', 'rgba(239,68,68,0.12)')}
                            </div>
                          </ConfirmDialog>
                        )
                      }
                    ];
                    return (
                      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight" overlayClassName="pp-action-pop">
                        <button
                          type="button"
                          className="pc-actions hover:bg-slate-100 dark:hover:bg-slate-800"
                          style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical size={16} style={{ color: 'var(--text-slate-400)' }} />
                        </button>
                      </Dropdown>
                    );
                  }
                }
              ]}
            />
          </div>
        )}
      </div>

      <div className="pl-footer pl-footer--sticky">
        <div className="pl-footer-info">
          Showing <strong>1–{configs.length}</strong> of <strong>{configs.length}</strong> configurations
        </div>
        <div className="pl-pager">
          <button type="button" className="pl-pager-btn" disabled>‹</button>
          <button type="button" className="pl-pager-num is-active">1</button>
          <button type="button" className="pl-pager-btn" disabled>›</button>
        </div>
      </div>

      {isModalOpen && <AddConfigModal editConfig={editConfig} onClose={(saved) => { setIsModalOpen(false); if (saved) fetchConfigs(true); }} />}

      <Drawer
        {...commonDrawerProps}
        open={!!viewConfig}
        onClose={() => setViewConfig(null)}
        width={600}
      >
        <style dangerouslySetInnerHTML={{ __html: drawerFormStyles }} />
        {viewConfig && (
          <div className="absolute inset-0 flex flex-col bg-slate-50 dark:bg-[#0B0F1A]">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F1A] shrink-0">
              <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">Configuration Details</h2>
              <button type="button" onClick={() => setViewConfig(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 customer-drawer-form">
              <div className="flex flex-col gap-6">
                <SectionCard title="Basic Details" icon={<Settings size={14} />} step="STEP 1">
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Job Role</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-200">{viewConfig.role}</div>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Experience Range</div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{viewConfig.min_experience} - {viewConfig.max_experience} Years</div>
                  </div>
                </SectionCard>

                <SectionCard title="Interview Rounds" icon={<AlignLeft size={14} />} step="STEP 2">
                  <div className="flex flex-col gap-4">
                    {viewConfig.rounds.map((r: any) => (
                      <div key={r.id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center text-sm font-bold border border-blue-200 dark:border-blue-800/50">{r.round_number}</div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-base">{r.round_name}</span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-auto bg-white dark:bg-[#0B0F1A] px-2 py-1 rounded border border-slate-200 dark:border-slate-800">{r.round_type}</span>
                        </div>
                        {r.scorecards && r.scorecards.length > 0 ? (
                          <div className="flex flex-col gap-2 mt-2 pl-10">
                            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Scorecards</div>
                            {r.scorecards.map((s: any) => (
                              <div key={s.id} className="flex justify-between items-center text-sm bg-white dark:bg-[#0B0F1A] border border-slate-100 dark:border-slate-800 px-3 py-2 rounded-lg">
                                <span className="font-medium text-slate-700 dark:text-slate-300">{s.criteria_name}</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded text-xs">{s.weight_percentage}%</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400 dark:text-slate-500 italic pl-10">No scorecards defined.</div>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

function AddConfigModal({ onClose, editConfig }: { onClose: (saved?: boolean) => void, editConfig?: any }) {
  const [formData, setFormData] = useState({
    role: editConfig?.role || '',
    min_experience: editConfig?.min_experience || 0,
    max_experience: editConfig?.max_experience || 5,
  });
  const [rounds, setRounds] = useState<any[]>(editConfig?.rounds?.map((r: any) => ({ 
    ...r, 
    scorecards: r.scorecards?.map((s: any) => ({...s})) || [] 
  })) || [
    { 
      round_name: 'Technical Screening', 
      round_type: 'Technical', 
      is_start_round: true, 
      is_final_round: false,
      scorecards: [{ criteria_name: 'Technical Skills', weight_percentage: 100 }]
    }
  ]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    PositionService.getAll().then(setPositions).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // validate weights
    for (const r of rounds) {
      if (r.scorecards && r.scorecards.length > 0) {
        const totalWeight = r.scorecards.reduce((sum: number, s: any) => sum + Number(s.weight_percentage), 0);
        if (totalWeight !== 100) {
          setError(`Scorecard weights for round "${r.round_name}" must total exactly 100%`);
          return;
        }
      }
    }

    const payload = {
      ...formData,
      rounds: rounds.map((r, i) => ({ ...r, round_number: i + 1 }))
    };

    try {
      let res;
      if (editConfig) {
        res = await pipelineClient.updateConfig(editConfig.id, payload);
      } else {
        res = await pipelineClient.createConfig(payload);
      }
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose(true);
        }, 1000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save configuration');
    }
  };

  return (
    <Drawer
      {...commonDrawerProps}
      width={700}
      onClose={() => onClose(false)}
      open={true}
    >
      <style dangerouslySetInnerHTML={{ __html: drawerFormStyles }} />
      <div className="absolute inset-0 flex flex-col bg-slate-50 dark:bg-[#0B0F1A]">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F1A] shrink-0">
          <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">{editConfig ? "Edit Configuration" : "New Configuration"}</h2>
          <button type="button" onClick={() => onClose(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 customer-drawer-form">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-md border border-green-100">Configuration saved!</div>}

          <div className="flex flex-col gap-6">
            <form id="configForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
            <SectionCard title="Basic Details" icon={<Settings size={14} />} step="STEP 1">
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Job Role</label>
                <SearchableDropdown
                  placeholder="Select a role..."
                  value={formData.role || undefined}
                  onChange={(val) => setFormData({ ...formData, role: val })}
                  options={positions.map((p) => ({ value: p.title, label: p.title }))}
                />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Min Exp (Yrs)</label>
                <input required type="number" className="w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" value={formData.min_experience} onChange={(e) => setFormData({ ...formData, min_experience: parseFloat(e.target.value) })} />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Max Exp (Yrs)</label>
                <input required type="number" className="w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" value={formData.max_experience} onChange={(e) => setFormData({ ...formData, max_experience: parseFloat(e.target.value) })} />
              </div>
            </SectionCard>

            <SectionCard title="Interview Rounds" icon={<AlignLeft size={14} />} step="STEP 2">
              <div className="flex flex-col gap-2">
                {!rounds.some(r => r.is_final_round) && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setRounds([...rounds, { round_name: '', round_type: 'Technical', is_start_round: rounds.length === 0, is_final_round: false }])} className="text-xs text-blue-600 font-semibold">+ Add Round</button>
                  </div>
                )}
                {rounds.map((r, i) => (
                  <div key={i} className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <GripVertical size={16} className="text-slate-300 dark:text-slate-600 cursor-move" />
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-4">{i + 1}.</span>
                      <input required type="text" className="flex-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0F1A] dark:text-slate-200 rounded-md px-2 py-1.5 text-sm outline-none focus:border-blue-500 transition-colors" value={r.round_name} onChange={(e) => { const n = [...rounds]; n[i].round_name = e.target.value; setRounds(n); }} placeholder="Round Name" />
                      <div className="w-[140px]">
                        <SearchableDropdown
                          placeholder="Type"
                          value={r.round_type}
                          onChange={(val) => { const n = [...rounds]; n[i].round_type = val; setRounds(n); }}
                          options={[
                            { value: 'Technical', label: 'Technical' },
                            { value: 'HR', label: 'HR' },
                            { value: 'Managerial', label: 'Managerial' },
                            { value: 'Practical', label: 'Practical' },
                          ]}
                        />
                      </div>
                      
                      <div className="flex items-center gap-3 ml-2">
                        <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <input type="checkbox" checked={r.is_final_round} onChange={(e) => {
                            const n = [...rounds];
                            n.forEach(rd => rd.is_final_round = false);
                            n[i].is_final_round = e.target.checked;
                            setRounds(n);
                          }} className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-[#0B0F1A]" /> Final
                        </label>
                      </div>
                      <button type="button" onClick={() => setRounds(rounds.filter((_, idx) => idx !== i))} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 ml-2 transition-colors"><X size={16} /></button>
                    </div>

                    <div className="pl-6 border-l-2 border-slate-200 dark:border-slate-700 ml-[11px] mt-2 pb-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Evaluation Scorecards</span>
                        <button type="button" onClick={() => {
                          const n = [...rounds];
                          if (!n[i].scorecards) n[i].scorecards = [];
                          n[i].scorecards.push({ criteria_name: '', weight_percentage: 20 });
                          setRounds(n);
                        }} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors">+ Add Criteria</button>
                      </div>
                      
                      {r.scorecards?.map((sc: any, scIdx: number) => (
                        <div key={scIdx} className="flex justify-between items-center bg-white dark:bg-[#0B0F1A] border border-slate-100 dark:border-slate-800 rounded-md px-2 py-1.5 mb-1.5 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                          <input required type="text" placeholder="Criteria Name" className="text-[13px] font-medium bg-transparent outline-none flex-1 text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600" value={sc.criteria_name} onChange={(e) => {
                            const n = [...rounds];
                            n[i].scorecards[scIdx].criteria_name = e.target.value;
                            setRounds(n);
                          }} />
                          <div className="flex items-center gap-2 border-l border-slate-100 dark:border-slate-800 pl-2 ml-2">
                            <input required type="number" placeholder="%" className="w-14 text-[13px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded outline-none text-right border border-blue-100 dark:border-blue-800/50" value={sc.weight_percentage} onChange={(e) => {
                              const n = [...rounds];
                              n[i].scorecards[scIdx].weight_percentage = Number(e.target.value);
                              setRounds(n);
                            }} />
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">%</span>
                          </div>
                          <button type="button" onClick={() => {
                            const n = [...rounds];
                            n[i].scorecards = n[i].scorecards.filter((_: any, sId: number) => sId !== scIdx);
                            setRounds(n);
                          }} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 ml-2 transition-colors"><X size={14} /></button>
                        </div>
                      ))}
                      
                      {r.scorecards && r.scorecards.length > 0 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 rounded-md border border-slate-100 dark:border-slate-800">
                          <span className="font-medium">Total Weight</span>
                          <strong className={r.scorecards.reduce((sum: number, s: any) => sum + Number(s.weight_percentage), 0) === 100 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
                            {r.scorecards.reduce((sum: number, s: any) => sum + Number(s.weight_percentage), 0)}%
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </form>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F1A] flex justify-end gap-3 shrink-0">
          <button type="button" onClick={() => onClose(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors border border-transparent dark:border-slate-700">
            Cancel
          </button>
          <button type="submit" form="configForm" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm">
            Save Configuration
          </button>
        </div>
      </div>
    </Drawer>
  );
}
