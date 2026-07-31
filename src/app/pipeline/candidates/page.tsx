'use client';

import React, { useEffect, useState } from 'react';
import { PipelineService as pipelineClient } from '@/services/pipelineService';
import Link from 'next/link';
import '@/app/proposals/library.css';
import { Plus, Search, Eye, FileText, X, Edit2, Trash2, LayoutGrid, List, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PositionService, Position } from '@/services/positionService';
import { AutoComplete, Drawer, Table, Dropdown, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { commonDrawerProps, drawerFormStyles, SectionCard } from "@/components/common/DrawerSection";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { usePermission } from '@/hooks/usePermission';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCandidate, setEditCandidate] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const { canCreateRecruitment, canUpdateRecruitment, canDeleteRecruitment } = usePermission();

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await pipelineClient.listCandidates({ search });
      if (res.success) {
        setCandidates(res.data.candidates);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [search]);

  const menuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
    <div className="pp-menu-item">
      <span className="pp-menu-ic" style={{ color, background: tint }}>{icon}</span>
      <span className="pp-menu-text">
        <span className="pp-menu-title">{title}</span>
        <span className="pp-menu-desc">{desc}</span>
      </span>
    </div>
  );

  const getMenuItems = (record: any): MenuProps['items'] => [
    {
      key: "view",
      label: menuLabel("View Profile", "Open detailed view", <Eye size={14} />, '#3b82f6', 'rgba(59,130,246,0.12)'),
      onClick: () => router.push(`/pipeline/candidates/${record.id}`)
    },
    ...(canUpdateRecruitment ? [{
      key: "edit",
      label: menuLabel("Edit Candidate", "Modify candidate details", <Edit2 size={14} />, '#64748b', 'rgba(100,116,139,0.12)'),
      onClick: () => { setEditCandidate(record); setIsModalOpen(true); }
    }] : []),
    ...(canDeleteRecruitment ? [
      { type: "divider" as const },
      {
        key: "delete",
        label: (
          <ConfirmDialog
            title="Delete candidate?"
            description="Are you sure you want to delete this candidate?"
            tone="danger"
            confirmText="Delete"
            onConfirm={async () => {
              try {
                await pipelineClient.deleteCandidate(record.id);
                fetchCandidates();
              } catch (err) {
                alert('Failed to delete candidate');
              }
            }}
          >
            <div style={{ margin: '-5px -12px', padding: '5px 12px' }} onClick={e => e.stopPropagation()}>
              {menuLabel("Delete Candidate", "Remove from pipeline", <Trash2 size={14} />, '#ef4444', 'rgba(239,68,68,0.12)')}
            </div>
          </ConfirmDialog>
        )
      }
    ] : [])
  ];

  const columns: ColumnsType<any> = [
    {
      title: "CANDIDATE",
      key: "candidate",
      width: 250,
      render: (_, record) => {
        const initials = record.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
        return (
          <div className="flex items-center gap-2.5 truncate">
            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-none text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--bg-blue-50)', color: '#3b82f6', width: 30, height: 30 }}>
              {initials}
            </div>
            <div className="truncate" style={{ lineHeight: 1.25 }}>
              <div className="font-bold truncate" style={{ color: 'var(--text-slate-900)', fontSize: 12.5 }}>
                {record.name}
              </div>
              <div className="text-[10px] truncate" style={{ color: 'var(--text-slate-400)' }}>
                {record.email} • {record.mobile}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "ROLE",
      dataIndex: "role",
      width: 150,
      render: (role: string) => (
        <span style={{ color: "var(--text-slate-700)", fontSize: 12.5, fontWeight: 600 }}>{role}</span>
      ),
    },
    {
      title: "EXPERIENCE",
      dataIndex: "total_experience",
      width: 120,
      render: (exp: number) => (
        <span style={{ color: "var(--text-slate-500)", fontSize: 11.5 }}>{exp} Yrs</span>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 150,
      render: (status: string) => {
        let statusColor = '#64748b';
        let bgColor = 'rgba(100,116,139,0.10)';
        let ringColor = 'rgba(100,116,139,0.25)';
        
        if (status === 'Interviewing') {
           statusColor = '#3b82f6'; bgColor = 'rgba(59,130,246,0.10)'; ringColor = 'rgba(59,130,246,0.25)';
        }
        if (status === 'Offered') {
           statusColor = '#10b981'; bgColor = 'rgba(16,185,129,0.10)'; ringColor = 'rgba(16,185,129,0.25)';
        }
        if (status === 'Onboarded') {
           statusColor = '#059669'; bgColor = 'rgba(5,150,105,0.10)'; ringColor = 'rgba(5,150,105,0.25)';
        }
        if (status === 'Rejected') {
           statusColor = '#ef4444'; bgColor = 'rgba(239,68,68,0.10)'; ringColor = 'rgba(239,68,68,0.25)';
        }

        return (
          <span
            style={{
              padding: "4px 9px",
              borderRadius: 6,
              fontSize: 10.5,
              fontWeight: 700,
              lineHeight: "1",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              border: `1px solid ${ringColor}`,
              color: statusColor,
              background: bgColor,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap"
            }}
          >
            {status}
          </span>
        );
      },
    },
    {
      title: "ACTIONS",
      align: "center",
      width: 80,
      fixed: "right" as const,
      render: (_, record) => {
        return (
          <Dropdown menu={{ items: getMenuItems(record) }} trigger={['click']} placement="bottomRight" overlayClassName="pp-action-pop">
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
  ];

  return (
    <>
      <div className="pl-topbar">
        <div className="pl-search-wrap">
          <Search className="pl-search-icon" size={14} />
          <input
            className="pl-search"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="pl-topbar-meta">
          <span className="pl-meta-item"><span className="pl-pulse" /><strong>{candidates.length}</strong> candidates</span>
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
          {canCreateRecruitment && (
            <button
              onClick={() => { setEditCandidate(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
            >
              <Plus size={14} /> Add Candidate
            </button>
          )}
        </div>
      </div>

      <div className="pl-divider" />

      <div className="pl-body">
        {viewMode === "table" ? (
          <div className="pp-table-wrap">
            <Table
              size="small"
              columns={columns}
              dataSource={candidates.map(c => ({ ...c, key: c.id }))}
              loading={loading}
              pagination={false}
              className="pp-table"
              scroll={{ x: 800 }}
              onRow={(record) => ({
                onClick: (e) => {
                  const t = e.target as HTMLElement;
                  if (t.closest('button, input, .ant-select, .ant-dropdown, .ant-popover, .ant-popconfirm, .ant-modal, .ant-menu')) return;
                  router.push(`/pipeline/candidates/${record.id}`);
                },
                className: 'pp-row',
                style: { cursor: 'pointer' }
              })}
            />
          </div>
        ) : (
          <div className="pp-grid">
            {loading ? (
              <div className="col-span-full text-center py-8 text-slate-500 w-full">Loading...</div>
            ) : candidates.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-500 w-full">No candidates found.</div>
            ) : (
              candidates.map((c) => {
                const initials = c.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                let statusColor = '#64748b'; // default slate
                if (c.status === 'Interviewing') statusColor = '#3b82f6'; // blue
                if (c.status === 'Offered') statusColor = '#10b981'; // green
                if (c.status === 'Onboarded') statusColor = '#059669'; // dark green
                if (c.status === 'Rejected') statusColor = '#ef4444'; // red

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
                          {c.name}
                        </div>
                        <div className="pc-client-line">
                          <span className="pc-client-key">Role:</span>
                          <span className="pc-client-val">{c.role}</span>
                        </div>
                      </div>
                      <Dropdown menu={{ items: getMenuItems(c) }} overlayClassName="pp-action-pop" trigger={["click"]} placement="bottomRight">
                        <button type="button" className="pc-actions" onClick={e => e.stopPropagation()}>
                          <MoreVertical size={16} />
                        </button>
                      </Dropdown>
                    </div>

                    <div className="pc-foot">
                      <div className="pc-foot-row">
                        <span className="pc-foot-item">
                          <span className="pc-foot-key">Exp:</span>
                          <span className="pc-foot-val">{c.total_experience} Yrs</span>
                        </span>
                        <span className="pc-foot-div" />
                        <span className="pc-foot-item">
                          <span className="pc-foot-key">Email:</span>
                          <span className="pc-foot-val" style={{ fontWeight: 500 }}>
                            {c.email}
                          </span>
                        </span>
                      </div>
                      <div className="pc-foot-row">
                        <span className="pc-foot-item">
                          <span className="pc-foot-key">Status:</span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: statusColor,
                            }}
                          >
                            {c.status.toUpperCase()}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="pl-footer pl-footer--sticky">
        <div className="pl-footer-info">
          Showing <strong>1–{candidates.length}</strong> of <strong>{candidates.length}</strong> candidates
        </div>
        <div className="pl-pager">
          <button type="button" className="pl-pager-btn" disabled>‹</button>
          <button type="button" className="pl-pager-num is-active">1</button>
          <button type="button" className="pl-pager-btn" disabled>›</button>
        </div>
      </div>

      {isModalOpen && <AddCandidateModal editCandidate={editCandidate} onClose={(refresh) => { setIsModalOpen(false); if (refresh) fetchCandidates(); }} />}
    </>
  );
}

function AddCandidateModal({ onClose, editCandidate }: { onClose: (refresh?: boolean) => void, editCandidate?: any }) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [formData, setFormData] = useState({
    role: editCandidate?.role || '',
    name: editCandidate?.name || '',
    email: editCandidate?.email || '',
    mobile: editCandidate?.mobile || '',
    total_experience: editCandidate?.total_experience || 0,
    current_ctc: editCandidate?.current_ctc || '',
    expected_ctc: editCandidate?.expected_ctc || '',
    resume_url: editCandidate?.resume_url || '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    PositionService.getAll().then(setPositions).catch(console.error);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setError('');
      setIsParsing(true);
      try {
        const res = await pipelineClient.parseResume(f);
        if (res.success && res.data.parsed) {
          setFormData((prev) => ({
            ...prev,
            ...res.data.parsed,
            current_ctc: res.data.parsed.current_ctc || '',
            expected_ctc: res.data.parsed.expected_ctc || '',
            resume_url: res.data.file_url || prev.resume_url,
          }));
        }
      } catch (err: any) {
        console.error('PARSE ERROR:', err);
        setError(err.response?.data?.error || err.message || String(err) || 'Failed to parse resume');
      } finally {
        setIsParsing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      let res;
      if (editCandidate) {
        res = await pipelineClient.updateCandidate(editCandidate.id, formData);
      } else {
        res = await pipelineClient.createCandidate(formData);
      }
      if (res.success) {
        setSuccess(true);
        setTimeout(() => onClose(true), 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save candidate');
    }
  };

  return (
    <Drawer
      {...commonDrawerProps}
      title={editCandidate ? "Edit Candidate" : "Add Candidate"}
      onClose={() => onClose(false)}
      open={true}
      width={600}
    >
      <style dangerouslySetInnerHTML={{ __html: drawerFormStyles }} />
      <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B0F1A]">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F1A]">
          <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">{editCandidate ? "Edit Candidate" : "Add Candidate"}</h2>
          <button type="button" onClick={() => onClose(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 customer-drawer-form">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-md border border-green-100">Candidate saved successfully!</div>}

          <form id="candidateForm" onSubmit={handleSubmit} className="flex flex-col">
            <SectionCard 
              title={editCandidate ? "Applied Role" : "Select Applied Role"} 
              step={editCandidate ? undefined : "STEP 1"} 
              icon={<Search size={14} />}
            >
              <SearchableDropdown
                placeholder="Select a role..."
                value={formData.role || undefined}
                onChange={(val) => setFormData({ ...formData, role: val })}
                options={positions.map((p) => ({ value: p.title, label: p.title }))}
              />
            </SectionCard>

            {(formData.role || editCandidate) && (
              <>
                {!editCandidate && (
                  <SectionCard 
                    title="Upload Resume" 
                    step="STEP 2" 
                    icon={<FileText size={14} />} 
                    subtitle="Uploading a resume will automatically fill in the details below using AI."
                  >
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-blue-700 dark:text-blue-400 rounded-md cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 transition shadow-sm text-sm font-medium">
                        <FileText size={16} /> Choose PDF
                        <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
                      </label>
                      {file && <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{file.name}</span>}
                      {isParsing && <span className="text-sm text-blue-500 font-semibold animate-pulse">Parsing with AI...</span>}
                    </div>
                  </SectionCard>
                )}
                
                <SectionCard 
                  title={editCandidate ? "Edit Details" : "Verify Details"} 
                  step={editCandidate ? undefined : "STEP 3"} 
                  icon={<Edit2 size={14} />}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
                      <input required type="text" className="w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Experience (Yrs)</label>
                      <input required type="number" step="0.5" className="w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" value={formData.total_experience} onChange={(e) => setFormData({ ...formData, total_experience: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Email</label>
                      <input required type="email" className="w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Mobile</label>
                      <input required type="text" className="w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Current CTC</label>
                      <input type="number" className="w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" value={formData.current_ctc} onChange={(e) => setFormData({ ...formData, current_ctc: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Expected CTC</label>
                      <input type="number" className="w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" value={formData.expected_ctc} onChange={(e) => setFormData({ ...formData, expected_ctc: e.target.value })} />
                    </div>
                  </div>
                </SectionCard>
              </>
            )}
          </form>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F1A] flex justify-end gap-3">
          <button type="button" onClick={() => onClose(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors border border-transparent dark:border-slate-700">
            Cancel
          </button>
          <button type="submit" form="candidateForm" disabled={isParsing} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50">
            Save Candidate
          </button>
        </div>
      </div>
    </Drawer>
  );
}
