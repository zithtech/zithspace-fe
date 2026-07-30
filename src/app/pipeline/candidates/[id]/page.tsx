'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PipelineService as pipelineClient } from '@/services/pipelineService';
import { MembersService } from '@/services/membersService';
import { ArrowLeft, Calendar, FileCheck, DollarSign, Clock, FileText } from 'lucide-react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { Drawer, Select } from 'antd';

export default function CandidateDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [candidate, setCandidate] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState('logs');
  const [loading, setLoading] = useState(true);

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
      const [cRes, lRes, iRes, oRes, eRes, cfgRes, usersRes] = await Promise.all([
        pipelineClient.getCandidate(id),
        pipelineClient.getCandidateLogs(id),
        pipelineClient.listCandidateInterviews(id),
        pipelineClient.listCandidateOffers(id),
        pipelineClient.getCandidateEmails(id),
        pipelineClient.listConfigs(),
        MembersService.getMembers({ limit: 100 }),
      ]);
      setCandidate(cRes.data);
      setLogs(lRes.data);
      setInterviews(iRes.data || []);
      setOffers(oRes.data || []);
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
    try {
      await pipelineClient.updateCandidateStatus(id, newStatus);
      fetchData();
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status');
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className="p-8 text-slate-500">Loading candidate profile...</div>;
  if (!candidate) return <div className="p-8 text-red-500">Candidate not found</div>;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <Link href="/pipeline/candidates" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 w-fit">
        <ArrowLeft size={16} /> Back to Candidates
      </Link>

      <div className="bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 dark:from-blue-900/20 to-transparent rounded-full -mr-32 -mt-32 opacity-70 pointer-events-none"></div>
        <div className="flex items-center gap-6 z-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 dark:from-indigo-900/50 to-blue-200 dark:to-blue-900/50 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-800 dark:text-blue-400 font-bold text-3xl shadow-sm">
            {candidate.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-200 tracking-tight">{candidate.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="text-sm font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800/50">{candidate.role}</div>
              <Select 
                value={candidate.status} 
                size="small" 
                onChange={handleStatusChange} 
                options={[
                  { value: 'New', label: 'New' },
                  { value: 'Interviewing', label: 'Interviewing' },
                  { value: 'Offered', label: 'Offered' },
                  { value: 'Rejected', label: 'Rejected' },
                ]}
                className="w-36 font-medium"
              />
            </div>
            <div className="text-sm text-slate-500 font-medium mt-3 flex items-center gap-4">
              <span className="flex items-center gap-1.5"><FileText size={14} className="opacity-70"/> {candidate.email}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} className="opacity-70"/> {candidate.mobile}</span>
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">{candidate.total_experience} Yrs Exp</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 z-10">
          {candidate.status !== 'Offered' && candidate.status !== 'Rejected' && (
            <button onClick={() => setIsScheduleOpen(true)} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all transform hover:-translate-y-0.5">
              <Calendar size={18} /> Schedule
            </button>
          )}
          {candidate.status === 'Interviewing' && (
            <button onClick={() => {
              setEvalData({ interview_id: '', evaluations: {} });
              setIsEvaluateOpen(true);
            }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all transform hover:-translate-y-0.5">
              <FileCheck size={18} /> Evaluate
            </button>
          )}
          <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all transform hover:-translate-y-0.5">
            <DollarSign size={18} /> Offer
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<Clock size={16}/>} label="Timeline & Logs" />
          <TabButton active={activeTab === 'interviews'} onClick={() => setActiveTab('interviews')} icon={<Calendar size={16}/>} label={`Interviews (${interviews.length})`} />
          <TabButton active={activeTab === 'emails'} onClick={() => setActiveTab('emails')} icon={<FileText size={16}/>} label={`Emails (${emails.length})`} />
          <TabButton active={activeTab === 'offers'} onClick={() => setActiveTab('offers')} icon={<DollarSign size={16}/>} label={`Offers (${offers.length})`} />
          <TabButton active={activeTab === 'resume'} onClick={() => setActiveTab('resume')} icon={<FileText size={16}/>} label="Resume" />
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'logs' && (
            <div className="flex flex-col gap-6 relative">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200 z-0"></div>
              {logs.map((log: any) => (
                <div key={log.id} className="flex gap-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex-shrink-0 mt-0.5"></div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{log.action_type.replace('_', ' ')}</div>
                    <div className="text-sm text-slate-600">{log.description}</div>
                    <div className="text-xs text-slate-400 mt-1">{dayjs(log.created_at).format('MMM D, YYYY h:mm A')} {log.user_name && `by ${log.user_name}`}</div>
                  </div>
                </div>
              ))}
              {logs.length === 0 && <div className="text-slate-500 pl-8">No activity recorded yet.</div>}
            </div>
          )}

          {activeTab === 'interviews' && (
            <div className="flex flex-col gap-4">
              {interviews.map(i => (
                <div key={i.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-800">{i.round_name}</div>
                    <div className="text-sm text-slate-500">{dayjs(i.scheduled_date).format('MMM D, YYYY')} at {i.scheduled_time} ({i.mode})</div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded ${i.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {i.status}
                  </span>
                </div>
              ))}
              {interviews.length === 0 && <div className="text-slate-500">No interviews scheduled.</div>}
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="flex flex-col gap-4">
              {offers.map(o => (
                <div key={o.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-800">Offer Generated</div>
                    <div className="text-sm text-slate-500">Base Salary: ₹{o.salary.toLocaleString()}</div>
                  </div>
                  <span className="px-2 py-1 text-xs font-bold rounded bg-purple-100 text-purple-700">
                    {o.status}
                  </span>
                </div>
              ))}
              {offers.length === 0 && <div className="text-slate-500">No offers generated.</div>}
            </div>
          )}

          {activeTab === 'emails' && (
            <div className="flex flex-col gap-4">
              {emails.map(e => (
                <div key={e.id} className={`border rounded-lg p-4 flex flex-col gap-3 ${e.status === 'Sent' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-800 text-sm mb-1">{e.subject}</div>
                      <div className="text-xs text-slate-500">{dayjs(e.sent_at).format('MMM D, YYYY h:mm A')}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded border ${e.status === 'Sent' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {e.status}
                      </span>
                      {e.status !== 'Sent' && (
                        <button onClick={async () => {
                          try {
                            await pipelineClient.resendCandidateEmail(e.id);
                            fetchData();
                          } catch (err) {
                            alert('Failed to resend email');
                          }
                        }} className="text-xs bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-700 px-2 py-1 rounded font-medium transition">
                          Resend Email
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 bg-white p-3 rounded border border-slate-100 max-h-32 overflow-y-auto" dangerouslySetInnerHTML={{ __html: e.body }} />
                </div>
              ))}
              {emails.length === 0 && <div className="text-slate-500">No emails sent.</div>}
            </div>
          )}

          {activeTab === 'resume' && (
            <div className="flex flex-col gap-4 h-full">
              {candidate.resume_url ? (
                <iframe src={candidate.resume_url} className="w-full h-full rounded border border-slate-200" title="Resume" />
              ) : (
                <div className="text-slate-500">No resume preview available.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <Drawer
        title="Schedule Interview"
        placement="right"
        width={450}
        onClose={() => setIsScheduleOpen(false)}
        open={isScheduleOpen}
        styles={{ body: { padding: 0 } }}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 overflow-y-auto flex-1">
            {!config ? (
              <div className="text-center p-8 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
                No pipeline configuration found for the role <b>{candidate.role}</b>.<br/><br/>
                Please create a configuration for this role in the Configurations tab first before scheduling interviews.
              </div>
            ) : (
              <form id="scheduleForm" className="flex flex-col gap-4" onSubmit={async (e) => {
                e.preventDefault();
                setIsScheduling(true);
                try {
                  const res = await pipelineClient.scheduleInterview({
                    candidate_id: id,
                    ...scheduleData,
                  });
                  
                  if (res.data?.emailStatus && res.data.emailStatus !== 'Sent') {
                    alert('Interview scheduled, but we could not send the email. Please check if your mail account is connected in Zukvo, or click Resend in the Emails tab.');
                  }
                  
                  setIsScheduleOpen(false);
                  fetchData(); // refresh the timeline!
                } catch(err) {
                  console.error(err);
                  alert('Failed to schedule interview');
                } finally {
                  setIsScheduling(false);
                }
              }}>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Select Round</label>
                  <Select
                    className="w-full"
                    value={scheduleData.round_id || undefined}
                    onChange={(val) => setScheduleData({ ...scheduleData, round_id: val })}
                    placeholder="Select Interview Round"
                    options={config.rounds?.map((r: any) => ({
                      label: `${r.round_name} (${r.round_type})`,
                      value: r.id
                    }))}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                    <input required type="date" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none" value={scheduleData.scheduled_date} onChange={(e) => setScheduleData({ ...scheduleData, scheduled_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Time</label>
                    <input required type="time" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none" value={scheduleData.scheduled_time} onChange={(e) => setScheduleData({ ...scheduleData, scheduled_time: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Duration (Mins)</label>
                    <input required type="number" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none" value={scheduleData.duration_minutes} onChange={(e) => setScheduleData({ ...scheduleData, duration_minutes: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Mode</label>
                    <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none bg-white" value={scheduleData.mode} onChange={(e) => setScheduleData({ ...scheduleData, mode: e.target.value })}>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline / In-person</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Interviewers</label>
                  <Select
                    mode="multiple"
                    className="w-full"
                    placeholder="Select interviewers"
                    value={scheduleData.interviewer_ids}
                    onChange={(val) => setScheduleData({ ...scheduleData, interviewer_ids: val })}
                    options={users.map(u => ({ label: u.name || u.workEmail, value: u.id }))}
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  />
                </div>

                {scheduleData.mode === 'Online' && (
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="checkbox" 
                      id="generateMeeting" 
                      className="rounded border-slate-300"
                      checked={scheduleData.generate_meeting} 
                      onChange={(e) => setScheduleData({ ...scheduleData, generate_meeting: e.target.checked })} 
                    />
                    <label htmlFor="generateMeeting" className="text-sm font-medium text-slate-700">
                      Automatically generate calendar meeting link
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Meeting Link / Location</label>
                  <input type="text" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-400" placeholder="https://meet.google.com/..." value={scheduleData.location_or_link} disabled={scheduleData.mode === 'Online' && scheduleData.generate_meeting} onChange={(e) => setScheduleData({ ...scheduleData, location_or_link: e.target.value })} />
                </div>
              </form>
            )}
          </div>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button type="button" onClick={() => setIsScheduleOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-md transition-colors">
              Cancel
            </button>
            <button type="submit" form="scheduleForm" disabled={!config || isScheduling} className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50">
              {isScheduling ? 'Scheduling...' : 'Schedule Now'}
            </button>
          </div>
        </div>
      </Drawer>

      <Drawer
        title="Evaluate Candidate"
        placement="right"
        width={500}
        onClose={() => setIsEvaluateOpen(false)}
        open={isEvaluateOpen}
        styles={{ body: { padding: 0 } }}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 overflow-y-auto flex-1">
            <form id="evaluateForm" className="flex flex-col gap-6" onSubmit={async (e) => {
              e.preventDefault();
              setIsEvaluating(true);
              try {
                // Format evaluations payload
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
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Select Interview</label>
                <Select
                  className="w-full"
                  value={evalData.interview_id || undefined}
                  onChange={(val) => setEvalData({ interview_id: val, evaluations: {} })}
                  placeholder="Select Interview to Evaluate"
                  options={interviews.filter(i => i.status !== 'Completed').map((i: any) => ({
                    label: `${i.round_name} (${dayjs(i.scheduled_date).format('MMM D')})`,
                    value: i.id
                  }))}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                />
              </div>

              {evalData.interview_id && (() => {
                const selectedInterview = interviews.find(i => i.id === evalData.interview_id);
                const round = config?.rounds?.find((r: any) => r.id === selectedInterview?.round_id);
                
                if (!round) return <div className="text-red-500 text-sm">Round configuration not found.</div>;
                if (!round.scorecards || round.scorecards.length === 0) return <div className="text-slate-500 text-sm">No scorecard criteria defined for this round.</div>;

                return (
                  <div className="flex flex-col gap-6 border-t border-slate-100 pt-4">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Scorecard - {round.round_name}</h3>
                    {round.scorecards.map((sc: any) => (
                      <div key={sc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <label className="block text-sm font-bold text-slate-700">{sc.criteria_name} <span className="text-xs font-normal text-slate-500 ml-1">(Weight: {sc.weight_percentage}%)</span></label>
                          <div className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {evalData.evaluations[sc.id]?.score || 0} / 100
                          </div>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          className="w-full mb-3 accent-blue-600" 
                          value={evalData.evaluations[sc.id]?.score || 0} 
                          onChange={(e) => setEvalData(prev => ({
                            ...prev,
                            evaluations: {
                              ...prev.evaluations,
                              [sc.id]: { ...prev.evaluations[sc.id], score: parseInt(e.target.value) }
                            }
                          }))} 
                        />
                        <textarea 
                          placeholder="Provide feedback (optional)" 
                          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none resize-none h-20"
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
                    ))}
                  </div>
                );
              })()}
            </form>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button type="button" onClick={() => setIsEvaluateOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-md transition-colors">
              Cancel
            </button>
            <button type="submit" form="evaluateForm" disabled={!evalData.interview_id || isEvaluating} className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50">
              {isEvaluating ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </div>
        </div>
      </Drawer>
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
