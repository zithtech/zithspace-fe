'use client';

import React, { useEffect, useState } from 'react';
import { PipelineService as pipelineClient } from '@/services/pipelineService';
import Link from 'next/link';
import '@/app/proposals/library.css';
import {
  Plus,
  Search,
  Eye,
  FileText,
  X,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  MoreVertical,
  UploadCloud,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PositionService, Position } from '@/services/positionService';
import OpeningV2Service, {
  type OpeningListItem,
  type SkillMatchResult,
} from '@/services/openingV2Service';
import { AutoComplete, Drawer, Table, Dropdown, Button, Progress } from 'antd';
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [expFilter, setExpFilter] = useState<string>("all");
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

  const filteredCandidates = candidates.filter((c) => {
    if (statusFilter !== 'all' && c.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (roleFilter !== 'all' && c.role?.toLowerCase() !== roleFilter.toLowerCase()) return false;
    if (expFilter !== 'all') {
      const exp = parseFloat(c.total_experience || '0');
      if (expFilter === '0-2' && exp > 2) return false;
      if (expFilter === '3-5' && (exp < 3 || exp > 5)) return false;
      if (expFilter === '5+' && exp < 5) return false;
    }
    return true;
  });

  const roles = Array.from(new Set(candidates.map(c => c.role).filter(Boolean)));

  const stats = [
    { label: "Total Candidates", value: candidates.length, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
    { label: "Interviewing", value: candidates.filter(c => c.status === 'Interviewing').length, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    { label: "Offered", value: candidates.filter(c => c.status === 'Offered').length, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    { label: "Rejected", value: candidates.filter(c => c.status === 'Rejected').length, color: "#ef4444", bg: "rgba(239,68,68,0.1)" }
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

      <div className="pp-stats py-4">
        {stats.map((s) => (
          <div key={s.label} className="pp-stat-card">
            <div className="pp-stat-top">
              <div className="pp-stat-left">
                <span className="pp-stat-icon" style={{ background: s.bg, color: s.color }}>
                  <LayoutGrid size={12} />
                </span>
                <span className="pp-stat-label">{s.label}</span>
              </div>
            </div>
            <div className="pp-stat-bottom">
              <div className="pp-stat-value-wrap">
                <span className="pp-stat-value">{s.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters</div>
        <div className="w-48">
          <SearchableDropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            placeholder="All Statuses"
            options={[
              { label: 'All Statuses', value: 'all' },
              { label: 'Interviewing', value: 'interviewing' },
              { label: 'Offered', value: 'offered' },
              { label: 'Onboarded', value: 'onboarded' },
              { label: 'Rejected', value: 'rejected' },
            ]}
          />
        </div>
        
        <div className="w-56">
          <SearchableDropdown
            value={roleFilter}
            onChange={(val) => setRoleFilter(val)}
            placeholder="All Roles"
            options={[
              { label: 'All Roles', value: 'all' },
              ...roles.map(r => ({ label: r as string, value: r as string }))
            ]}
          />
        </div>
        
        <div className="w-48">
          <SearchableDropdown
            value={expFilter}
            onChange={(val) => setExpFilter(val)}
            placeholder="Any Experience"
            options={[
              { label: 'Any Experience', value: 'all' },
              { label: '0 - 2 Years', value: '0-2' },
              { label: '3 - 5 Years', value: '3-5' },
              { label: '5+ Years', value: '5+' },
            ]}
          />
        </div>
      </div>

      <div className="pl-body">
        {viewMode === "table" ? (
          <div className="pp-table-wrap">
            <Table
              size="small"
              columns={columns}
              dataSource={filteredCandidates.map(c => ({ ...c, key: c.id }))}
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
            ) : filteredCandidates.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-500 w-full">No candidates found.</div>
            ) : (
              filteredCandidates.map((c) => {
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
  // Openings that can actually receive candidates. A draft or closed opening
  // would be rejected by the backend, so it is never offered here.
  const [openings, setOpenings] = useState<OpeningListItem[]>([]);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    PositionService.getAll().then(setPositions).catch(console.error);
    OpeningV2Service.list({
      pageSize: 200,
      status: ['approved', 'internal_posting', 'external_posting', 'in_progress'],
    })
      .then((res) => setOpenings(res.items))
      // Attaching to an opening is optional, so a failure here must not block
      // adding a candidate.
      .catch(() => setOpenings([]));
  }, []);

  const selectedOpening = openings.find((o) => o.id === openingId) ?? null;
  // Skills lifted off the resume, and how well they line up with the opening.
  const [resumeSkills, setResumeSkills] = useState<string[]>(editCandidate?.skills || []);
  // Two distinct phases: the upload has a real percentage, the AI extraction
  // does not. Showing an invented percentage for the second would be a lie.
  const [uploadPhase, setUploadPhase] = useState<
    'idle' | 'uploading' | 'extracting' | 'done' | 'error'
  >('idle');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [match, setMatch] = useState<SkillMatchResult | null>(null);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    if (!openingId || resumeSkills.length === 0) {
      setMatch(null);
      return;
    }
    setMatching(true);
    OpeningV2Service.skillMatch(openingId, resumeSkills)
      .then(setMatch)
      .catch((err) => {
        console.error('Failed to score skills', err);
        setMatch(null);
      })
      .finally(() => setMatching(false));
  }, [openingId, resumeSkills]);

  const MAX_RESUME_MB = 10;

  const processFile = async (f: File) => {
    // Reject early with a specific reason rather than letting the server 500.
    const ext = f.name.toLowerCase().split('.').pop() ?? '';
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      setError('Upload a PDF or Word document');
      setUploadPhase('error');
      return;
    }
    if (f.size > MAX_RESUME_MB * 1024 * 1024) {
      setError(`That file is ${(f.size / 1024 / 1024).toFixed(1)} MB — the limit is ${MAX_RESUME_MB} MB`);
      setUploadPhase('error');
      return;
    }

    setFile(f);
    setError('');
    setResumeSkills([]);
    setUploadPercent(0);
    setUploadPhase('uploading');
    setIsParsing(true);

    try {
      const res = await pipelineClient.parseResume(f, (percent) => {
        setUploadPercent(percent);
        // Bytes are all sent; everything after this is server-side parsing.
        if (percent >= 100) setUploadPhase('extracting');
      });
      if (res.success && res.data.parsed) {
        const parsed = res.data.parsed;
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          current_ctc: parsed.current_ctc || '',
          expected_ctc: parsed.expected_ctc || '',
          resume_url: res.data.file_url || prev.resume_url,
        }));
        setResumeSkills(Array.isArray(parsed.skills) ? parsed.skills : []);
        setUploadPhase('done');
      } else {
        setUploadPhase('error');
        setError('The resume was uploaded but nothing could be read from it');
      }
    } catch (err: any) {
      console.error('PARSE ERROR:', err);
      setError(err.response?.data?.error || err.message || 'Failed to parse resume');
      setUploadPhase('error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    // Reset the input so re-picking the same file still fires onChange.
    e.target.value = '';
    if (f) await processFile(f);
  };

  const clearResume = () => {
    setFile(null);
    setResumeSkills([]);
    setUploadPhase('idle');
    setUploadPercent(0);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...formData, skills: resumeSkills };
      let res;
      if (editCandidate) {
        res = await pipelineClient.updateCandidate(editCandidate.id, payload);
      } else {
        res = await pipelineClient.createCandidate(payload);
      }
      if (res.success) {
        // Attaching is a second call: the pipeline owns the candidate record,
        // the opening module owns the application. A failure here must not
        // silently lose the candidate that was just saved.
        const newId = res.data?.id ?? res.data?.candidate?.id;
        if (openingId && newId && !editCandidate) {
          try {
            await OpeningV2Service.addApplication(openingId, {
              pipelineCandidateId: newId,
              source: 'manual_upload',
              resumeUrl: formData.resume_url || null,
            });
          } catch (attachErr: any) {
            setError(
              attachErr?.response?.data?.error ||
                'Candidate saved, but could not be added to the opening'
            );
            return;
          }
        }
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
              title={editCandidate ? "Applied Role" : "Opening or Role"}
              step={editCandidate ? undefined : "STEP 1"}
              icon={<Search size={14} />}
              subtitle={
                editCandidate
                  ? undefined
                  : "Attach to a live opening, or pick the position if you are sourcing without one."
              }
            >
              {!editCandidate && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Opening <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <SearchableDropdown
                    placeholder="Select an active opening…"
                    value={openingId}
                    itemNoun="openings"
                    onChange={(val) => {
                      setOpeningId(val ?? null);
                      // The opening's job title IS the applied role — keep the two
                      // from drifting apart rather than asking twice.
                      const chosen = openings.find((o) => o.id === val);
                      if (chosen) setFormData((prev) => ({ ...prev, role: chosen.jobTitle }));
                    }}
                    options={openings.map((o) => ({
                      value: o.id,
                      label: `${o.openingCode} — ${o.jobTitle}`,
                      description:
                        [o.departmentName, o.clientName].filter(Boolean).join(' · ') || undefined,
                    }))}
                    emptyComponent={
                      <div className="p-4 text-xs text-slate-400">
                        No openings are accepting candidates yet.
                      </div>
                    }
                  />
                  {openingId && (
                    <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      This candidate will appear on{' '}
                      <span className="font-semibold">{selectedOpening?.openingCode}</span> under
                      its Candidates tab.
                    </div>
                  )}
                </div>
              )}

              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Position{!openingId && <span className="text-red-500"> *</span>}
              </label>
              <SearchableDropdown
                placeholder="Select a role..."
                value={formData.role || undefined}
                // With an opening chosen the role comes from it; without one the
                // position is what tells the pipeline which interview config applies.
                disabled={!!openingId}
                onChange={(val) => setFormData({ ...formData, role: val })}
                options={positions.map((p) => ({ value: p.title, label: p.title }))}
              />
              {!openingId && !editCandidate && (
                <div className="mt-2 text-[11px] text-slate-400">
                  No opening selected — pick the position this candidate is for.
                </div>
              )}
            </SectionCard>

            {(formData.role || editCandidate) && (
              <>
                {!editCandidate && (
                  <SectionCard
                    title="Upload Resume"
                    step="STEP 2"
                    icon={<FileText size={14} />}
                    subtitle="PDF or Word. The details below are filled in automatically."
                  >
                    {uploadPhase === 'idle' || uploadPhase === 'error' ? (
                      <label
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          const f = e.dataTransfer.files?.[0];
                          if (f) processFile(f);
                        }}
                        className={`flex flex-col items-center justify-center gap-2 w-full py-8 px-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                          isDragging
                            ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-500/10'
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <span
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(59,130,246,0.10)', color: '#3b82f6' }}
                        >
                          <UploadCloud size={18} />
                        </span>
                        <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                          {isDragging ? 'Drop the file here' : 'Drag a resume here, or click to browse'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          PDF, DOC or DOCX · up to {MAX_RESUME_MB} MB
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={handleUpload}
                        />
                      </label>
                    ) : (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={
                              uploadPhase === 'done'
                                ? { background: 'rgba(16,185,129,0.10)', color: '#10B981' }
                                : { background: 'rgba(59,130,246,0.10)', color: '#3b82f6' }
                            }
                          >
                            {uploadPhase === 'done' ? <Check size={17} /> : <FileText size={17} />}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {file?.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {file ? `${(file.size / 1024).toFixed(0)} KB` : ''}
                              {uploadPhase === 'uploading' && ` · Uploading ${uploadPercent}%`}
                              {uploadPhase === 'extracting' && ' · Extracting details with AI'}
                              {uploadPhase === 'done' && ' · Details filled in below'}
                            </div>
                          </div>

                          {/* Replacing is only safe once the current file is done. */}
                          {uploadPhase === 'done' && (
                            <button
                              type="button"
                              onClick={clearResume}
                              className="text-slate-400 hover:text-slate-600 p-1"
                              title="Remove and upload another"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>

                        {uploadPhase === 'uploading' && (
                          <Progress
                            percent={uploadPercent}
                            size="small"
                            strokeColor="#3b82f6"
                            className="mt-3 mb-0"
                          />
                        )}

                        {uploadPhase === 'extracting' && (
                          // Indeterminate on purpose: the server is parsing and
                          // we have no honest percentage for it.
                          <div className="mt-3">
                            <div className="h-1.5 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                              <div className="pipe-indeterminate h-full rounded-full" />
                            </div>
                            <div className="text-[11px] text-blue-500 font-medium mt-1.5">
                              Reading the resume — this usually takes a few seconds
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {resumeSkills.length > 0 && (
                      <div className="mt-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Skills found on the resume ({resumeSkills.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {resumeSkills.map((sk) => (
                            <span
                              key={sk}
                              className="px-2 py-0.5 text-[11px] rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <style jsx global>{`
                      .pipe-indeterminate {
                        width: 40%;
                        background: linear-gradient(90deg, #3b82f6, #60a5fa);
                        animation: pipe-slide 1.1s ease-in-out infinite;
                      }
                      @keyframes pipe-slide {
                        0% { margin-left: -40%; }
                        100% { margin-left: 100%; }
                      }
                    `}</style>
                  </SectionCard>
                )}

                {/* Skill match — only meaningful once we have both sides. */}
                {!editCandidate && openingId && resumeSkills.length > 0 && (
                  <SectionCard
                    title="Skill Match"
                    icon={<Search size={14} />}
                    subtitle={`Against ${selectedOpening?.openingCode ?? 'the opening'}`}
                  >
                    {matching ? (
                      <div className="text-sm text-blue-500 font-medium animate-pulse">
                        Matching skills…
                      </div>
                    ) : !match ? (
                      <div className="text-sm text-slate-400">Could not score this resume.</div>
                    ) : match.score === null ? (
                      <div className="text-sm text-slate-500">{match.reason}</div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <div
                            className="relative flex items-center justify-center flex-shrink-0"
                            style={{ width: 72, height: 72 }}
                          >
                            {/* Ring: conic-gradient avoids pulling in a chart lib. */}
                            <div
                              className="absolute inset-0 rounded-full"
                              style={{
                                background: `conic-gradient(${
                                  match.score >= 70 ? '#10B981' : match.score >= 40 ? '#3B82F6' : '#94A3B8'
                                } ${match.score * 3.6}deg, var(--bg-slate-50, #f1f5f9) 0deg)`,
                              }}
                            />
                            <div
                              className="absolute rounded-full bg-white dark:bg-[#0B0F1A]"
                              style={{ inset: 6 }}
                            />
                            <span
                              className="relative text-[18px] font-extrabold"
                              style={{
                                color:
                                  match.score >= 70 ? '#10B981' : match.score >= 40 ? '#3B82F6' : '#64748B',
                              }}
                            >
                              {match.score}%
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
                              {match.matchedRequired.length}/
                              {match.matchedRequired.length + match.missingRequired.length} required
                              {match.matchedPreferred.length + match.missingPreferred.length > 0 && (
                                <>
                                  {' · '}
                                  {match.matchedPreferred.length}/
                                  {match.matchedPreferred.length + match.missingPreferred.length}{' '}
                                  preferred
                                </>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                              Overlap between the resume and the opening&apos;s skill list — a
                              sorting aid, not a verdict on the candidate.
                            </div>
                          </div>
                        </div>

                        {match.matchedRequired.length > 0 && (
                          <div className="mb-3">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                              Matched
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {[...match.matchedRequired, ...match.matchedPreferred].map((sk) => (
                                <span
                                  key={sk}
                                  className="px-2 py-0.5 text-[11px] rounded-md"
                                  style={{ background: 'rgba(16,185,129,0.10)', color: '#10B981' }}
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {match.missingRequired.length > 0 && (
                          <div className="mb-3">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                              Missing (required)
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {match.missingRequired.map((sk) => (
                                <span
                                  key={sk}
                                  className="px-2 py-0.5 text-[11px] rounded-md border border-dashed border-slate-300 dark:border-slate-600 text-slate-500"
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {match.additional.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                              Also brings
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {match.additional.slice(0, 12).map((sk) => (
                                <span
                                  key={sk}
                                  className="px-2 py-0.5 text-[11px] rounded-md text-slate-500 border border-slate-200 dark:border-slate-700"
                                >
                                  {sk}
                                </span>
                              ))}
                              {match.additional.length > 12 && (
                                <span className="px-2 py-0.5 text-[11px] text-slate-400">
                                  +{match.additional.length - 12} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors border border-transparent dark:border-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="candidateForm"
            disabled={isParsing}
            title={isParsing ? 'Wait for the resume to finish processing' : undefined}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isParsing
              ? uploadPhase === 'uploading'
                ? `Uploading ${uploadPercent}%…`
                : 'Extracting…'
              : 'Save Candidate'}
          </button>
        </div>
      </div>
    </Drawer>
  );
}
