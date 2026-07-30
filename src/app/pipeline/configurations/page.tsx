'use client';

import React, { useEffect, useState } from 'react';
import { PipelineService as pipelineClient } from '@/services/pipelineService';
import { Plus, X, GripVertical, Edit2, Trash2, Eye } from 'lucide-react';
import { PositionService, Position } from '@/services/positionService';
import { AutoComplete, Drawer, Popconfirm } from 'antd';

export default function ConfigurationsPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<any>(null);
  const [viewConfig, setViewConfig] = useState<any>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await pipelineClient.listConfigs();
      if (res.success) {
        setConfigs(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
        <div className="pl-topbar-actions">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="text-slate-500">Loading configurations...</div>
        ) : configs.length === 0 ? (
          <div className="text-slate-500">No configurations found.</div>
        ) : (
          configs.map((c) => (
            <div key={c.id} className="bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50 dark:from-blue-900/20 to-transparent rounded-full -mr-12 -mt-12 opacity-50 pointer-events-none"></div>
              
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => setViewConfig(c)} className="p-1.5 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-lg transition-colors">
                  <Eye size={14} />
                </button>
                <button onClick={() => { setEditConfig(c); setIsModalOpen(true); }} className="p-1.5 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 rounded-lg transition-colors">
                  <Edit2 size={14} />
                </button>
                <Popconfirm
                  title={<span className="dark:text-slate-200">Delete this configuration?</span>}
                  description={<span className="dark:text-slate-400">This action cannot be undone.</span>}
                  onConfirm={async () => {
                    try {
                      await pipelineClient.deleteConfig(c.id);
                      fetchConfigs();
                    } catch (err) {
                      alert('Failed to delete configuration');
                    }
                  }}
                >
                  <button className="p-1.5 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </Popconfirm>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 dark:from-blue-900/50 to-indigo-100 dark:to-indigo-900/50 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm shadow-sm">
                  {c.role.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-200 pr-16 leading-tight">{c.role}</h3>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">
                    Exp: {c.min_experience} - {c.max_experience} Yrs
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Interview Rounds & Criteria</div>
                <div className="flex flex-col gap-2 relative z-10">
                  {c.rounds.map((r: any) => (
                    <div key={r.id} className="flex flex-col gap-1.5 text-sm bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg p-2.5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold border border-blue-100 dark:border-blue-800/50">{r.round_number}</div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[13px]">{r.round_name}</span>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 ml-auto bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">{r.round_type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
        </div>
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

      {isModalOpen && <AddConfigModal editConfig={editConfig} onClose={() => { setIsModalOpen(false); fetchConfigs(); }} />}

      <Drawer
        title={<span className="font-bold text-slate-900 dark:text-slate-200">Configuration Details</span>}
        open={!!viewConfig}
        onClose={() => setViewConfig(null)}
        width={550}
        closeIcon={<X className="text-slate-500 dark:text-slate-400" size={20} />}
        classNames={{ body: 'dark:bg-[#0B0F1A]', header: 'dark:bg-[#0B0F1A] dark:border-slate-800' }}
      >
        {viewConfig && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 dark:from-blue-900/50 to-indigo-100 dark:to-indigo-900/50 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-2xl shadow-sm">
                {viewConfig.role.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-2xl text-slate-900 dark:text-slate-200 leading-tight">{viewConfig.role}</h3>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  Experience: {viewConfig.min_experience} - {viewConfig.max_experience} Years
                </div>
              </div>
            </div>
            
            <div className="pl-divider" style={{ margin: '0 -24px' }}></div>

            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                Interview Rounds ({viewConfig.rounds.length})
              </h4>
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
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

function AddConfigModal({ onClose, editConfig }: { onClose: () => void, editConfig?: any }) {
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
        setTimeout(() => onClose(), 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save configuration');
    }
  };

  return (
    <Drawer
      title={editConfig ? "Edit Configuration" : "New Configuration"}
      placement="right"
      width={700}
      onClose={onClose}
      open={true}
      className="z-[9999]"
      styles={{ body: { padding: 0 } }}
    >
      <div className="flex flex-col h-full">
        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-md border border-green-100">Configuration saved!</div>}

          <form id="configForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Job Role</label>
                <AutoComplete
                  className="w-full"
                  placeholder="Select or type a role..."
                  value={formData.role || undefined}
                  onChange={(val) => setFormData({ ...formData, role: val })}
                  filterOption={(input, option) =>
                    (option?.value ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                  options={positions.map((p) => ({
                    value: p.title,
                    label: p.title,
                  }))}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Min Exp (Yrs)</label>
                <input required type="number" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" value={formData.min_experience} onChange={(e) => setFormData({ ...formData, min_experience: parseFloat(e.target.value) })} />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Max Exp (Yrs)</label>
                <input required type="number" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" value={formData.max_experience} onChange={(e) => setFormData({ ...formData, max_experience: parseFloat(e.target.value) })} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-slate-800">Interview Rounds</label>
                {!rounds.some(r => r.is_final_round) && (
                  <button type="button" onClick={() => setRounds([...rounds, { round_name: '', round_type: 'Technical', is_start_round: rounds.length === 0, is_final_round: false }])} className="text-xs text-blue-600 font-semibold">+ Add Round</button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {rounds.map((r, i) => (
                  <div key={i} className="flex flex-col gap-2 bg-slate-50 border border-slate-100 rounded p-3">
                    <div className="flex items-center gap-2">
                      <GripVertical size={16} className="text-slate-300 cursor-move" />
                      <span className="text-xs font-bold text-slate-400 w-4">{i + 1}.</span>
                      <input required type="text" className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-sm outline-none" value={r.round_name} onChange={(e) => { const n = [...rounds]; n[i].round_name = e.target.value; setRounds(n); }} placeholder="Round Name" />
                      <select className="border border-slate-200 rounded-md px-2 py-1 text-sm outline-none bg-white" value={r.round_type} onChange={(e) => { const n = [...rounds]; n[i].round_type = e.target.value; setRounds(n); }}>
                        <option>Technical</option>
                        <option>HR</option>
                        <option>Managerial</option>
                        <option>Practical</option>
                      </select>
                      
                      <div className="flex items-center gap-3 ml-2">
                        <label className="flex items-center gap-1 text-xs text-slate-600">
                          <input type="checkbox" checked={r.is_start_round} onChange={(e) => {
                            const n = [...rounds];
                            if (e.target.checked) n.forEach(x => x.is_start_round = false);
                            n[i].is_start_round = e.target.checked;
                            setRounds(n);
                          }} /> First
                        </label>
                        <label className="flex items-center gap-1 text-xs text-slate-600">
                          <input type="checkbox" checked={r.is_final_round} onChange={(e) => {
                            const n = [...rounds];
                            if (e.target.checked) n.forEach(x => x.is_final_round = false);
                            n[i].is_final_round = e.target.checked;
                            // If marked final, remove any subsequent rounds
                            if (e.target.checked) n.splice(i + 1);
                            setRounds(n);
                          }} /> Final
                        </label>
                      </div>

                      <button type="button" onClick={() => setRounds(rounds.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 ml-2"><X size={16} /></button>
                    </div>
                    
                    {/* Round Scorecards UI */}
                    <div className="ml-8 mt-1 p-3 bg-white border border-slate-100 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700">Scorecard Criteria (Round {i+1})</label>
                      <button type="button" onClick={() => {
                        const n = [...rounds];
                        n[i].scorecards = [...(n[i].scorecards || []), { criteria_name: '', weight_percentage: 0 }];
                        setRounds(n);
                      }} className="text-xs text-blue-600 font-semibold">+ Add Criteria</button>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {(r.scorecards || []).map((s: any, scIdx: number) => (
                        <div key={scIdx} className="flex items-center gap-2">
                          <input required type="text" className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-xs outline-none" value={s.criteria_name} onChange={(e) => {
                            const n = [...rounds];
                            n[i].scorecards[scIdx].criteria_name = e.target.value;
                            setRounds(n);
                          }} placeholder="Criteria (e.g. System Design)" />
                          
                          <input required type="number" className="w-16 border border-slate-200 rounded-md px-2 py-1 text-xs outline-none" value={s.weight_percentage} onChange={(e) => {
                            const n = [...rounds];
                            n[i].scorecards[scIdx].weight_percentage = parseInt(e.target.value) || 0;
                            setRounds(n);
                          }} placeholder="%" />
                          <span className="text-slate-500 text-xs">%</span>
                          <button type="button" onClick={() => {
                            const n = [...rounds];
                            n[i].scorecards = n[i].scorecards.filter((_: any, sId: number) => sId !== scIdx);
                            setRounds(n);
                          }} className="text-red-400 hover:text-red-600 ml-1"><X size={14} /></button>
                        </div>
                      ))}
                      
                      {r.scorecards && r.scorecards.length > 0 && (
                        <div className="text-xs text-slate-500 mt-1">
                          Total Weight: <strong className={r.scorecards.reduce((sum: number, s: any) => sum + Number(s.weight_percentage), 0) === 100 ? 'text-green-600' : 'text-red-500'}>
                            {r.scorecards.reduce((sum: number, s: any) => sum + Number(s.weight_percentage), 0)}%
                          </strong>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-md transition-colors">
            Cancel
          </button>
          <button type="submit" form="configForm" className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors">
            Save Configuration
          </button>
        </div>
      </div>
    </Drawer>
  );
}
