'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PipelineService as pipelineClient } from '@/services/pipelineService';
import { MembersService } from '@/services/membersService';
import { ArrowLeft, Calendar, FileCheck, DollarSign, Clock, FileText, Search, UploadCloud, AlertCircle, AlertTriangle, UserX } from 'lucide-react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { Drawer, Select, Modal, App, DatePicker, TimePicker } from 'antd';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { commonDrawerProps, drawerFormStyles, SectionCard } from "@/components/common/DrawerSection";
import TiptapEditor from '@/components/common/TiptapEditor';
import { X } from 'lucide-react';
import { OpeningV2Service } from '@/services/openingV2Service';
import type { OpeningListItem, SkillMatchResult } from '@/services/openingV2Service';
import { useMailStatus } from '@/hooks/useMail';

export default function CandidateDetailPage() {
  const { message } = App.useApp();
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { data: mailStatus, isLoading: isMailStatusLoading } = useMailStatus();
  const isMailConnected = mailStatus?.isConnected;

  const [candidate, setCandidate] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState('logs');
  const [loading, setLoading] = useState(true);

  // Reject State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectRoundId, setRejectRoundId] = useState('');

  // Scheduling state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState({
    round_id: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    mode: 'Online',
    location_or_link: '',
    interviewer_ids: [] as string[],
    generate_meeting: true,
  });
  const [isScheduling, setIsScheduling] = useState(false);

  // Email Draft state
  const [isDraftEmailOpen, setIsDraftEmailOpen] = useState(false);
  const [draftEmail, setDraftEmail] = useState<any>(null);
  const [isSendingDraft, setIsSendingDraft] = useState(false);

  // Interview Details state
  const [isInterviewDetailsOpen, setIsInterviewDetailsOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);

  // Evaluate state
  const [isEvaluateOpen, setIsEvaluateOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalData, setEvalData] = useState<{
    interview_id: string;
    evaluations: Record<string, { score: number; feedback: string }>;
  }>({ interview_id: '', evaluations: {} });

  // Skill Match State
  const [openings, setOpenings] = useState<OpeningListItem[]>([]);
  const [matchOpeningId, setMatchOpeningId] = useState<string | null>(null);
  const [match, setMatch] = useState<SkillMatchResult | null>(null);
  const [matching, setMatching] = useState(false);

  // Documents State
  const [isRequestDocsOpen, setIsRequestDocsOpen] = useState(false);
  const [isRequestingDocs, setIsRequestingDocs] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [documentToReject, setDocumentToReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [documentToVerify, setDocumentToVerify] = useState<string | null>(null);

  const [isUploadManualOpen, setIsUploadManualOpen] = useState(false);
  const [manualUploadDocType, setManualUploadDocType] = useState<string>('');
  const [manualUploadFile, setManualUploadFile] = useState<File | null>(null);
  const [isUploadingManual, setIsUploadingManual] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [portalLink, setPortalLink] = useState('');

  const DEFAULT_DOCS = [
    'Aadhaar Card',
    'PAN Card',
    'Passport-size Photo',
    'Educational Certificates',
    'Experience Letters',
    'Relieving Letter',
    'Salary Slips',
    'Address Proof',
    'Bank Details'
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, lRes, iRes, eRes, dRes, cfgRes, usersRes] = await Promise.all([
        pipelineClient.getCandidate(id),
        pipelineClient.getCandidateLogs(id),
        pipelineClient.listCandidateInterviews(id),
        pipelineClient.getCandidateEmails(id),
        pipelineClient.getCandidateDocuments(id),
        pipelineClient.listConfigs(),
        MembersService.getMembers({ limit: 100 }),
      ]);
      setCandidate(cRes.data);
      setLogs(lRes.data);
      setInterviews(iRes.data || []);
      setEmails(eRes.data || []);
      setDocuments(dRes.data || []);
      setUsers(usersRes.data || []);

      // Find matching config for the role
      const matchingConfig = (cfgRes.data || []).find((c: any) => c.role === cRes.data.role);
      setConfig(matchingConfig);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'Rejected') {
      setRejectRoundId('');
      setIsRejectModalOpen(true);
      return;
    }
    try {
      await pipelineClient.updateCandidateStatus(id, newStatus);
      message.success('Status updated successfully');
      fetchData();
    } catch (err) {
      console.error('Failed to update status', err);
      message.error('Failed to update status');
    }
  };

  const submitRejection = async () => {
    try {
      await pipelineClient.updateCandidateStatus(id, 'Rejected', rejectRoundId);
      setIsRejectModalOpen(false);
      message.success('Candidate rejected successfully');
      fetchData();
    } catch (err) {
      console.error('Failed to reject candidate', err);
      message.error('Failed to reject candidate');
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    OpeningV2Service.list({
      pageSize: 200,
      status: ['approved', 'internal_posting', 'external_posting', 'in_progress'],
    })
      .then((res) => setOpenings(res.items))
      .catch(() => setOpenings([]));
  }, []);

  useEffect(() => {
    if (candidate && openings.length > 0 && !matchOpeningId) {
      const match = openings.find(o => o.jobTitle === candidate.role);
      if (match) {
        setMatchOpeningId(match.id);
      }
    }
  }, [candidate, openings, matchOpeningId]);

  useEffect(() => {
    if (!matchOpeningId || !candidate?.skills || candidate.skills.length === 0) {
      setMatch(null);
      return;
    }
    setMatching(true);
    OpeningV2Service.skillMatch(matchOpeningId, candidate.skills)
      .then(setMatch)
      .catch((err) => {
        console.error('Failed to score skills', err);
        setMatch(null);
      })
      .finally(() => setMatching(false));
  }, [matchOpeningId, candidate?.skills]);

  if (loading) return <div className="p-8 text-slate-500 dark:text-slate-400">Loading candidate profile...</div>;
  if (!candidate) return <div className="p-8 text-red-500 dark:text-red-400">Candidate not found</div>;

  return (
    <div className="flex flex-col gap-4 w-full h-[calc(100vh-130px)]">
      <Link href="/pipeline/candidates" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 w-fit">
        <ArrowLeft size={16} /> Back to Candidates
      </Link>

      <div className="bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 dark:from-blue-900/20 to-transparent rounded-full -mr-16 -mt-16 opacity-70 pointer-events-none"></div>
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 dark:from-indigo-900/50 to-blue-200 dark:to-blue-900/50 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-800 dark:text-blue-400 font-bold text-sm shadow-sm">
            {candidate.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-200 tracking-tight leading-tight">{candidate.name}</h1>
              <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800/50">{candidate.role}</div>
              {candidate.status === 'Rejected' && (
                <div className="text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full border border-red-100 dark:border-red-800/50">
                  Rejected {candidate.rejected_round_id ? `from: ${config?.rounds?.find((r: any) => r.id === candidate.rejected_round_id)?.round_name || 'Unknown Round'}` : ''}
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1.5 flex items-center gap-3">
              <span className="flex items-center gap-1"><FileText size={12} className="opacity-70" /> {candidate.email}</span>
              <span className="flex items-center gap-1"><Calendar size={12} className="opacity-70" /> {candidate.mobile}</span>
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">{candidate.total_experience ?? 0} Yrs Exp</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 z-10">
          <div className="w-40 font-medium">
            <SearchableDropdown
              value={candidate.status}
              onChange={handleStatusChange}
              options={[
                { value: 'Screening', label: 'Screening' },
                { value: 'Shortlisted', label: 'Shortlisted' },
                { value: 'Interview', label: 'Interview' },
                { value: 'Offer', label: 'Offer' },
                { value: 'Hired', label: 'Hired' },
                { value: 'Rejected', label: 'Rejected' },
                { value: 'Withdrawn', label: 'Withdrawn' },
                { value: 'On Hold', label: 'On Hold' },
              ]}
            />
          </div>
          {candidate.status !== 'Rejected' && (
            <button onClick={() => {
              if (isMailStatusLoading) {
                message.loading({ content: 'Checking integration status...', key: 'mailStatus', duration: 1 });
                return;
              }
              if (!isMailConnected) {
                setIntegrationError('Please integrate your mail account in the Integrations page to schedule interviews.');
                return;
              }
              setIsScheduleOpen(true);
            }} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all transform hover:-translate-y-0.5">
              <Calendar size={14} /> Schedule
            </button>
          )}
          {candidate.status === 'Interview' && (
            <button onClick={() => {
              setEvalData({ interview_id: '', evaluations: {} });
              setIsEvaluateOpen(true);
            }} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all transform hover:-translate-y-0.5">
              <FileCheck size={14} /> Evaluate
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<Clock size={16} />} label="Timeline & Logs" />
          <TabButton active={activeTab === 'interviews'} onClick={() => setActiveTab('interviews')} icon={<Calendar size={16} />} label={`Interviews (${interviews.length})`} />
          <TabButton active={activeTab === 'emails'} onClick={() => setActiveTab('emails')} icon={<FileText size={16} />} label={`Emails (${emails.length})`} />
          <TabButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={<FileCheck size={16} />} label={`Documents (${documents.length})`} />
          <TabButton active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} icon={<FileCheck size={16} />} label="Skills" />
          <TabButton active={activeTab === 'resume'} onClick={() => setActiveTab('resume')} icon={<FileText size={16} />} label="Resume" />
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'logs' && (
            <div className="flex flex-col gap-6 relative">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800 z-0"></div>
              {logs.map((log: any) => {
                const isError = log.action_type === 'Duplicate_Aadhaar_Attempt';
                return (
                  <div key={log.id} className="flex gap-4 relative z-10">
                    <div className={`w-6 h-6 rounded-full border-2 border-white dark:border-[#0B0F1A] flex-shrink-0 mt-0.5 ${isError ? 'bg-red-500' : 'bg-blue-100 dark:bg-blue-900/50'}`}></div>
                    <div>
                      <div className={`text-sm font-bold ${isError ? 'text-red-600 dark:text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>{log.action_type.replace(/_/g, ' ')}</div>
                      <div className={`text-sm ${isError ? 'text-red-500 dark:text-red-400 font-medium' : 'text-slate-600 dark:text-slate-400'}`}>{log.description}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{dayjs(log.created_at).format('MMM D, YYYY h:mm A')} {log.user_name && `by ${log.user_name}`}</div>
                    </div>
                  </div>
                );
              })}
              {logs.length === 0 && <div className="text-slate-500 dark:text-slate-400 pl-8">No activity recorded yet.</div>}
            </div>
          )}

          {activeTab === 'interviews' && (
            <div className="flex flex-col gap-4">
              {interviews.map(i => (
                <div key={i.id} onClick={() => { setSelectedInterview(i); setIsInterviewDetailsOpen(true); }} className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{i.round_name}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{dayjs(i.scheduled_date).format('MMM D, YYYY')} at {i.scheduled_time} ({i.mode})</div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded ${i.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                    {i.status}
                  </span>
                </div>
              ))}
              {interviews.length === 0 && <div className="text-slate-500 dark:text-slate-400">No interviews scheduled.</div>}
            </div>
          )}

          {activeTab === 'emails' && (
            <div className="flex flex-col gap-4">
              {emails.map(e => (
                <div key={e.id} className={`border rounded-lg p-4 flex flex-col gap-3 ${e.status === 'Sent' ? 'border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20' : 'border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">{e.subject}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{dayjs(e.sent_at).format('MMM D, YYYY h:mm A')}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded border ${e.status === 'Sent' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50' : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'}`}>
                        {e.status}
                      </span>
                      {e.status !== 'Sent' && (
                        <button onClick={() => {
                          setDraftEmail(e);
                          setIsDraftEmailOpen(true);
                        }} className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded font-medium transition">
                          Review & Send
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs bg-white dark:bg-[#0B0F1A] p-3 rounded border border-slate-100 dark:border-slate-800 max-h-32 overflow-y-auto">
                    <div className="email-preview-wrapper text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: e.body }} />
                    <style>{`
                      [data-theme='dark'] .email-preview-wrapper * { color: #cbd5e1 !important; }
                    `}</style>
                  </div>
                </div>
              ))}
              {emails.length === 0 && <div className="text-slate-500 dark:text-slate-400">No emails sent.</div>}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Candidate Documents</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsUploadManualOpen(true)}
                    className="bg-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-[#0B0F1A] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all"
                  >
                    Upload Document
                  </button>
                  <button
                    onClick={() => setIsRequestDocsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all"
                  >
                    Request Documents
                  </button>
                </div>
              </div>

              {candidate.document_portal_token && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 text-sm flex flex-col gap-2">
                  <div className="text-blue-800 dark:text-blue-300 font-medium flex justify-between items-center">
                    <span>Portal Link Generated</span>
                    <a
                      href={`/candidate-portal/${candidate.document_portal_token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-xs font-bold flex items-center gap-1"
                    >
                      Open Public Portal Link
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/candidate-portal/${candidate.document_portal_token}`}
                      className="flex-1 bg-white dark:bg-[#0B0F1A] border border-blue-200 dark:border-blue-800/50 rounded px-2 py-1 text-slate-600 dark:text-slate-400 text-xs"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/candidate-portal/${candidate.document_portal_token}`)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {documents.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden mt-2">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">Document Type</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">File</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {documents.map(d => (
                        <tr key={d.id} className="bg-white dark:bg-[#0B0F1A]">
                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{d.document_type}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded border ${d.status === 'Verified' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50' :
                                d.status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50' :
                                  d.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50' :
                                    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50'
                              }`}>
                              {d.status}
                            </span>
                            {d.remarks && <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[200px] truncate" title={d.remarks}>Note: {d.remarks}</div>}
                          </td>
                          <td className="px-4 py-3">
                            {d.document_url ? (
                              <a href={d.document_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center gap-1">
                                <FileCheck size={14} /> View File
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {d.document_url && d.status !== 'Verified' && (
                              <div className="flex gap-2">
                                <button onClick={() => {
                                  setDocumentToVerify(d.id);
                                  setVerifyModalOpen(true);
                                }} className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2 py-1 rounded border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/40">Approve</button>
                                <button onClick={() => {
                                  setDocumentToReject(d.id);
                                  setRejectReason('');
                                  setRejectModalOpen(true);
                                }} className="text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 px-2 py-1 rounded border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/40">Reject</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-slate-500 dark:text-slate-400 mt-4 text-center p-8 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                  No documents requested yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Candidate Skills</div>
                  <div className="text-xs text-slate-500 font-medium">{candidate.skills?.length || 0} skills extracted</div>
                </div>
                {candidate.skills && candidate.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {candidate.skills.map((sk: string) => (
                      <span key={sk} className="px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-[11px] font-bold border border-blue-100 dark:border-blue-800 shadow-sm transition hover:-translate-y-0.5 cursor-default">
                        {sk}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 dark:text-slate-400 py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-sm">No skills recorded for this candidate.</div>
                )}
              </div>

              {candidate.skills && candidate.skills.length > 0 && (
                <div className="flex flex-col gap-4 bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><Search size={16} className="text-blue-500" /> Skill Match Score</div>
                      <div className="text-[11px] text-slate-500 mt-1">Select an opening to calculate how well this candidate matches the requirements.</div>
                    </div>
                    <div className="w-full sm:w-64">
                      <SearchableDropdown
                        value={matchOpeningId || ''}
                        onChange={(val) => setMatchOpeningId(val)}
                        placeholder="Select Opening to Match..."
                        options={openings.map(o => ({ label: `${o.openingCode} - ${o.jobTitle}`, value: o.id }))}
                      />
                    </div>
                  </div>

                  {matchOpeningId && (
                    <div className="pt-2">
                      {matching ? (
                        <div className="text-sm text-blue-500 font-medium animate-pulse flex items-center justify-center py-8">
                          Matching skills...
                        </div>
                      ) : !match ? (
                        <div className="text-sm text-slate-400 text-center py-8">Could not score this candidate.</div>
                      ) : match.score === null ? (
                        <div className="text-sm text-slate-500 text-center py-8">{match.reason}</div>
                      ) : (
                        <div className="flex flex-col gap-6">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                            <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 84, height: 84 }}>
                              <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${match.score >= 70 ? '#10B981' : match.score >= 40 ? '#3B82F6' : '#94A3B8'} ${match.score * 3.6}deg, var(--bg-slate-50, #f1f5f9) 0deg)` }} />
                              <div className="absolute rounded-full bg-slate-50 dark:bg-[#0B0F1A]" style={{ inset: 8 }} />
                              <span className="relative text-[22px] font-black" style={{ color: match.score >= 70 ? '#10B981' : match.score >= 40 ? '#3B82F6' : '#64748B' }}>
                                {match.score}%
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[14px] font-bold text-slate-800 dark:text-slate-200">
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
                              <div className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-lg">
                                Overlap between the candidate's skills and the opening's required/preferred skills.
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {match.matchedRequired.length > 0 && (
                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Matched Required</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {match.matchedRequired.map((sk) => (
                                    <span key={sk} className="px-2.5 py-1 text-[11px] rounded-md font-bold shadow-sm" style={{ background: 'rgba(16,185,129,0.15)', color: '#059669' }}>{sk}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {match.matchedPreferred.length > 0 && (
                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Matched Preferred</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {match.matchedPreferred.map((sk) => (
                                    <span key={sk} className="px-2.5 py-1 text-[11px] rounded-md font-bold shadow-sm" style={{ background: 'rgba(59,130,246,0.15)', color: '#2563EB' }}>{sk}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {match.missingRequired.length > 0 && (
                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Missing Required</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {match.missingRequired.map((sk) => (
                                    <span key={sk} className="px-2.5 py-1 text-[11px] rounded-md font-medium border border-dashed border-slate-300 dark:border-slate-600 text-slate-500">{sk}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {match.additional.length > 0 && (
                              <div className="md:col-span-2 mt-2">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Also Brings</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {match.additional.slice(0, 15).map((sk) => (
                                    <span key={sk} className="px-2 py-1 text-[10px] rounded text-slate-500 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">{sk}</span>
                                  ))}
                                  {match.additional.length > 15 && (
                                    <span className="px-2 py-1 text-[10px] text-slate-400 italic">+{match.additional.length - 15} more</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'resume' && (
            <div className="flex flex-col gap-4 h-full">
              {candidate.resume_url ? (
                (() => {
                  const rawUrl = candidate.resume_url.startsWith('http')
                    ? candidate.resume_url
                    : `${process.env.NEXT_PUBLIC_API_URL || ''}${candidate.resume_url}`;

                  // Extract pathname only — S3 signed URLs have query params like
                  // ?AWSAccessKeyId=...&Signature=... that break extension detection
                  let pathOnly = rawUrl;
                  try { pathOnly = new URL(rawUrl).pathname; } catch { }
                  const lowerPath = pathOnly.toLowerCase();

                  // Clean filename for download (strip query params)
                  const fileName = lowerPath.split('/').pop() || 'resume';

                  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(lowerPath);
                  const isPdf = lowerPath.endsWith('.pdf');
                  const isWordDoc = /\.(docx?|xlsx?|pptx?)$/i.test(lowerPath);

                  if (isImage) {
                    return (
                      <img
                        src={rawUrl}
                        alt="Resume"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    );
                  }

                  if (isPdf) {
                    // Use the server-side proxy to stream the file inline — same as ticket attachments
                    const proxyUrl = `/api/download?url=${encodeURIComponent(rawUrl)}&name=${encodeURIComponent(fileName)}&inline=true`;
                    return (
                      <iframe
                        src={proxyUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 'none', borderRadius: 8 }}
                        title="Resume"
                      />
                    );
                  }

                  if (isWordDoc) {
                    // Use Google Docs viewer for Word/Excel/PowerPoint — same as ticket attachments
                    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;
                    return (
                      <iframe
                        src={viewerUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 'none', borderRadius: 8, background: '#fafafa' }}
                        title="Resume"
                      />
                    );
                  }

                  // Fallback: show download option for unsupported formats
                  return (
                    <div className="flex flex-col items-center justify-center h-full border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-[#0B0F1A]">
                      <FileText size={48} className="text-slate-400 mb-4" />
                      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">Preview not available</h3>
                      <p className="text-sm text-slate-500 text-center max-w-sm mb-5">This file format cannot be previewed in the browser.</p>
                      <a
                        href={`/api/download?url=${encodeURIComponent(rawUrl)}&name=${encodeURIComponent(fileName)}`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors"
                      >
                        Download Resume
                      </a>
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-[#0B0F1A]">
                  <FileText size={40} className="text-slate-400 mb-3 opacity-50" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No resume uploaded yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Drawer
        {...commonDrawerProps}
        title="Schedule Interview"
        width={600}
        onClose={() => setIsScheduleOpen(false)}
        open={isScheduleOpen}
      >
        <style dangerouslySetInnerHTML={{ __html: drawerFormStyles }} />
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B0F1A]">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F1A]">
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">Schedule Interview</h2>
            <button type="button" onClick={() => setIsScheduleOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 customer-drawer-form">
            {!config ? (
              <div className="text-center p-8 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
                No pipeline configuration found for the role <b>{candidate.role}</b>.<br /><br />
                Please create a configuration for this role in the Configurations tab first before scheduling interviews.
              </div>
            ) : (
              <form id="scheduleForm" className="flex flex-col gap-6" onSubmit={async (e) => {
                e.preventDefault();
                if (!isMailConnected) {
                  setIntegrationError('Please integrate your mail account in the Integrations page to schedule interviews.');
                  return;
                }
                setIsScheduling(true);
                try {
                  const res = await pipelineClient.scheduleInterview({
                    candidate_id: id,
                    ...scheduleData,
                  });

                  if (res.data?.emailStatus && res.data.emailStatus !== 'Sent' && res.data.emailStatus !== 'Draft') {
                    message.warning('Interview scheduled, but we could not prepare the email. Please check if your mail account is connected in Zukvo.');
                    setIsScheduleOpen(false);
                    fetchData();
                  } else if (res.data?.email) {
                    setIsScheduleOpen(false);
                    setDraftEmail(res.data.email);
                    setIsDraftEmailOpen(true);
                    fetchData(); // refresh timeline for interview
                  } else {
                    setIsScheduleOpen(false);
                    message.success('Interview scheduled successfully!');
                    fetchData();
                  }
                } catch (err: any) {
                  console.error(err);
                  setIsScheduling(false);
                  setIsScheduleOpen(false);
                  setTimeout(() => {
                    setIntegrationError(err.response?.data?.error || err.message || 'Please integrate your account to schedule interviews.');
                  }, 100);
                } finally {
                  setIsScheduling(false);
                }
              }}>
                <SectionCard title="Basic Details" icon={<FileCheck size={14} />} step="STEP 1">
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Select Round</label>
                    <SearchableDropdown
                      value={scheduleData.round_id || ''}
                      onChange={(val) => setScheduleData({ ...scheduleData, round_id: val })}
                      placeholder="Select Interview Round"
                      options={config.rounds?.map((r: any) => ({
                        label: `${r.round_name} (${r.round_type})`,
                        value: r.id
                      })) || []}
                    />
                  </div>
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Interviewers</label>
                    <SearchableDropdown
                      mode="multiple"
                      placeholder="Select interviewers"
                      value={scheduleData.interviewer_ids}
                      onChange={(val) => setScheduleData({ ...scheduleData, interviewer_ids: val })}
                      options={users.map(u => ({ label: u.name || u.workEmail, value: u.id }))}
                    />
                  </div>
                </SectionCard>

                <SectionCard title="Schedule Details" icon={<Calendar size={14} />} step="STEP 2">
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Date & Time</label>
                    <div className="flex gap-2">
                      <DatePicker
                        className="flex-1 w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm outline-none hover:border-blue-500 focus:border-blue-500"
                        format="YYYY-MM-DD"
                        value={scheduleData.scheduled_date ? dayjs(scheduleData.scheduled_date) : null}
                        onChange={(date, dateString) => setScheduleData({ ...scheduleData, scheduled_date: typeof dateString === 'string' ? dateString : dateString[0] })}
                      />
                      <TimePicker
                        className="flex-1 w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm outline-none hover:border-blue-500 focus:border-blue-500"
                        format="HH:mm"
                        value={scheduleData.scheduled_time ? dayjs(`2000-01-01T${scheduleData.scheduled_time}`) : null}
                        onChange={(time, timeString) => setScheduleData({ ...scheduleData, scheduled_time: typeof timeString === 'string' ? timeString : timeString[0] })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Duration & Mode</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input required type="number" className="w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm outline-none pr-10" value={scheduleData.duration_minutes} onChange={(e) => setScheduleData({ ...scheduleData, duration_minutes: parseInt(e.target.value) })} />
                        <span className="absolute right-3 top-2 text-xs text-slate-400">min</span>
                      </div>
                      <select className="flex-1 w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm outline-none" value={scheduleData.mode} onChange={(e) => setScheduleData({ ...scheduleData, mode: e.target.value })}>
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                      </select>
                    </div>
                  </div>

                  {scheduleData.mode === 'Online' && (
                    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                      <div></div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="generateMeeting"
                          className="rounded border-slate-300 dark:border-slate-600"
                          checked={scheduleData.generate_meeting}
                          onChange={(e) => setScheduleData({ ...scheduleData, generate_meeting: e.target.checked })}
                        />
                        <label htmlFor="generateMeeting" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Auto-generate meeting link
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Location / Link</label>
                    <input type="text" className="w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm outline-none disabled:opacity-50" placeholder="https://meet.google.com/..." value={scheduleData.location_or_link} disabled={scheduleData.mode === 'Online' && scheduleData.generate_meeting} onChange={(e) => setScheduleData({ ...scheduleData, location_or_link: e.target.value })} />
                  </div>
                </SectionCard>
              </form>
            )}
          </div>
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F1A] flex justify-end gap-3">
            <button type="button" onClick={() => setIsScheduleOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors border border-transparent dark:border-slate-700">
              Cancel
            </button>
            <button type="submit" form="scheduleForm" disabled={!config || isScheduling} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50">
              {isScheduling ? 'Scheduling...' : 'Schedule Now'}
            </button>
          </div>
        </div>
      </Drawer>

      <Drawer
        {...commonDrawerProps}
        title="Review & Send Email"
        width={700}
        onClose={() => setIsDraftEmailOpen(false)}
        open={isDraftEmailOpen}
      >
        <style dangerouslySetInnerHTML={{ __html: drawerFormStyles }} />
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B0F1A]">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F1A]">
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">Review & Send Email</h2>
            <button type="button" onClick={() => setIsDraftEmailOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 customer-drawer-form">
            {draftEmail && (
              <SectionCard title="Email Contents" icon={<FileText size={14} />}>
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Subject</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm outline-none"
                    value={draftEmail.subject}
                    onChange={(e) => setDraftEmail({ ...draftEmail, subject: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Email Body</label>
                  <div className="w-full">
                    <TiptapEditor
                      content={draftEmail.body}
                      onChange={(html) => setDraftEmail({ ...draftEmail, body: html })}
                      minHeight={300}
                    />
                  </div>
                </div>
              </SectionCard>
            )}
          </div>
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F1A] flex justify-end gap-3">
            <button type="button" onClick={() => setIsDraftEmailOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors border border-transparent dark:border-slate-700">
              Skip Sending
            </button>
            <button type="button" onClick={async () => {
              if (!draftEmail) return;
              setIsSendingDraft(true);
              try {
                await pipelineClient.sendDraftEmail(draftEmail.id, {
                  subject: draftEmail.subject,
                  body: draftEmail.body
                });
                setIsDraftEmailOpen(false);
                fetchData();
              } catch (err) {
                message.error('Failed to send email');
              } finally {
                setIsSendingDraft(false);
              }
            }} disabled={isSendingDraft} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50">
              {isSendingDraft ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
      </Drawer>

      <Drawer
        {...commonDrawerProps}
        title="Interview Details"
        width={500}
        onClose={() => setIsInterviewDetailsOpen(false)}
        open={isInterviewDetailsOpen}
      >
        <style dangerouslySetInnerHTML={{ __html: drawerFormStyles }} />
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B0F1A]">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F1A]">
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">Interview Details</h2>
            <button type="button" onClick={() => setIsInterviewDetailsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 customer-drawer-form">
            {selectedInterview && (
              <SectionCard title="Details" icon={<Calendar size={14} />}>
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Round Name</div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedInterview.round_name}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Date & Time</div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{dayjs(selectedInterview.scheduled_date).format('MMM D, YYYY')} at {selectedInterview.scheduled_time} ({selectedInterview.duration_minutes}m)</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Mode</div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{selectedInterview.mode}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Location/Link</div>
                    <div className="text-sm font-medium text-blue-600 break-all">
                      {selectedInterview.location_or_link?.startsWith('http') ? (
                        <a href={selectedInterview.location_or_link} target="_blank" rel="noreferrer" className="underline hover:text-blue-800">
                          {selectedInterview.location_or_link}
                        </a>
                      ) : (
                        <span className="text-slate-800 dark:text-slate-200">{selectedInterview.location_or_link || 'Not specified'}</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Status</div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{selectedInterview.status}</div>
                  </div>
                </div>
              </SectionCard>
            )}

            {selectedInterview?.evaluations?.length > 0 && (
              <SectionCard title="Evaluations" icon={<FileCheck size={14} />}>
                <div className="flex flex-col gap-4">
                  {selectedInterview.evaluations.map((ev: any) => (
                    <div key={ev.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{ev.criteria_name}</div>
                        <div className="text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                          {ev.score} / 100
                        </div>
                      </div>
                      {ev.feedback && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Feedback</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{ev.feedback}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </Drawer>

      <Drawer
        {...commonDrawerProps}
        title="Evaluate Candidate"
        width={600}
        onClose={() => setIsEvaluateOpen(false)}
        open={isEvaluateOpen}
      >
        <style dangerouslySetInnerHTML={{ __html: drawerFormStyles }} />
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B0F1A]">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F1A]">
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-200">Evaluate Candidate</h2>
            <button type="button" onClick={() => setIsEvaluateOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 customer-drawer-form">
            <form id="evaluateForm" className="flex flex-col gap-6" onSubmit={async (e) => {
              e.preventDefault();
              setIsEvaluating(true);
              try {
                const evaluationsArray = Object.entries(evalData.evaluations).map(([criteria_id, data]) => ({
                  criteria_id,
                  score: data.score,
                  feedback: data.feedback
                }));
                await pipelineClient.evaluateInterview(evalData.interview_id, {
                  evaluations: evaluationsArray
                });
                message.success('Evaluation submitted successfully');
                setIsEvaluateOpen(false);
                fetchData();
              } catch (err) {
                console.error(err);
                message.error('Failed to submit evaluation');
              } finally {
                setIsEvaluating(false);
              }
            }}>
              <SectionCard title="Select Interview" icon={<Calendar size={14} />} step="STEP 1">
                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Select Interview</label>
                  <SearchableDropdown
                    value={evalData.interview_id || ''}
                    onChange={(val) => setEvalData({ interview_id: val, evaluations: {} })}
                    placeholder="Select Interview to Evaluate"
                    options={interviews.filter(i => i.status !== 'Completed').map((i: any) => ({
                      label: `${i.round_name} (${dayjs(i.scheduled_date).format('MMM D')})`,
                      value: i.id
                    }))}
                  />
                </div>
              </SectionCard>

              {evalData.interview_id && (() => {
                const selectedInterview = interviews.find(i => i.id === evalData.interview_id);
                const round = config?.rounds?.find((r: any) => r.id === selectedInterview?.round_id);

                if (!round) return <div className="text-red-500 text-sm">Round configuration not found.</div>;
                if (!round.scorecards || round.scorecards.length === 0) return <div className="text-slate-500 text-sm">No scorecard criteria defined for this round.</div>;

                return (
                  <SectionCard title={`Scorecard - ${round.round_name}`} icon={<FileCheck size={14} />} step="STEP 2">
                    {round.scorecards.map((sc: any) => (
                      <div key={sc.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col gap-4">
                        <div className="grid grid-cols-[140px_1fr_40px] items-center gap-4">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-tight">
                            {sc.criteria_name} <br /><span className="text-xs font-normal text-slate-500">(Weight: {sc.weight_percentage}%)</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            className="w-full accent-blue-600"
                            value={evalData.evaluations[sc.id]?.score || 0}
                            onChange={(e) => setEvalData(prev => ({
                              ...prev,
                              evaluations: {
                                ...prev.evaluations,
                                [sc.id]: { ...prev.evaluations[sc.id], score: parseInt(e.target.value) }
                              }
                            }))}
                          />
                          <div className="text-sm font-bold text-blue-600 dark:text-blue-400 text-right">
                            {evalData.evaluations[sc.id]?.score || 0}
                          </div>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                          <label className="text-xs font-semibold text-slate-500 mt-2">Feedback</label>
                          <textarea
                            placeholder="Provide feedback (optional)"
                            className="w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm outline-none resize-none h-16"
                            value={evalData.evaluations[sc.id]?.feedback || ''}
                            onChange={(e) => setEvalData(prev => ({
                              ...prev,
                              evaluations: {
                                ...prev.evaluations,
                                [sc.id]: { ...prev.evaluations[sc.id], feedback: e.target.value }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    ))}
                  </SectionCard>
                );
              })()}
            </form>
          </div>
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F1A] flex justify-end gap-3">
            <button type="button" onClick={() => setIsEvaluateOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors border border-transparent dark:border-slate-700">
              Cancel
            </button>
            <button type="submit" form="evaluateForm" disabled={!evalData.interview_id || isEvaluating} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50">
              {isEvaluating ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </div>
        </div>
      </Drawer>

      <Modal
        open={!!integrationError}
        onCancel={() => setIntegrationError(null)}
        footer={null}
        centered
        width={420}
        closeIcon={false}
        zIndex={100000}
      >
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-6">
            <AlertTriangle className="text-orange-500" size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Integration Required
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 leading-relaxed px-2">
            {integrationError}
          </p>
          <div className="flex w-full mt-2">
            <button
              onClick={() => setIntegrationError(null)}
              className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              Understood
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        title={
          <div className="flex items-center gap-2 text-red-600 dark:text-red-500 text-lg">
            <UserX size={20} />
            Reject Candidate
          </div>
        }
        open={isRejectModalOpen}
        onOk={submitRejection}
        onCancel={() => setIsRejectModalOpen(false)}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true, className: "bg-red-600 hover:bg-red-700" }}
      >
        <div className="flex flex-col gap-4 mt-2 mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This will update the candidate's status to <strong className="text-slate-800 dark:text-slate-200">Rejected</strong> and record the rejection in their timeline.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Which round was the candidate rejected in? (Optional)
            </label>
            <div className="w-full relative z-50">
              <SearchableDropdown
                value={rejectRoundId || ''}
                onChange={(val) => setRejectRoundId(val || '')}
                allowClear
                placeholder="Select a round"
                options={config?.rounds?.map((r: any) => ({ label: r.round_name, value: r.id })) || []}
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title="Request Documents"
        open={isRequestDocsOpen}
        onCancel={() => setIsRequestDocsOpen(false)}
        onOk={async () => {
          if (selectedDocs.length === 0) return;
          setIsRequestingDocs(true);
          try {
            await pipelineClient.requestDocuments(id, selectedDocs);
            message.success('Documents requested successfully');
            setIsRequestDocsOpen(false);
            setSelectedDocs([]);
            fetchData();
          } catch (err) {
            console.error(err);
            message.error('Failed to request documents');
          } finally {
            setIsRequestingDocs(false);
          }
        }}
        confirmLoading={isRequestingDocs}
        okText="Send Request"
      >
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Select the documents you want to request from the candidate. They will receive a secure portal link to upload them.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_DOCS.map(doc => (
              <label key={doc} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={selectedDocs.includes(doc)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedDocs([...selectedDocs, doc]);
                    else setSelectedDocs(selectedDocs.filter(d => d !== doc));
                  }}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                {doc}
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        title="Reason for Resubmission"
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setDocumentToReject(null);
        }}
        onOk={async () => {
          if (rejectReason.trim() && documentToReject) {
            await pipelineClient.verifyDocument(id, documentToReject, { status: 'Resubmission Required', remarks: rejectReason });
            message.success('Document rejected successfully');
            fetchData();
            setRejectModalOpen(false);
            setDocumentToReject(null);
          }
        }}
        okText="Submit"
        okButtonProps={{ disabled: !rejectReason.trim() }}
      >
        <textarea
          className="w-full border border-slate-200 dark:border-slate-700 rounded p-3 text-sm focus:outline-none focus:border-blue-500 bg-white dark:bg-[#0B0F1A] text-slate-800 dark:text-slate-200 min-h-[100px]"
          placeholder="Enter reason for resubmission..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      <Modal
        title="Confirm Verification"
        open={verifyModalOpen}
        onCancel={() => {
          setVerifyModalOpen(false);
          setDocumentToVerify(null);
        }}
        onOk={async () => {
          if (documentToVerify) {
            await pipelineClient.verifyDocument(id, documentToVerify, { status: 'Verified' });
            message.success('Document verified successfully');
            fetchData();
            setVerifyModalOpen(false);
            setDocumentToVerify(null);
          }
        }}
        okText="Confirm"
        okButtonProps={{ className: "bg-blue-600" }}
      >
        <p className="text-slate-600 dark:text-slate-300">Are you sure you want to mark this document as Verified?</p>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800 dark:text-slate-100">Upload Document Manually</span>
          </div>
        }
        open={isUploadManualOpen}
        onCancel={() => {
          setIsUploadManualOpen(false);
          setManualUploadDocType('');
          setManualUploadFile(null);
        }}
        onOk={async () => {
          if (!manualUploadDocType || !manualUploadFile) return;
          setIsUploadingManual(true);
          try {
            const formData = new FormData();
            formData.append('document_type', manualUploadDocType);
            formData.append('document', manualUploadFile);

            await pipelineClient.uploadManualDocument(id, formData);
            message.success('Document uploaded successfully');
            await fetchData();
            setIsUploadManualOpen(false);
            setManualUploadDocType('');
            setManualUploadFile(null);
          } catch (err: any) {
            setUploadError(err.message || 'Upload failed');
          } finally {
            setIsUploadingManual(false);
          }
        }}
        confirmLoading={isUploadingManual}
        okText="Upload"
        okButtonProps={{ disabled: !manualUploadDocType || !manualUploadFile }}
      >
        <div className="flex flex-col gap-5 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Document Type</label>
            <div className="relative z-50">
              <SearchableDropdown
                value={manualUploadDocType}
                onChange={setManualUploadDocType}
                options={DEFAULT_DOCS.map(doc => ({ value: doc, label: doc }))}
                placeholder="Select or type document name..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Document File</label>
            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 hover:bg-slate-50 dark:hover:bg-[#151a26] hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden group">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setManualUploadFile(e.target.files[0]);
                  }
                }}
              />
              {manualUploadFile ? (
                <>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{manualUploadFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{(manualUploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    <span className="text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PDF, PNG, or JPG (max. 5MB)</p>
                </>
              )}
            </div>

            {manualUploadDocType === 'Aadhaar Card' && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3.5 rounded-lg flex gap-3 items-start text-sm border border-blue-100 dark:border-blue-800/50">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                <p>An automated validation check will extract and securely hash the Aadhaar number to prevent duplicates. Please ensure the scan is clear.</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={!!uploadError}
        onCancel={() => setUploadError(null)}
        footer={null}
        closable={false}
        width={400}
        bodyStyle={{ padding: 0 }}
        className="overflow-hidden rounded-2xl"
      >
        <div className="bg-red-50 dark:bg-red-900/20 p-6 flex flex-col items-center justify-center text-center border-b border-red-100 dark:border-red-900/30">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-red-700 dark:text-red-400">Upload Blocked</h3>
        </div>
        <div className="p-6 bg-white dark:bg-[#0B0F1A]">
          <p className="text-slate-600 dark:text-slate-300 text-sm text-center leading-relaxed">
            {uploadError}
          </p>
          <div className="mt-8">
            <button
              onClick={() => setUploadError(null)}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-red-500/20"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition ${active ? 'border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-400 bg-white dark:bg-[#0B0F1A]' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
    >
      {icon} {label}
    </button>
  );
}
