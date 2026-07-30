'use client';

import React, { useEffect, useState } from 'react';
import { PipelineService as pipelineClient } from '@/services/pipelineService';
import Link from 'next/link';
import { Plus, Search, Eye, FileText, X, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PositionService, Position } from '@/services/positionService';
import { AutoComplete, Drawer, Popconfirm } from 'antd';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCandidate, setEditCandidate] = useState<any>(null);

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
        <div className="pl-topbar-actions">
          <button
            onClick={() => { setEditCandidate(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
          >
            <Plus size={14} /> Add Candidate
          </button>
        </div>
      </div>

      <div className="pl-divider" />

      <div className="pl-body">
        <div className="bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">Candidate</th>
              <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">Role</th>
              <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">Experience</th>
              <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">Status</th>
              <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">Loading...</td>
              </tr>
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">No candidates found.</td>
              </tr>
            ) : (
              candidates.map((c) => {
                const initials = c.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                let statusColor = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                if (c.status === 'Interviewing') statusColor = 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
                if (c.status === 'Offered') statusColor = 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
                if (c.status === 'Rejected') statusColor = 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
                
                return (
                <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition duration-200 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 dark:from-indigo-900/50 to-blue-100 dark:to-blue-900/50 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                        {initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{c.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{c.email} <span className="opacity-50 mx-1">•</span> {c.mobile}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{c.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 inline-block px-2.5 py-1 rounded-md">{c.total_experience} Yrs</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border ${statusColor}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/pipeline/candidates/${c.id}`}
                        className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                        title="View Profile"
                      >
                        <Eye size={16} />
                      </Link>
                      <button onClick={() => { setEditCandidate(c); setIsModalOpen(true); }} className="p-2 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <Popconfirm
                        title={<span className="dark:text-slate-200">Delete candidate?</span>}
                        description={<span className="dark:text-slate-400">Are you sure you want to delete this candidate?</span>}
                        onConfirm={async () => {
                          try {
                            await pipelineClient.deleteCandidate(c.id);
                            fetchCandidates();
                          } catch (err) {
                            alert('Failed to delete candidate');
                          }
                        }}
                      >
                        <button className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-600 hover:text-white rounded-lg transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </Popconfirm>
                    </div>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>
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

      {isModalOpen && <AddCandidateModal editCandidate={editCandidate} onClose={() => { setIsModalOpen(false); fetchCandidates(); }} />}
    </>
  );
}

function AddCandidateModal({ onClose, editCandidate }: { onClose: () => void, editCandidate?: any }) {
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
        setTimeout(() => onClose(), 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save candidate');
    }
  };

  return (
    <Drawer
      title={editCandidate ? "Edit Candidate" : "Add Candidate"}
      placement="right"
      width={500}
      onClose={onClose}
      open={true}
      className="z-[9999]"
      styles={{ body: { padding: 0 } }}
    >
      <div className="flex flex-col h-full">
        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-md border border-green-100">Candidate saved successfully!</div>}

          <form id="candidateForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!editCandidate && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Step 1: Select Applied Role</label>
                <AutoComplete
                  className="w-full"
                  placeholder="Select or type a role..."
                  value={formData.role || undefined}
                  onChange={(val) => setFormData({ ...formData, role: val })}
                  disabled={!!file}
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
            )}

            {editCandidate && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Applied Role</label>
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
            )}

            {(formData.role || editCandidate) ? (
              <>
                {!editCandidate && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <label className="block text-sm font-bold text-slate-800 mb-2">Step 2: Upload Resume (Optional)</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-md cursor-pointer hover:bg-blue-50 transition shadow-sm text-sm font-medium">
                        <FileText size={16} /> Choose PDF
                        <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
                      </label>
                      {file && <span className="text-sm font-medium text-slate-600">{file.name}</span>}
                      {isParsing && <span className="text-sm text-blue-500 font-semibold animate-pulse">Parsing with AI...</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Uploading a resume will automatically fill in the details below using AI.</p>
                  </div>
                )}
                
                <div className="mt-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-3">{editCandidate ? "Edit Details" : "Step 3: Verify Details"}</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                      <input required type="text" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Total Experience (Yrs)</label>
                      <input required type="number" step="0.5" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" value={formData.total_experience} onChange={(e) => setFormData({ ...formData, total_experience: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                      <input required type="email" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Mobile</label>
                      <input required type="text" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Current CTC</label>
                      <input type="number" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" value={formData.current_ctc} onChange={(e) => setFormData({ ...formData, current_ctc: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Expected CTC</label>
                      <input type="number" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none" value={formData.expected_ctc} onChange={(e) => setFormData({ ...formData, expected_ctc: e.target.value })} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-8 mt-2 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                Please select a role to continue...
              </div>
            )}
          </form>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-md transition-colors">
            Cancel
          </button>
          <button type="submit" form="candidateForm" disabled={isParsing} className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50">
            Save Candidate
          </button>
        </div>
      </div>
    </Drawer>
  );
}
