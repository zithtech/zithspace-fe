import React, { useEffect, useState } from 'react';
import { Drawer, Button, Form, Input, DatePicker, App } from 'antd';
import { PlusOutlined, EditOutlined, CloseOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import LeaveV2Service, { ApplyLeaveInput, DayPortion, LeaveBalanceItem, LeaveRequest } from '@/services/leaveV2Service';
import { drawerFormStyles as formStyles, SectionCard } from "@/components/common/DrawerSection";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const PALETTE = { blue: '#3B82F6', green: '#10B981', red: '#EF4444', grey: '#94A3B8' } as const;
const TINT = { blue: 'rgba(59,130,246,0.10)', green: 'rgba(16,185,129,0.10)', red: 'rgba(239,68,68,0.10)', grey: 'rgba(148,163,184,0.12)' } as const;

const DAY_PORTION_OPTIONS: { value: DayPortion; label: string }[] = [
  { value: 'full', label: 'Full day' },
  { value: 'first_half', label: 'First half' },
  { value: 'second_half', label: 'Second half' },
];

function computeUnits(from: Dayjs | null, to: Dayjs | null, portion: DayPortion, holidays: Set<string>): number {
  if (!from || !to) return 0;
  const iso = (d: Dayjs) => d.format('YYYY-MM-DD');
  if (portion !== 'full') {
    const dow = from.day();
    if (dow === 0 || dow === 6 || holidays.has(iso(from))) return 0; // working, non-holiday day only
    return 0.5;
  }
  let u = 0;
  let d = from.startOf('day');
  const end = to.startOf('day');
  while (d.isBefore(end) || d.isSame(end, 'day')) {
    const dow = d.day();
    if (dow !== 0 && dow !== 6 && !holidays.has(iso(d))) u += 1;
    d = d.add(1, 'day');
  }
  return u;
}

export interface ApplyLeaveDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingRequest?: LeaveRequest | null;
  balances: LeaveBalanceItem[];
  holidaySet: Set<string>;
}

export default function ApplyLeaveDrawer({
  open,
  onClose,
  onSuccess,
  editingRequest,
  balances,
  holidaySet,
}: ApplyLeaveDrawerProps) {
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState<string>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [portion, setPortion] = useState<DayPortion>('full');
  const [reason, setReason] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize state when drawer opens
  useEffect(() => {
    if (open) {
      if (editingRequest) {
        setLeaveTypeId(editingRequest.leaveTypeId);
        setRange([dayjs(editingRequest.fromDate), dayjs(editingRequest.toDate)]);
        setPortion(editingRequest.dayPortion);
        setReason(editingRequest.reason || '');
      } else {
        setLeaveTypeId(undefined);
        setRange(null);
        setPortion('full');
        setReason('');
      }
      setSubmitError(null);
    }
  }, [open, editingRequest]);

  // A server rejection (e.g. overlap) is stale once the type/dates change.
  useEffect(() => { setSubmitError(null); }, [leaveTypeId, range, portion]);

  const balanceFor = (id?: string) => balances.find((b) => b.leaveTypeId === id);
  const from = range?.[0] ?? null;
  const to = range?.[1] ?? null;
  const isSingleDay = !!from && !!to && from.isSame(to, 'day');
  const effectivePortion: DayPortion = isSingleDay ? portion : 'full';
  const units = computeUnits(from, to, effectivePortion, holidaySet);
  // Total leave span (calendar days, incl. weekends/holidays) — half-day counts as 0.5.
  const calendarSpan = from && to ? to.startOf('day').diff(from.startOf('day'), 'day') + 1 : 0;
  const totalDays = isSingleDay && effectivePortion !== 'full' ? 0.5 : calendarSpan;
  const selectedBalance = balanceFor(leaveTypeId);
  const isUnpaidType = !!selectedBalance && !selectedBalance.isPaid;
  let available = selectedBalance?.available ?? 0;
  if (editingRequest && editingRequest.leaveTypeId === leaveTypeId && !isUnpaidType) {
    available += editingRequest.paidUnits;
  }
  const paid = isUnpaidType ? 0 : Math.min(units, Math.max(available, 0));
  const lop = Number((units - paid).toFixed(2));

  // Why submit is blocked
  const blockReason: string | null = !leaveTypeId
    ? 'Select a leave type'
    : !from || !to
    ? 'Select the leave dates'
    : units <= 0
    ? 'Selected range has only weekends/holidays'
    : null;

  const submit = async () => {
    if (!leaveTypeId) return message.error('Pick a leave type');
    if (!from || !to) return message.error('Pick the leave dates');
    if (units <= 0) return message.error('The selected range has no working days');
    setSaving(true);
    setSubmitError(null);
    try {
      const payload: ApplyLeaveInput = {
        leaveTypeId,
        fromDate: from.format('YYYY-MM-DD'),
        toDate: to.format('YYYY-MM-DD'),
        dayPortion: effectivePortion,
        reason: reason.trim() || null,
      };
      if (editingRequest) {
        await LeaveV2Service.updateRequest(editingRequest.id, payload);
        message.success('Leave request updated');
      } else {
        await LeaveV2Service.applyLeave(payload);
        message.success('Leave request submitted');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error || err?.message || 'Submission failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      rootClassName="leave-drawer-root"
      title={null}
      open={open}
      onClose={onClose}
      width={720}
      closable={false}
      destroyOnClose
      styles={{
        header: { display: 'none' },
        body: { padding: 0, background: 'var(--customers-page-bg)' },
        footer: { padding: 0, border: 'none' },
        wrapper: { boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.08)' },
        mask: { background: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(2px)' },
      }}
      footer={
        <div
          className="customer-drawer-footer px-6 py-3 flex items-center justify-end gap-2 border-t"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
          }}
        >
          <span style={{ fontSize: 11.5, color: (submitError || blockReason) ? PALETTE.red : 'var(--text-slate-400)', marginRight: 'auto' }}>
            {submitError ? submitError : blockReason ? blockReason : lop > 0 ? `${lop} day(s) will be Loss of Pay` : 'Within your balance'}
          </span>
          <Button onClick={onClose} style={{ borderRadius: 8, height: 36 }}>Cancel</Button>
          <Button
            type="primary"
            loading={saving}
            onClick={submit}
            style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
          >
            {editingRequest ? 'Update Request' : 'Submit Request'}
          </Button>
        </div>
      }
    >
      <style>{formStyles}</style>
      <div
        className="customer-drawer-header sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
        style={{
          background: 'color-mix(in oklab, var(--bg-secondary) 92%, transparent)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--bg-blue-50)',
              color: 'var(--text-blue-700)',
              border: '1px solid var(--border-blue-200)',
            }}
          >
            {editingRequest ? <EditOutlined style={{ fontSize: 18 }} /> : <PlusOutlined style={{ fontSize: 18 }} />}
          </div>
          <div className="min-w-0">
            <div
              className="text-[15px] font-semibold leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {editingRequest ? 'Edit Leave' : 'Apply Leave'}
            </div>
            <div
              className="text-[12px] mt-0.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {editingRequest ? 'Update your pending leave request' : 'Request time off against your balance'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <CloseOutlined />
        </button>
      </div>

      <Form
        layout="horizontal"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        labelAlign="left"
        colon={false}
        className="customer-drawer-form"
      >
        <div className="px-6 py-6 space-y-5 pb-24">
          {submitError && (
            <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: TINT.red, border: `1px solid ${PALETTE.red}44`, color: '#991b1b', padding: '10px 12px', borderRadius: 6, fontSize: 12.5, lineHeight: 1.4 }}>
              <WarningOutlined style={{ color: PALETTE.red, marginTop: 1, flexShrink: 0 }} />
              <span>{submitError}</span>
            </div>
          )}
          <SectionCard
            icon={<InfoCircleOutlined />}
            title="Leave Details"
            subtitle="Type, dates and reason"
            step="STEP 1"
          >
              <Form.Item label="Leave type" style={{ marginBottom: 0 }}>
                <SearchableDropdown
                  placeholder="Select leave type"
                  itemNoun="leave types"
                  allowClear={false}
                  value={leaveTypeId}
                  onChange={(v) => setLeaveTypeId(v as string)}
                  options={balances.map((b) => {
                    const exhausted = b.isPaid && b.available <= 0;
                    return {
                      value: b.leaveTypeId,
                      label: b.name,
                      description: b.isPaid
                        ? `${b.available} available${exhausted ? ' · exhausted' : ''}`
                        : 'Unlimited · unpaid (Loss of Pay)',
                      disabled: exhausted,
                    };
                  })}
                  style={{ width: '100%', height: 38 }}
                  width={300}
                />
              </Form.Item>

              <Form.Item label="Duration" style={{ marginBottom: 0 }}>
                <RangePicker
                  value={range as any}
                  onChange={(v) => setRange(v as any)}
                  format="MMM D, YYYY"
                  style={{ width: '100%', height: 38, borderRadius: 8, borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}
                />
              </Form.Item>

              {isSingleDay && (
                <Form.Item label="Portion of day" style={{ marginBottom: 0 }}>
                  <SearchableDropdown
                    placeholder="Full or half day?"
                    itemNoun="options"
                    allowClear={false}
                    value={portion}
                    onChange={(v) => setPortion(v as DayPortion)}
                    options={DAY_PORTION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    style={{ width: '100%', height: 38 }}
                    width={200}
                  />
                </Form.Item>
              )}

              <Form.Item label="Reason" style={{ marginBottom: 0 }}>
                <TextArea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Optional context for your manager…"
                  style={{ borderRadius: 8, borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}
                />
              </Form.Item>
          </SectionCard>

          <SectionCard
            icon={<InfoCircleOutlined />}
            title="Breakdown"
            subtitle="How this impacts your balance"
            step="STEP 2"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>Duration</span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{totalDays} calendar days</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>Working days</span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{units} units</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>Paid leave deducted</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>{paid} units</span>
              </div>
              {lop > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>Loss of Pay</span>
                  <span style={{ fontWeight: 600, color: '#ef4444' }}>{lop} units</span>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </Form>
    </Drawer>
  );
}
