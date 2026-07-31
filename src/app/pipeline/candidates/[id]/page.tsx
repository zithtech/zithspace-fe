'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PipelineService as pipelineClient } from '@/services/pipelineService';
import { MembersService } from '@/services/membersService';
import { ArrowLeft, Calendar, FileCheck, DollarSign, Clock, FileText } from 'lucide-react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { Drawer, Select, Modal } from 'antd';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { commonDrawerProps, drawerFormStyles, SectionCard } from "@/components/common/DrawerSection";
import TiptapEditor from '@/components/common/TiptapEditor';
import { X } from 'lucide-react';

export default function CandidateDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [candidate, setCandidate] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState('logs');
  const [loading, setLoading] = useState(true);

  // Reject State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectRoundId, setRejectRoundId] = useState('');

  // Scheduling state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, lRes, iRes, eRes, cfgRes, usersRes] = await Promise.all([
        pipelineClient.getCandidate(id),
        pipelineClient.getCandidateLogs(id),
        pipelineClient.listCandidateInterviews(id),
        pipelineClient.getCandidateEmails(id),
        pipelineClient.listConfigs(),
        MembersService.getMembers({ limit: 100 }),
      ]);
      setCandidate(cRes.data);
      setLogs(lRes.data);
      setInterviews(iRes.data || []);
      setEmails(eRes.data || []);
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
      fetchData();
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status');
    }
  };

  const submitRejection = async () => {
    try {
      await pipelineClient.updateCandidateStatus(id, 'Rejected', rejectRoundId);
      setIsRejectModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to reject candidate', err);
      alert('Failed to reject candidate');
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

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
              <span className="flex items-center gap-1"><FileText size={12} className="opacity-70"/> {candidate.email}</span>
              <span className="flex items-center gap-1"><Calendar size={12} className="opacity-70"/> {candidate.mobile}</span>
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">{candidate.total_experience} Yrs Exp</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 z-10">
          <div className="w-40 font-medium">
            <SearchableDropdown
              value={candidate.status}
              onChange={handleStatusChange}
              options={[
                { value: 'New', label: 'New' },
                { value: 'Interviewing', label: 'Interviewing' },
                { value: 'Offered', label: 'Offered' },
                { value: 'Onboarded', label: 'Onboarded' },
                { value: 'Rejected', label: 'Rejected' },
              ]}
            />
          </div>
          {candidate.status !== 'Rejected' && (
            <button onClick={() => setIsScheduleOpen(true)} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all transform hover:-translate-y-0.5">
              <Calendar size={14} /> Schedule
            </button>
          )}
          {candidate.status === 'Interviewing' && (
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
          <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<Clock size={16}/>} label="Timeline & Logs" />
          <TabButton active={activeTab === 'interviews'} onClick={() => setActiveTab('interviews')} icon={<Calendar size={16}/>} label={`Interviews (${interviews.length})`} />
          <TabButton active={activeTab === 'emails'} onClick={() => setActiveTab('emails')} icon={<FileText size={16}/>} label={`Emails (${emails.length})`} />
          <TabButton active={activeTab === 'resume'} onClick={() => setActiveTab('resume')} icon={<FileText size={16}/>} label="Resume" />
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'logs' && (
            <div className="flex flex-col gap-6 relative">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800 z-0"></div>
              {logs.map((log: any) => (
                <div key={log.id} className="flex gap-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 border-2 border-white dark:border-[#0B0F1A] flex-shrink-0 mt-0.5"></div>
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{log.action_type.replace('_', ' ')}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{log.description}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{dayjs(log.created_at).format('MMM D, YYYY h:mm A')} {log.user_name && `by ${log.user_name}`}</div>
                  </div>
                </div>
              ))}
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

          {activeTab === 'resume' && (
            <div className="flex flex-col gap-4 h-full">
              {candidate.resume_url ? (
                <iframe src={candidate.resume_url.startsWith('http') ? candidate.resume_url : `${process.env.NEXT_PUBLIC_API_URL || ''}${candidate.resume_url}`} className="w-full h-full rounded border border-slate-200" title="Resume" />
              ) : (
                <div className="text-slate-500">No resume preview available.</div>
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
                No pipeline configuration found for the role <b>{candidate.role}</b>.<br/><br/>
                Please create a configuration for this role in the Configurations tab first before scheduling interviews.
              </div>
            ) : (
              <form id="scheduleForm" className="flex flex-col gap-6" onSubmit={async (e) => {
                e.preventDefault();
                setIsScheduling(true);
                try {
                  const res = await pipelineClient.scheduleInterview({
                    candidate_id: id,
                    ...scheduleData,
                  });
                  
                  if (res.data?.emailStatus && res.data.emailStatus !== 'Sent' && res.data.emailStatus !== 'Draft') {
                    alert('Interview scheduled, but we could not prepare the email. Please check if your mail account is connected in Zukvo.');
                    setIsScheduleOpen(false);
                    fetchData();
                  } else if (res.data?.email) {
                    setIsScheduleOpen(false);
                    setDraftEmail(res.data.email);
                    setIsDraftEmailOpen(true);
                    fetchData(); // refresh timeline for interview
                  } else {
                    setIsScheduleOpen(false);
                    fetchData();
                  }
                } catch(err) {
                  console.error(err);
                  alert('Failed to schedule interview');
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
                      <input required type="date" className="flex-1 w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm outline-none" value={scheduleData.scheduled_date} onChange={(e) => setScheduleData({ ...scheduleData, scheduled_date: e.target.value })} />
                      <input required type="time" className="flex-1 w-full border border-slate-200 dark:border-slate-700 bg-transparent dark:text-slate-200 rounded-md px-3 py-2 text-sm outline-none" value={scheduleData.scheduled_time} onChange={(e) => setScheduleData({ ...scheduleData, scheduled_time: e.target.value })} />
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
                alert('Failed to send email');
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
                setIsEvaluateOpen(false);
                fetchData();
              } catch(err) {
                console.error(err);
                alert('Failed to submit evaluation');
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
                            {sc.criteria_name} <br/><span className="text-xs font-normal text-slate-500">(Weight: {sc.weight_percentage}%)</span>
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
        title="Reject Candidate"
        open={isRejectModalOpen}
        onOk={submitRejection}
        onCancel={() => setIsRejectModalOpen(false)}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true }}
      >
        <div className="flex flex-col gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Which round was the candidate rejected in? (Optional)</label>
            <Select
              className="w-full"
              value={rejectRoundId}
              onChange={setRejectRoundId}
              allowClear
              placeholder="Select a round"
              options={config?.rounds?.map((r: any) => ({ label: r.round_name, value: r.id })) || []}
            />
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
      className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition ${
        active ? 'border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-400 bg-white dark:bg-[#0B0F1A]' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      {icon} {label}
    </button>
  );
}
