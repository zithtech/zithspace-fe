'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Table, Tag, Drawer, Modal, Select, Input, InputNumber, Avatar, message, Tooltip, Space, Spin, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, ReloadOutlined, CloseOutlined, DeleteOutlined, PlayCircleOutlined,
  TeamOutlined, DollarOutlined, CalendarOutlined, UserOutlined, SyncOutlined,
  SendOutlined, CheckCircleOutlined, CloseCircleOutlined, BranchesOutlined,
  LockOutlined, BankOutlined, FilePdfOutlined, DownloadOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import PayrollV2Service, {
  PayRun, PayRunDetail, PayRunItem, PayRunStatus, PayRunLine, PayRunApproval, PayPayslip, PayBankFile, MemberOption, ComponentCategory,
  PayslipJob, PayslipJobItem,
} from '@/services/payrollV2Service';

const PALETTE = { green: '#10B981', blue: '#3B82F6', amber: '#F59E0B', red: '#EF4444', violet: '#8B5CF6', slate: '#64748B' } as const;
const TINT = { green: 'rgba(16,185,129,0.10)', blue: 'rgba(59,130,246,0.10)', amber: 'rgba(245,158,11,0.10)', slate: 'rgba(100,116,139,0.12)' } as const;
const CAT_COLOR: Record<ComponentCategory, string> = { earning: PALETTE.green, deduction: PALETTE.red, reimbursement: PALETTE.blue, benefit: PALETTE.violet };

const STATUS_META: Record<PayRunStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'default' },
  pending_approval: { label: 'Pending Approval', color: 'gold' },
  approved: { label: 'Approved', color: 'blue' },
  finalized: { label: 'Finalized', color: 'green' },
  paid: { label: 'Paid', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const BANK_FMT_LABEL: Record<string, string> = {
  generic_csv: 'Generic CSV', hdfc: 'HDFC Bank', icici: 'ICICI Bank', sbi: 'State Bank of India', axis: 'Axis Bank', kotak: 'Kotak Mahindra',
};
const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const money = (n: number) => `₹${inr.format(Math.round(n))}`;
const initials = (name: string) => name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

export default function PayRunPanel() {
  const {
    canReadPayrollRun, canCreatePayrollRun, canProcessPayrollRun, canApprovePayrollRun,
    canFinalizePayrollRun, canPayPayrollRun, canGeneratePayrollPayslips, canDeletePayrollRun, canManagePayroll,
  } = usePermission();
  const canApprove = canApprovePayrollRun || canManagePayroll;
  const nowYear = new Date().getFullYear();
  const nowMonth = new Date().getMonth() + 1;

  const [runs, setRuns] = useState<PayRun[]>([]);
  const [empMap, setEmpMap] = useState<Map<string, MemberOption>>(new Map());
  const [loading, setLoading] = useState(false);

  // create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [cMonth, setCMonth] = useState(nowMonth);
  const [cYear, setCYear] = useState(nowYear);
  const [cNotes, setCNotes] = useState('');
  const [creating, setCreating] = useState(false);

  // detail drawer
  const [detail, setDetail] = useState<PayRunDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [lopEdits, setLopEdits] = useState<Record<string, number>>({});
  const [savingItem, setSavingItem] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [payslips, setPayslips] = useState<Map<string, PayPayslip>>(new Map());
  const [genPayslips, setGenPayslips] = useState(false);
  const [payslipJob, setPayslipJob] = useState<PayslipJob | null>(null);
  const [payslipItems, setPayslipItems] = useState<Map<string, PayslipJobItem>>(new Map());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [bankFile, setBankFile] = useState<PayBankFile | null>(null);
  const [genBank, setGenBank] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionMode, setActionMode] = useState<null | 'approve' | 'reject'>(null);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, emps] = await Promise.all([PayrollV2Service.listRuns(), PayrollV2Service.getEmployeesForSelect()]);
      setRuns(r);
      setEmpMap(new Map(emps.map((e) => [e.value, e])));
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load pay runs');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (canReadPayrollRun) load(); }, [canReadPayrollRun, load]);

  const refreshArtifacts = async (d: PayRunDetail) => {
    if (d.status === 'finalized' || d.status === 'paid') {
      if (canReadPayrollRun) {
        try { const ps = await PayrollV2Service.listRunPayslips(d.id); setPayslips(new Map(ps.map((p) => [p.employeeId, p]))); } catch { /* best-effort */ }
      }
      try { setBankFile(await PayrollV2Service.getRunBankFile(d.id)); } catch { /* best-effort */ }
    } else { setPayslips(new Map()); setBankFile(null); }
  };

  const openDetail = async (run: PayRun) => {
    stopPolling();
    setDetailOpen(true); setDetail(null); setDetailLoading(true); setLopEdits({}); setPayslips(new Map());
    setPayslipJob(null); setPayslipItems(new Map());
    try {
      const d = await PayrollV2Service.getRun(run.id);
      setDetail(d);
      await refreshArtifacts(d);
      await loadPayslipJob(d);
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to load run'); }
    finally { setDetailLoading(false); }
  };
  const closeDetail = () => { stopPolling(); setDetailOpen(false); };

  // ── async payslip job (progress polling) ───────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const pollStatus = useCallback(async (runId: string) => {
    try {
      const { job, items } = await PayrollV2Service.getPayslipJobStatus(runId);
      setPayslipJob(job);
      setPayslipItems(new Map(items.map((i) => [i.employeeId, i])));
      if (job && (job.status === 'completed' || job.status === 'completed_with_errors' || job.status === 'failed')) {
        stopPolling();
        setGenPayslips(false);
        try { const ps = await PayrollV2Service.listRunPayslips(runId); setPayslips(new Map(ps.map((p) => [p.employeeId, p]))); } catch { /* best-effort */ }
      }
    } catch { /* transient — keep polling */ }
  }, [stopPolling]);

  const startPolling = useCallback((runId: string) => {
    stopPolling();
    setGenPayslips(true);
    pollStatus(runId);
    pollRef.current = setInterval(() => pollStatus(runId), 2500);
  }, [pollStatus, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]); // cleanup on unmount

  // Load any existing job when opening a finalized/paid run (resumes progress across reopens).
  const loadPayslipJob = useCallback(async (d: PayRunDetail) => {
    if (d.status !== 'finalized' && d.status !== 'paid') { setPayslipJob(null); setPayslipItems(new Map()); return; }
    try {
      const { job, items } = await PayrollV2Service.getPayslipJobStatus(d.id);
      setPayslipJob(job);
      setPayslipItems(new Map(items.map((i) => [i.employeeId, i])));
      if (job && (job.status === 'running' || job.status === 'queued')) startPolling(d.id);
    } catch { /* async disabled — ignore */ }
  }, [startPolling]);

  const generate = async () => {
    if (!detail) return;
    setGenPayslips(true);
    try {
      const res = await PayrollV2Service.generateRunPayslips(detail.id);
      if (res && 'payslips' in res) {
        // synchronous mode (async disabled)
        setPayslips(new Map(res.payslips.map((p) => [p.employeeId, p])));
        setGenPayslips(false);
        message.success(`Generated ${res.generated} payslip(s)`);
      } else {
        // async mode — a job header was returned; poll for progress
        setPayslipJob(res as PayslipJob);
        message.info('Payslip generation started');
        startPolling(detail.id);
      }
    } catch (err: any) {
      setGenPayslips(false);
      message.error(err?.response?.data?.error || 'Failed to generate payslips');
    }
  };

  const completePending = async () => {
    if (!detail) return;
    try {
      const job = await PayrollV2Service.resumeRunPayslips(detail.id);
      setPayslipJob(job);
      message.info('Resuming pending payslips');
      startPolling(detail.id);
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to resume payslips'); }
  };

  const generateBank = async () => {
    if (!detail) return;
    setGenBank(true);
    try {
      const bf = await PayrollV2Service.generateRunBankFile(detail.id);
      setBankFile(bf);
      message.success(`Bank file ready — ${bf.employeeCount} payee(s)${bf.skippedCount ? `, ${bf.skippedCount} skipped (no account)` : ''}`);
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to generate bank file'); }
    finally { setGenBank(false); }
  };

  const create = async () => {
    setCreating(true);
    try {
      const d = await PayrollV2Service.createRun({ month: cMonth, year: cYear, notes: cNotes.trim() || null });
      message.success('Pay run created');
      setCreateOpen(false); setCNotes('');
      await load();
      setDetail(d); setDetailOpen(true); setLopEdits({});
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to create pay run'); }
    finally { setCreating(false); }
  };

  const removeRun = async (run: PayRun) => {
    try { await PayrollV2Service.deleteRun(run.id); message.success('Pay run deleted'); setDetailOpen(false); await load(); }
    catch (err: any) { message.error(err?.response?.data?.error || 'Failed to delete run'); }
  };

  const saveLop = async (item: PayRunItem) => {
    if (!detail) return;
    const next = lopEdits[item.id];
    if (next == null || next === item.lopDays) return;
    setSavingItem(item.id);
    try {
      const updated = await PayrollV2Service.updateRunItem(detail.id, item.id, { lopDays: next });
      setDetail(updated);
      setLopEdits((p) => { const c = { ...p }; delete c[item.id]; return c; });
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to update'); }
    finally { setSavingItem(null); }
  };

  const syncLop = async () => {
    if (!detail) return;
    setSyncing(true);
    try {
      const res = await PayrollV2Service.syncRunLop(detail.id);
      setDetail(res.detail);
      setLopEdits({});
      message.success(res.syncedEmployees > 0
        ? `Synced ${res.totalLopDays} LOP day(s) across ${res.syncedEmployees} employee(s)`
        : 'No approved unpaid leave found for this month');
      await load();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to sync LOP');
    } finally { setSyncing(false); }
  };

  const submit = async () => {
    if (!detail) return;
    setSubmitting(true);
    try {
      const d = await PayrollV2Service.submitRun(detail.id);
      setDetail(d); message.success('Submitted for approval'); await load();
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const doProcess = async () => {
    if (!detail || !actionMode) return;
    if (actionMode === 'reject' && !remarks.trim()) { message.error('Please add a reason for rejection'); return; }
    setProcessing(true);
    try {
      const d = await PayrollV2Service.processRunStep(detail.id, actionMode, remarks.trim() || null);
      setDetail(d);
      message.success(actionMode === 'approve' ? (d.status === 'approved' ? 'Run approved' : 'Step approved') : 'Run rejected');
      setActionMode(null); setRemarks(''); await load();
    } catch (err: any) { message.error(err?.response?.data?.error || 'Failed to process'); }
    finally { setProcessing(false); }
  };

  const finalize = async () => {
    if (!detail) return;
    setProcessing(true);
    try { const d = await PayrollV2Service.finalizeRun(detail.id); setDetail(d); await refreshArtifacts(d); message.success('Run finalized & locked'); await load(); }
    catch (err: any) { message.error(err?.response?.data?.error || 'Failed to finalize'); }
    finally { setProcessing(false); }
  };
  const markPaid = async () => {
    if (!detail) return;
    setProcessing(true);
    try { const d = await PayrollV2Service.markRunPaid(detail.id); setDetail(d); await refreshArtifacts(d); message.success('Run marked as paid'); await load(); }
    catch (err: any) { message.error(err?.response?.data?.error || 'Failed to mark paid'); }
    finally { setProcessing(false); }
  };

  const empName = (id: string) => empMap.get(id)?.label ?? 'Unknown';
  const empAvatar = (id: string) => empMap.get(id)?.avatarUrl ?? null;
  const isDraft = detail?.status === 'draft';
  const isPending = detail?.status === 'pending_approval';
  const isApproved = detail?.status === 'approved';
  const isFinalized = detail?.status === 'finalized';
  const isLocked = detail?.status === 'finalized' || detail?.status === 'paid';

  const runColumns: ColumnsType<PayRun> = [
    {
      title: 'Period', dataIndex: 'periodLabel', key: 'period',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="pvr-cal" style={{ background: TINT.green, color: PALETTE.green }}><CalendarOutlined /></span>
          <div><div style={{ fontWeight: 700 }}>{r.periodLabel}</div><div style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>{r.payGroupName}</div></div>
        </div>
      ),
    },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: PayRunStatus) => <Tag color={STATUS_META[s].color}>{STATUS_META[s].label}</Tag> },
    { title: 'Employees', dataIndex: 'employeeCount', key: 'employeeCount', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Gross', dataIndex: 'totalGross', key: 'gross', render: (v) => money(v) },
    { title: 'Deductions', dataIndex: 'totalDeductions', key: 'ded', render: (v) => <span style={{ color: PALETTE.red }}>−{money(v)}</span> },
    { title: 'Net Pay', dataIndex: 'totalNet', key: 'net', render: (v) => <span style={{ fontWeight: 700 }}>{money(v)}</span> },
    { title: '', key: 'open', width: 90, align: 'right', render: (_, r) => <Button size="small" onClick={() => openDetail(r)}>Open</Button> },
  ];

  const itemColumns: ColumnsType<PayRunItem> = [
    {
      title: 'Employee', key: 'emp',
      render: (_, it) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar size={28} src={empAvatar(it.employeeId) || undefined} style={{ background: TINT.slate, color: PALETTE.slate, fontSize: 11, fontWeight: 700 }}>
            {!empAvatar(it.employeeId) && (empMap.get(it.employeeId) ? initials(empName(it.employeeId)) : <UserOutlined />)}
          </Avatar>
          <div><div style={{ fontWeight: 600 }}>{empName(it.employeeId)}</div>{it.structureName && <div style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>{it.structureName}</div>}</div>
        </div>
      ),
    },
    { title: 'Monthly CTC', dataIndex: 'monthlyCtc', key: 'ctc', render: (v) => money(v) },
    {
      title: 'LOP days', key: 'lop', width: 110,
      render: (_, it) => isDraft ? (
        <InputNumber size="small" min={0} max={it.totalDays} value={lopEdits[it.id] ?? it.lopDays} style={{ width: 76 }}
          onChange={(v) => setLopEdits((p) => ({ ...p, [it.id]: Number(v ?? 0) }))}
          onBlur={() => saveLop(it)} onPressEnter={() => saveLop(it)} disabled={savingItem === it.id} />
      ) : <span>{it.lopDays}</span>,
    },
    { title: 'Paid days', dataIndex: 'paidDays', key: 'paid', render: (v, it) => <span>{v} / {it.totalDays}</span> },
    { title: 'Gross', dataIndex: 'gross', key: 'gross', render: (v) => money(v) },
    { title: 'Deductions', dataIndex: 'totalDeductions', key: 'ded', render: (v) => <span style={{ color: PALETTE.red }}>−{money(v)}</span> },
    { title: 'Net Pay', dataIndex: 'net', key: 'net', render: (v) => <span style={{ fontWeight: 700 }}>{money(v)}</span> },
    ...(isLocked ? [{
      title: 'Payslip', key: 'payslip', width: 90, align: 'center' as const,
      render: (_: any, it: PayRunItem) => {
        const ps = payslips.get(it.employeeId);
        if (ps) return <a href={ps.fileUrl} target="_blank" rel="noreferrer" style={{ color: PALETTE.blue }}><DownloadOutlined /> PDF</a>;
        const st = payslipItems.get(it.employeeId)?.status;
        if (st === 'processing' || st === 'pending') return <Spin size="small" />;
        if (st === 'failed') return <Tooltip title={payslipItems.get(it.employeeId)?.error || 'Generation failed'}><span style={{ color: PALETTE.red, fontWeight: 600 }}>Failed</span></Tooltip>;
        return <span style={{ color: 'var(--text-slate-300)' }}>—</span>;
      },
    }] : []),
  ];

  if (!canReadPayrollRun) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.slate }}>You don’t have permission to view pay runs.</div>;
  }

  const yearOptions = [nowYear - 2, nowYear - 1, nowYear, nowYear + 1].map((y) => ({ value: y, label: String(y) }));

  return (
    <div className="pvr">
      <div className="pvr-header">
        <div className="pvr-header-about">
          <div className="pvr-header-icon"><PlayCircleOutlined /></div>
          <div>
            <div className="pvr-header-title">Run Payroll</div>
            <div className="pvr-header-sub">Create a monthly run and review the salary register</div>
          </div>
        </div>
        <div className="pvr-header-actions">
          <Tooltip title="Refresh"><button type="button" className="pvr-ghost-btn" onClick={load}><ReloadOutlined spin={loading} /></button></Tooltip>
          {canCreatePayrollRun && <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)} className="pvr-add-btn">New Pay Run</Button>}
        </div>
      </div>

      <div className="pvr-table-wrap">
        {runs.length === 0 && !loading
          ? <div style={{ padding: 48 }}><Empty description="No pay runs yet — create one to get started" /></div>
          : <Table rowKey="id" size="small" className="pvr-table" loading={loading} columns={runColumns} dataSource={runs} pagination={false} onRow={(r) => ({ onClick: () => openDetail(r), style: { cursor: 'pointer' } })} />}
      </div>

      {/* CREATE MODAL */}
      <Modal title={null} open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} width={480} destroyOnClose
        closable={false} styles={{ content: { padding: 0, borderRadius: 14, overflow: 'hidden' }, body: { padding: 0 } }}>
        <div className="pvr-modal">
          <div className="pvr-modal-head">
            <div className="pvr-modal-chip"><PlayCircleOutlined /></div>
            <div className="pvr-modal-htext">
              <div className="pvr-modal-title">New Pay Run</div>
              <div className="pvr-modal-sub">Seeds every actively-assigned employee</div>
            </div>
            <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={() => setCreateOpen(false)} className="pvr-modal-x" />
          </div>
          <div className="pvr-modal-body">
            <div className="pvr-note">
              <InfoCircleOutlined />
              <span>A <strong>draft</strong> run is created for this period with every active employee's computed salary. You can review and edit LOP days before submitting for approval.</span>
            </div>
            <div className="pvr-modal-grid">
              <div className="pvr-mfield">
                <div className="pvr-mlabel">Month</div>
                <Select size="large" value={cMonth} onChange={setCMonth} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} style={{ width: '100%' }} />
              </div>
              <div className="pvr-mfield">
                <div className="pvr-mlabel">Year</div>
                <Select size="large" value={cYear} onChange={setCYear} options={yearOptions} style={{ width: '100%' }} />
              </div>
            </div>
            <div className="pvr-mfield">
              <div className="pvr-mlabel">Notes <span className="opt">(optional)</span></div>
              <Input.TextArea rows={2} value={cNotes} onChange={(e) => setCNotes(e.target.value)} maxLength={500} placeholder="e.g. Regular monthly payroll" />
            </div>
          </div>
          <div className="pvr-modal-foot">
            <Button onClick={() => setCreateOpen(false)} style={{ height: 38, borderRadius: 8, fontWeight: 600 }}>Cancel</Button>
            <Button type="primary" loading={creating} onClick={create} icon={<PlayCircleOutlined />} style={{ height: 38, borderRadius: 8, fontWeight: 600 }}>Create Run</Button>
          </div>
        </div>
      </Modal>

      {/* APPROVE / REJECT MODAL */}
      <Modal title={null} open={!!actionMode} onCancel={() => setActionMode(null)} footer={null} width={480} destroyOnClose
        closable={false} styles={{ content: { padding: 0, borderRadius: 14, overflow: 'hidden' }, body: { padding: 0 } }}>
        {(() => {
          const isReject = actionMode === 'reject';
          const isFinal = !!detail && detail.currentStep >= detail.totalSteps;
          return (
            <div className="pvr-modal">
              <div className="pvr-modal-head">
                <div className="pvr-modal-chip" style={isReject ? { background: 'rgba(239,68,68,0.10)', color: PALETTE.red } : undefined}>
                  {isReject ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
                </div>
                <div className="pvr-modal-htext">
                  <div className="pvr-modal-title">{isReject ? 'Reject Pay Run' : 'Approve Pay Run'}</div>
                  <div className="pvr-modal-sub">{isReject ? 'Sends the run back to draft for correction' : (isFinal ? 'Final approval — locks the register' : 'Advances to the next approval step')}</div>
                </div>
                <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={() => setActionMode(null)} className="pvr-modal-x" />
              </div>
              <div className="pvr-modal-body">
                <div className={`pvr-note ${isReject ? 'pvr-note--danger' : ''}`}>
                  {isReject ? <CloseCircleOutlined /> : <InfoCircleOutlined />}
                  <span>
                    {isReject
                      ? <>Rejecting returns this run to <strong>draft</strong> so it can be corrected and resubmitted. Please add a reason below.</>
                      : (isFinal
                        ? <>This is the <strong>final</strong> approval step — the salary register will be locked and payslips can be generated.</>
                        : <>Approving advances this run to the <strong>next</strong> approval step in the workflow.</>)}
                  </span>
                </div>
                <div className="pvr-mfield">
                  <div className="pvr-mlabel">Remarks {isReject ? <span style={{ color: PALETTE.red }}>*</span> : <span className="opt">(optional)</span>}</div>
                  <Input.TextArea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength={500} placeholder={isReject ? 'Reason for rejection' : 'Optional note'} />
                </div>
              </div>
              <div className="pvr-modal-foot">
                <Button onClick={() => setActionMode(null)} style={{ height: 38, borderRadius: 8, fontWeight: 600 }}>Cancel</Button>
                <Button type="primary" danger={isReject} loading={processing} onClick={doProcess} icon={isReject ? <CloseCircleOutlined /> : <CheckCircleOutlined />} style={{ height: 38, borderRadius: 8, fontWeight: 600 }}>
                  {isReject ? 'Reject' : 'Approve'}
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* DETAIL DRAWER */}
      <Drawer title={null} open={detailOpen} onClose={closeDetail} width={1040} closable={false}
        styles={{ body: { padding: 0 }, header: { display: 'none' }, mask: { backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.45)' } }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white)' }}>
          <div className="pvr-drawer-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <div className="pvr-drawer-chip"><CalendarOutlined /></div>
              <div style={{ minWidth: 0 }}>
                <div className="pvr-drawer-title">{detail?.periodLabel || 'Pay Run'} {detail && <Tag color={STATUS_META[detail.status].color} style={{ marginLeft: 8 }}>{STATUS_META[detail.status].label}</Tag>}</div>
                <div className="pvr-drawer-sub">{detail ? `${detail.payGroupName} · ${detail.totalDays} days` : ''}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {detail && isDraft && canProcessPayrollRun && (
                <Tooltip title="Pull approved unpaid-leave days from Leaves for this month">
                  <Button icon={<SyncOutlined spin={syncing} />} loading={syncing} onClick={syncLop}>Sync LOP</Button>
                </Tooltip>
              )}
              {detail && isDraft && canProcessPayrollRun && (
                <Button type="primary" icon={<SendOutlined />} loading={submitting} onClick={submit}>Submit for Approval</Button>
              )}
              {detail && isPending && canApprove && (
                <>
                  <Button danger icon={<CloseCircleOutlined />} onClick={() => { setActionMode('reject'); setRemarks(''); }}>Reject</Button>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => { setActionMode('approve'); setRemarks(''); }}>
                    {detail.currentStep >= detail.totalSteps ? 'Approve & Finish' : `Approve Step ${detail.currentStep}`}
                  </Button>
                </>
              )}
              {detail && isApproved && canFinalizePayrollRun && (
                <ConfirmDialog tone="primary" icon={<LockOutlined />} title="Finalize & lock this run?" description="Finalized runs are immutable — no further edits, LOP changes, or deletion." confirmText="Finalize" placement="bottomRight" onConfirm={finalize}>
                  <Button type="primary" icon={<LockOutlined />} loading={processing}>Finalize &amp; Lock</Button>
                </ConfirmDialog>
              )}
              {detail && isLocked && canGeneratePayrollPayslips && (
                <Button icon={<FilePdfOutlined />} loading={genPayslips} onClick={generate}>
                  {payslips.size > 0 ? 'Regenerate Payslips' : 'Generate Payslips'}
                </Button>
              )}
              {detail && isLocked && canPayPayrollRun && (
                <Button icon={<BankOutlined />} loading={genBank} onClick={generateBank}>
                  {bankFile ? 'Regenerate Bank File' : 'Generate Bank File'}
                </Button>
              )}
              {detail && isLocked && bankFile && (
                <Tooltip title={`${bankFile.employeeCount} payees · ${money(bankFile.totalAmount)} · ${bankFile.format}`}>
                  <Button type="link" icon={<DownloadOutlined />} href={bankFile.fileUrl} target="_blank">Bank File</Button>
                </Tooltip>
              )}
              {detail && isFinalized && canPayPayrollRun && (
                <ConfirmDialog tone="success" icon={<BankOutlined />} title="Mark this run as paid?" description="Confirms salaries have been disbursed for this period." confirmText="Mark Paid" placement="bottomRight" onConfirm={markPaid}>
                  <Button type="primary" icon={<BankOutlined />} loading={processing}>Mark as Paid</Button>
                </ConfirmDialog>
              )}
              {detail && isDraft && canDeletePayrollRun && (
                <ConfirmDialog tone="danger" icon={<DeleteOutlined />} title="Delete this draft run?" description="All computed items will be removed." confirmText="Delete" placement="bottomRight" onConfirm={() => removeRun(detail)}>
                  <Button danger type="text" icon={<DeleteOutlined />} />
                </ConfirmDialog>
              )}
              <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={closeDetail} />
            </div>
          </div>

          <div className="pvr-drawer-body">
            {detailLoading || !detail ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spin /></div>
            ) : (
              <>
                <div className="pvr-summary">
                  <div className="pvr-sum"><span><TeamOutlined /> Employees</span><strong>{detail.employeeCount}</strong></div>
                  <div className="pvr-sum"><span><DollarOutlined /> Gross</span><strong>{money(detail.totalGross)}</strong></div>
                  <div className="pvr-sum"><span>Deductions</span><strong style={{ color: PALETTE.red }}>−{money(detail.totalDeductions)}</strong></div>
                  <div className="pvr-sum pvr-sum--net"><span>Net Payout</span><strong>{money(detail.totalNet)}</strong></div>
                  {isDraft && <div className="pvr-hint-inline">Edit LOP days inline — totals recompute automatically.</div>}
                  {isLocked && <div className="pvr-locked"><LockOutlined /> {detail.status === 'paid' ? 'Paid' : 'Finalized'} — register locked</div>}
                </div>

                {payslipJob && (
                  <div className="pvr-genbar">
                    <div className="pvr-genbar-top">
                      <span className="pvr-genbar-title">
                        <FilePdfOutlined /> Payslip generation
                        {payslipJob.status === 'running' || payslipJob.status === 'queued'
                          ? <Tag color="processing">In progress</Tag>
                          : payslipJob.status === 'completed' ? <Tag color="green">Completed</Tag>
                          : payslipJob.status === 'completed_with_errors' ? <Tag color="orange">Completed with errors</Tag>
                          : <Tag color="red">Failed</Tag>}
                      </span>
                      <span className="pvr-genbar-count">{payslipJob.succeeded} / {payslipJob.total} generated{payslipJob.failed > 0 ? ` · ${payslipJob.failed} failed` : ''}</span>
                    </div>
                    <div className="pvr-genbar-track">
                      <div className="pvr-genbar-fill" style={{ width: `${payslipJob.total ? Math.round((payslipJob.succeeded / payslipJob.total) * 100) : 0}%` }} />
                    </div>
                    {(payslipJob.status === 'running' || payslipJob.status === 'queued') && (
                      <div className="pvr-genbar-hint"><SyncOutlined spin /> Generating in the background — you can keep working; progress updates live.</div>
                    )}
                    {payslipJob.status !== 'running' && payslipJob.status !== 'queued' && payslipJob.succeeded < payslipJob.total && (
                      <div className="pvr-genbar-actions">
                        <span className="pvr-genbar-pending">{payslipJob.total - payslipJob.succeeded} pending</span>
                        {canGeneratePayrollPayslips && <Button size="small" type="primary" icon={<SyncOutlined />} onClick={completePending}>Complete pending</Button>}
                      </div>
                    )}
                  </div>
                )}

                {isLocked && bankFile && (
                  <div className="pvr-bankfile">
                    <div className="pvr-bf-head">
                      <div className="pvr-bf-chip"><BankOutlined /></div>
                      <div className="pvr-bf-htext">
                        <div className="pvr-bf-title">Bank File</div>
                        <div className="pvr-bf-sub">{bankFile.periodLabel} · {BANK_FMT_LABEL[bankFile.format] ?? bankFile.format} · {bankFile.paymentMode.toUpperCase()}</div>
                      </div>
                      <Button type="primary" ghost size="small" icon={<DownloadOutlined />} href={bankFile.fileUrl} target="_blank" style={{ borderRadius: 8, fontWeight: 600 }}>Download CSV</Button>
                    </div>
                    <div className="pvr-bf-cells">
                      <div className="pvr-bf-cell"><span>Payees</span><strong>{bankFile.employeeCount}</strong></div>
                      <div className="pvr-bf-cell"><span>Total Amount</span><strong>{money(bankFile.totalAmount)}</strong></div>
                      <div className="pvr-bf-cell"><span>Payment Mode</span><strong>{bankFile.paymentMode.toUpperCase()}</strong></div>
                      <div className="pvr-bf-cell"><span>Format</span><strong>{BANK_FMT_LABEL[bankFile.format] ?? bankFile.format}</strong></div>
                      <div className="pvr-bf-cell"><span>Skipped</span><strong style={{ color: bankFile.skippedCount > 0 ? PALETTE.amber : undefined }}>{bankFile.skippedCount > 0 ? `${bankFile.skippedCount} (no account)` : 'None'}</strong></div>
                      <div className="pvr-bf-cell"><span>Generated</span><strong>{bankFile.generatedAt.slice(0, 10)}</strong></div>
                    </div>
                  </div>
                )}

                {(detail.approvals.length > 0 || detail.status !== 'draft') && (
                  <div className="pvr-approval">
                    <div className="pvr-ap-head">
                      <span className="pvr-ap-title"><BranchesOutlined /> {detail.workflowName || 'Approval'}</span>
                      {isPending && <Tag color="gold">Step {detail.currentStep} of {detail.totalSteps}</Tag>}
                      {detail.status === 'approved' && <Tag color="green">Approved</Tag>}
                    </div>
                    <div className="pvr-ap-log">
                      {detail.approvals.map((a: PayRunApproval) => (
                        <div key={a.id} className="pvr-ap-item">
                          <span className="pvr-ap-dot" style={{ background: a.action === 'rejected' ? PALETTE.red : a.action === 'finalized' ? PALETTE.violet : a.action === 'paid' ? PALETTE.green : a.action === 'approved' ? PALETTE.green : PALETTE.blue }} />
                          <span className="pvr-ap-action">{({ submitted: 'Submitted', approved: 'Approved', rejected: 'Rejected', finalized: 'Finalized', paid: 'Paid' } as const)[a.action]}{a.stepNumber > 0 && a.action === 'approved' ? ` · step ${a.stepNumber}` : ''}</span>
                          <span className="pvr-ap-by">{a.performedBy ? empName(a.performedBy) : ''}</span>
                          {a.remarks && <span className="pvr-ap-remarks">“{a.remarks}”</span>}
                          <span className="pvr-ap-time">{a.createdAt.slice(0, 10)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Table
                  rowKey="id" size="small" className="pvr-items" columns={itemColumns} dataSource={detail.items} pagination={false}
                  expandable={{
                    expandedRowRender: (it) => (
                      <div className="pvr-breakdown">
                        {it.components.map((c: PayRunLine) => (
                          <div key={c.componentId} className="pvr-bd-row">
                            <span className="pvr-bd-dot" style={{ background: CAT_COLOR[c.category] }} />
                            <span className="pvr-bd-name">{c.name}</span>
                            {c.isProRata && c.amount !== c.fullAmount && <span className="pvr-bd-full">{money(c.fullAmount)} full</span>}
                            <span className="pvr-bd-amt" style={{ color: c.category === 'deduction' ? PALETTE.red : 'var(--text-slate-900)' }}>{c.category === 'deduction' ? '−' : ''}{money(c.amount)}</span>
                          </div>
                        ))}
                        {it.lopDeduction > 0 && <div className="pvr-bd-lop">LOP deduction: −{money(it.lopDeduction)} ({it.lopDays} day{it.lopDays === 1 ? '' : 's'})</div>}
                      </div>
                    ),
                  }}
                />
              </>
            )}
          </div>
        </div>
      </Drawer>

      <style jsx global>{`
        .pvr { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .pvr-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200); }
        .pvr-header-about { display: flex; align-items: center; gap: 12px; }
        .pvr-header-icon { width: 38px; height: 38px; border-radius: 10px; background: ${TINT.green}; color: ${PALETTE.green}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .pvr-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .pvr-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .pvr-header-actions { display: flex; align-items: center; gap: 8px; }
        .pvr-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }
        .pvr-add-btn { height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; }
        .pvr-label { font-size: 12px; font-weight: 600; color: var(--text-slate-700); margin-bottom: 5px; }
        .pvr-cal { width: 28px; height: 28px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }

        /* New Pay Run modal */
        .pvr-modal { display: flex; flex-direction: column; background: var(--bg-pure-white); }
        .pvr-modal-head { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid var(--border-slate-100); }
        .pvr-modal-chip { width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0; background: ${TINT.green}; color: ${PALETTE.green}; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .pvr-modal-htext { flex: 1; min-width: 0; }
        .pvr-modal-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.2; }
        .pvr-modal-sub { font-size: 12px; color: var(--text-slate-500); margin-top: 2px; }
        .pvr-modal-x { color: var(--text-slate-400); flex-shrink: 0; }
        .pvr-modal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
        .pvr-note { display: flex; gap: 9px; align-items: flex-start; padding: 10px 12px; border-radius: 10px; background: ${TINT.green}; border: 1px solid rgba(16,185,129,0.22); font-size: 12px; color: var(--text-slate-600); line-height: 1.45; }
        .pvr-note .anticon { color: ${PALETTE.green}; font-size: 14px; margin-top: 1px; flex-shrink: 0; }
        .pvr-note strong { color: var(--text-slate-800); font-weight: 700; }
        .pvr-note--danger { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.22); }
        .pvr-note--danger .anticon { color: ${PALETTE.red}; }
        .pvr-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .pvr-mfield { display: flex; flex-direction: column; gap: 6px; }
        .pvr-mlabel { font-size: 12.5px; font-weight: 600; color: var(--text-slate-700); }
        .pvr-mlabel .opt { font-weight: 500; color: var(--text-slate-400); }
        .pvr-modal-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--border-slate-100); background: var(--bg-slate-50); }
        .pvr-modal .ant-select-selector, .pvr-modal .ant-input, .pvr-modal textarea.ant-input { border-radius: 8px !important; }

        .pvr-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; overflow: hidden; }
        .pvr-table .ant-table, .pvr-items .ant-table { background: transparent; font-size: 12px; }
        .pvr-table .ant-table-thead > tr > th, .pvr-items .ant-table-thead > tr > th { background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important; font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important; white-space: nowrap !important; }
        .pvr-table .ant-table-tbody > tr > td, .pvr-items .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 8px 12px !important; }
        .pvr-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }

        .pvr-drawer-head { padding: 16px 18px 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10; background: var(--bg-pure-white); }
        .pvr-drawer-chip { width: 40px; height: 40px; border-radius: 10px; background: ${TINT.green}; color: ${PALETTE.green}; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .pvr-drawer-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); line-height: 1.2; display: flex; align-items: center; }
        .pvr-drawer-sub { font-size: 12px; color: var(--text-slate-500); font-weight: 500; }
        .pvr-drawer-body { padding: 16px 18px; flex: 1; overflow-y: auto; background: var(--bg-secondary, #f8fafc); }

        .pvr-summary { display: flex; align-items: center; gap: 26px; flex-wrap: wrap; padding: 14px 18px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; margin-bottom: 14px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .pvr-sum { display: flex; flex-direction: column; gap: 2px; }
        .pvr-sum span { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-slate-400); display: inline-flex; align-items: center; gap: 5px; }
        .pvr-sum strong { font-size: 17px; font-weight: 800; color: var(--text-slate-900); }
        .pvr-sum--net strong { color: ${PALETTE.green}; }
        .pvr-hint-inline { margin-left: auto; font-size: 11.5px; color: var(--text-slate-400); }
        .pvr-locked { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--text-slate-600); background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); border-radius: 6px; padding: 4px 10px; }

        .pvr-genbar { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; padding: 14px 18px; margin-bottom: 14px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .pvr-genbar-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
        .pvr-genbar-title { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text-slate-900); }
        .pvr-genbar-title .anticon { color: var(--text-slate-400); }
        .pvr-genbar-count { font-size: 12.5px; font-weight: 600; color: var(--text-slate-600); }
        .pvr-genbar-track { height: 8px; border-radius: 999px; background: var(--bg-slate-100); overflow: hidden; }
        .pvr-genbar-fill { height: 100%; border-radius: 999px; background: ${PALETTE.green}; transition: width .4s ease; }
        .pvr-genbar-hint { margin-top: 9px; font-size: 11.5px; color: var(--text-slate-500); display: inline-flex; align-items: center; gap: 6px; }
        .pvr-genbar-actions { margin-top: 11px; display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
        .pvr-genbar-pending { font-size: 12px; font-weight: 600; color: ${PALETTE.amber}; }

        .pvr-bankfile { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; padding: 14px 18px; margin-bottom: 14px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .pvr-bf-head { display: flex; align-items: center; gap: 11px; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid var(--border-slate-100); }
        .pvr-bf-chip { width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; background: ${TINT.blue}; color: ${PALETTE.blue}; display: flex; align-items: center; justify-content: center; font-size: 15px; }
        .pvr-bf-htext { flex: 1; min-width: 0; }
        .pvr-bf-title { font-size: 14px; font-weight: 700; color: var(--text-slate-900); }
        .pvr-bf-sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 1px; }
        .pvr-bf-cells { display: flex; gap: 28px; flex-wrap: wrap; }
        .pvr-bf-cell { display: flex; flex-direction: column; gap: 2px; }
        .pvr-bf-cell span { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-slate-400); }
        .pvr-bf-cell strong { font-size: 15px; font-weight: 800; color: var(--text-slate-900); }

        .pvr-approval { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; padding: 14px 18px; margin-bottom: 14px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .pvr-ap-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .pvr-ap-title { font-size: 13px; font-weight: 700; color: var(--text-slate-900); display: inline-flex; align-items: center; gap: 7px; }
        .pvr-ap-title .anticon { color: var(--text-slate-400); }
        .pvr-ap-log { display: flex; flex-direction: column; gap: 7px; }
        .pvr-ap-item { display: flex; align-items: center; gap: 9px; font-size: 12.5px; }
        .pvr-ap-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .pvr-ap-action { font-weight: 700; color: var(--text-slate-800); }
        .pvr-ap-by { color: var(--text-slate-600); }
        .pvr-ap-remarks { color: var(--text-slate-500); font-style: italic; }
        .pvr-ap-time { margin-left: auto; font-size: 11px; color: var(--text-slate-400); }
        .pvr-items { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; overflow: hidden; }
        .pvr-breakdown { padding: 6px 10px 6px 30px; background: var(--bg-slate-50); }
        .pvr-bd-row { display: grid; grid-template-columns: 12px 1fr auto auto; gap: 10px; align-items: center; padding: 5px 0; }
        .pvr-bd-dot { width: 8px; height: 8px; border-radius: 2px; }
        .pvr-bd-name { font-size: 12.5px; font-weight: 600; color: var(--text-slate-800); }
        .pvr-bd-full { font-size: 10.5px; color: var(--text-slate-400); }
        .pvr-bd-amt { font-size: 12.5px; font-weight: 700; min-width: 84px; text-align: right; }
        .pvr-bd-lop { margin-top: 4px; font-size: 11.5px; font-weight: 600; color: ${PALETTE.amber}; }
      `}</style>
    </div>
  );
}
