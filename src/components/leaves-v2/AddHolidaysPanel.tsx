'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Table, Tag, Drawer, Form, Input, Switch, Select, DatePicker, message, Tooltip, Row, Col, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  CalendarOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  BankOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  FilterOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { Menu } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import LeaveV2Service, { Holiday, HolidayInput, HolidayType, HolidayRule } from '@/services/leaveV2Service';

const { RangePicker } = DatePicker;
const PALETTE = { blue: '#3B82F6', green: '#10B981', red: '#EF4444', grey: '#94A3B8' } as const;
const TINT = { blue: 'rgba(59,130,246,0.10)', green: 'rgba(16,185,129,0.10)', red: 'rgba(239,68,68,0.10)', grey: 'rgba(148,163,184,0.12)' } as const;
const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];
import { drawerFormStyles as formStyles, SectionCard } from "@/components/common/DrawerSection";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

const TYPE_OPTIONS: { value: HolidayType; label: string }[] = [
  { value: 'National', label: 'National' },
  { value: 'State', label: 'State' },
  { value: 'Local', label: 'Local (district)' },
  { value: 'Restricted', label: 'Restricted' },
];
const COUNTRY_OPTIONS = [
  { value: 'IN', label: 'India (IN)' },
  { value: 'US', label: 'United States (US)' },
  { value: 'AE', label: 'United Arab Emirates (AE)' },
  { value: 'GB', label: 'United Kingdom (GB)' },
  { value: 'SG', label: 'Singapore (SG)' },
];
const RULE_OPTIONS: { value: HolidayRule; label: string }[] = [
  { value: 'Fixed', label: 'Fixed' },
  { value: 'Variable', label: 'Variable' },
];

// Indian states / UTs (code → name).
const INDIAN_STATES: { code: string; name: string }[] = [
  { code: 'AN', name: 'Andaman & Nicobar' }, { code: 'AP', name: 'Andhra Pradesh' }, { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' }, { code: 'BR', name: 'Bihar' }, { code: 'CH', name: 'Chandigarh' }, { code: 'CT', name: 'Chhattisgarh' },
  { code: 'DH', name: 'Dadra & Nagar Haveli' }, { code: 'DL', name: 'Delhi' }, { code: 'GA', name: 'Goa' }, { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' }, { code: 'HP', name: 'Himachal Pradesh' }, { code: 'JK', name: 'Jammu & Kashmir' }, { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' }, { code: 'KL', name: 'Kerala' }, { code: 'LA', name: 'Ladakh' }, { code: 'LD', name: 'Lakshadweep' },
  { code: 'MP', name: 'Madhya Pradesh' }, { code: 'MH', name: 'Maharashtra' }, { code: 'MN', name: 'Manipur' }, { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' }, { code: 'NL', name: 'Nagaland' }, { code: 'OR', name: 'Odisha' }, { code: 'PY', name: 'Puducherry' },
  { code: 'PB', name: 'Punjab' }, { code: 'RJ', name: 'Rajasthan' }, { code: 'SK', name: 'Sikkim' }, { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TG', name: 'Telangana' }, { code: 'TR', name: 'Tripura' }, { code: 'UP', name: 'Uttar Pradesh' }, { code: 'UT', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
];
const stateName = (code: string) => INDIAN_STATES.find((s) => s.code === code)?.name ?? code;

type TypeFilter = 'all' | HolidayType;

export default function AddHolidaysPanel() {
  const { canReadLeaveHoliday, canCreateLeaveHoliday, canUpdateLeaveHoliday, canDeleteLeaveHoliday } = usePermission();
  console.log("Forcing HMR reload for AddHolidaysPanel");

  const [rows, setRows] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [yearFilter, setYearFilter] = useState<number>(dayjs().year());
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  // drawer
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('IN');
  const [type, setType] = useState<HolidayType>('National');
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [rule, setRule] = useState<HolidayRule>('Fixed');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async (year: number) => {
    setLoading(true);
    try {
      setRows(await LeaveV2Service.listHolidays({ year, includeInactive: true }));
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canReadLeaveHoliday) load(yearFilter);
  }, [canReadLeaveHoliday, yearFilter, load]);

  const years = useMemo(() => {
    const cur = dayjs().year();
    const set = new Set<number>([cur - 1, cur, cur + 1]);
    rows.forEach((r) => set.add(dayjs(r.fromDate).year()));
    return Array.from(set).sort((a, b) => b - a);
  }, [rows]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: rows.length,
    national: rows.filter((r) => r.type === 'National' || r.type === 'ALL').length,
    state: rows.filter((r) => r.type === 'State').length,
    active: rows.filter((r) => r.isActive).length,
  }), [rows]);

  const statCells = [
    { key: 'total', title: 'Holidays', value: stats.total, period: `in ${yearFilter}`, icon: <CalendarOutlined />, color: PALETTE.blue, tint: TINT.blue },
    { key: 'nat', title: 'National', value: stats.national, period: 'all India', icon: <GlobalOutlined />, color: PALETTE.green, tint: TINT.green },
    { key: 'state', title: 'State', value: stats.state, period: 'regional', icon: <EnvironmentOutlined />, color: PALETTE.red, tint: TINT.red },
    { key: 'active', title: 'Active', value: stats.active, period: `of ${stats.total}`, icon: <BankOutlined />, color: PALETTE.grey, tint: TINT.grey },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (typeFilter !== 'all' && r.type !== typeFilter && !(typeFilter === 'National' && r.type === 'ALL')) return false;
      return true;
    });
  }, [rows, search, typeFilter]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(total, tablePage * tablePageSize);
  const paged = filtered.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);
  useEffect(() => { setTablePage(1); }, [search, typeFilter, yearFilter, tablePageSize]);
  useEffect(() => { if (tablePage > pageCount) setTablePage(pageCount); }, [pageCount, tablePage]);
  const hasFilters = !!search || typeFilter !== 'all';

  // ── Drawer ──────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null); setName(''); setCountry('IN'); setType('National'); setStates([]); setDistricts([]); setRange(null); setRule('Fixed'); setIsActive(true);
    setOpen(true);
  };
  const openEdit = (h: Holiday) => {
    setEditing(h); setName(h.name); setCountry(h.country || 'IN');
    const t = h.type === 'ALL' ? 'National' : h.type;
    setType(t);
    setStates(t === 'State' || t === 'Local' ? h.states : []);
    setDistricts(t === 'Local' ? h.districts : []);
    setRange([dayjs(h.fromDate), dayjs(h.toDate)]);
    setRule(h.rule); setIsActive(h.isActive);
    setOpen(true);
  };

  const submit = async () => {
    if (!name.trim()) return message.error('Holiday name is required');
    if (!range?.[0] || !range?.[1]) return message.error('Pick the holiday date(s)');
    if ((type === 'State' || type === 'Local') && states.length === 0) return message.error('Pick at least one state');
    if (type === 'Local' && districts.length === 0) return message.error('Add at least one district');
    setSaving(true);
    try {
      const payload: HolidayInput = {
        name: name.trim(),
        country,
        type,
        states: type === 'State' || type === 'Local' ? states : [],
        districts: type === 'Local' ? districts : [],
        fromDate: range[0].format('YYYY-MM-DD'),
        toDate: range[1].format('YYYY-MM-DD'),
        rule,
        isActive,
      };
      if (editing) { await LeaveV2Service.updateHoliday(editing.id, payload); message.success('Holiday updated'); }
      else { await LeaveV2Service.createHoliday(payload); message.success('Holiday added'); }
      setOpen(false);
      await load(yearFilter);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to save holiday');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (h: Holiday) => {
    try { await LeaveV2Service.deleteHoliday(h.id); message.success('Holiday deleted'); await load(yearFilter); }
    catch (err: any) { message.error(err?.response?.data?.error || 'Failed to delete'); }
  };

  const fmt = (d: string) => dayjs(d).format('ddd, MMM D, YYYY');

  const columns: ColumnsType<Holiday> = [
    {
      title: 'Holiday',
      key: 'name',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: r.isActive ? PALETTE.blue : PALETTE.grey, display: 'inline-block' }} />
          <span style={{ fontWeight: 600 }}>{r.name}</span>
        </div>
      ),
    },
    {
      title: 'Date',
      key: 'date',
      render: (_, r) => (
        <span style={{ color: 'var(--text-slate-600)' }}>
          {fmt(r.fromDate)}{r.toDate !== r.fromDate ? ` → ${dayjs(r.toDate).format('MMM D')}` : ''}
        </span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (v: HolidayType) => <Tag color={v === 'State' ? 'orange' : v === 'Restricted' ? 'default' : 'green'}>{v === 'ALL' ? 'National' : v}</Tag>,
    },
    {
      title: 'Coverage',
      key: 'coverage',
      render: (_, r) => {
        if (r.type === 'Local') {
          return (
            <Tooltip title={`${r.districts.join(', ')} · ${r.states.map(stateName).join(', ')}`}>
              <span style={{ color: 'var(--text-slate-600)' }}>{r.districts.length} district{r.districts.length === 1 ? '' : 's'}</span>
            </Tooltip>
          );
        }
        if (r.type === 'State') {
          return (
            <Tooltip title={r.states.map(stateName).join(', ')}>
              <span style={{ color: 'var(--text-slate-600)' }}>{r.states.length} state{r.states.length === 1 ? '' : 's'}</span>
            </Tooltip>
          );
        }
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: PALETTE.green }}><GlobalOutlined /> All India</span>;
      },
    },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (v) => (v ? <Tag color="blue">Active</Tag> : <Tag>Inactive</Tag>) },
    {
      title: '',
      key: 'actions',
      width: 90,
      align: 'right',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {canUpdateLeaveHoliday && <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} /></Tooltip>}
          {canDeleteLeaveHoliday && (
            <ConfirmDialog tone="danger" icon={<DeleteOutlined />} title="Delete this holiday?" description={`"${r.name}" will be removed from the calendar.`} confirmText="Delete" placement="bottomRight" onConfirm={() => remove(r)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  if (!canReadLeaveHoliday) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view holidays.</div>;
  }

  return (
    <div className="lvh">
      <div className="lvh-header">
        <div className="lvh-header-about">
          <button
            type="button"
            className="lv-mobile-menu-btn"
            onClick={() => window.dispatchEvent(new Event('open-lv-sidebar'))}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <div className="lvh-header-icon"><CalendarOutlined /></div>
          <div>
            <div className="lvh-header-title">Government Holidays</div>
            <div className="lvh-header-sub">Define official holidays for the organisation calendar</div>
          </div>
        </div>
        <div className="lvh-header-actions">
          <div className="lvh-search-wrap">
            <SearchOutlined className="lvh-search-icon" />
            <input className="lvh-search" placeholder="Search holiday…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Tooltip title="Refresh"><button type="button" className="lvh-ghost-btn" onClick={() => load(yearFilter)}><ReloadOutlined spin={loading} /></button></Tooltip>
          {canCreateLeaveHoliday && <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className="lvh-add-btn">Add Holiday</Button>}
        </div>
      </div>

      <div className="lvh-stats">
        {statCells.map((s) => (
          <div key={s.key} className="lvh-stat-card">
            <div className="lvh-stat-top">
              <span className="lvh-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
              <span className="lvh-stat-label">{s.title}</span>
            </div>
            <div className="lvh-stat-bottom">
              <span className="lvh-stat-value">{s.value}</span>
              <span className="lvh-stat-period">{s.period}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="lvh-filters">
        <span className="lvh-filter-label"><FilterOutlined /> Filter</span>
        <SearchableDropdown className="lvh-filter-dd" placeholder="Year" itemNoun="years" allowClear={false} value={String(yearFilter)} onChange={(v) => setYearFilter(Number(v))} options={years.map((y) => ({ value: String(y), label: String(y) }))} style={{ width: 120 }} width={140} />
        <SearchableDropdown className="lvh-filter-dd" placeholder="Type" itemNoun="types" value={typeFilter === 'all' ? undefined : typeFilter} onChange={(v) => setTypeFilter((v as TypeFilter) ?? 'all')} options={TYPE_OPTIONS} style={{ width: 150 }} width={200} />
        <span className="lvh-filter-count">{filtered.length} of {rows.length}</span>
        {hasFilters && <button type="button" className="lvh-clear" onClick={() => { setSearch(''); setTypeFilter('all'); }}><CloseCircleOutlined /> Clear</button>}
      </div>

      <div className="lvh-table-wrap">
        <ZukvoLoadingOverlay loading={loading} message="">
          <Table rowKey="id" size="small" className="lvh-table" columns={columns} dataSource={paged} pagination={false} scroll={{ x: 'max-content' }} onRow={() => ({ className: 'lvh-row' })} />
        </ZukvoLoadingOverlay>
      </div>

      {total > 0 && (
        <div className="lvh-footer lvh-footer--sticky">
          <div className="lvh-footer-info">Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong></div>
          <div className="lvh-pager">
            <button type="button" className="lvh-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5).map((p) => (
              <button key={p} type="button" className={`lvh-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
            ))}
            <button type="button" className="lvh-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
            <SearchableDropdown className="lvh-pagesize" placeholder="" allowClear={false} value={String(tablePageSize)} onChange={(v) => { setTablePageSize(Number(v)); setTablePage(1); }} options={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n} / page` }))} style={{ width: 110, height: 28 }} width={130} />
          </div>
        </div>
      )}

      {/* DRAWER */}
      <Drawer
        rootClassName="leave-drawer-root"
        title={null}
        open={open}
        onClose={() => setOpen(false)}
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
            <Button onClick={() => setOpen(false)} style={{ borderRadius: 8, height: 36 }}>Cancel</Button>
            <Button
              type="primary"
              loading={saving}
              onClick={submit}
              style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
            >
              {editing ? 'Save Changes' : 'Add Holiday'}
            </Button>
          </div>
        }
      >
        <style>{formStyles}</style>
        {/* HEADER */}
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
                background: editing ? TINT.green : TINT.blue,
                color: editing ? PALETTE.green : PALETTE.blue,
                border: '1px solid var(--border-blue-200)',
              }}
            >
              {editing ? <EditOutlined style={{ fontSize: 18 }} /> : <PlusOutlined style={{ fontSize: 18 }} />}
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {editing ? 'Edit Holiday' : 'Add Holiday'}
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Official holiday for the calendar
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
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
          <div className="px-6 py-6 space-y-5 pb-24 lvh-drawer-form">
            <SectionCard
              icon={<InfoCircleOutlined />}
              title="Holiday Details"
              subtitle="Name, date and coverage"
              step="STEP 1"
            >
              <Form.Item label="Holiday name" style={{ marginBottom: 0 }}>
                <Input size="large" style={{ borderRadius: 8, borderColor: 'var(--border-color)' }} value={name} maxLength={160} placeholder="e.g. Republic Day" onChange={(e) => setName(e.target.value)} />
              </Form.Item>
              <Form.Item label="Date(s)" style={{ marginBottom: 0 }}>
                <RangePicker style={{ width: '100%', borderRadius: 8, borderColor: 'var(--border-color)' }} value={range as any} onChange={(v) => setRange(v as any)} format="MMM D, YYYY" allowClear />
              </Form.Item>
              <Form.Item label="Country" style={{ marginBottom: 0 }}>
                <SearchableDropdown placeholder="Country" itemNoun="countries" allowClear={false} value={country} onChange={(v) => setCountry(v as string)} options={COUNTRY_OPTIONS} style={{ width: '100%', height: 38 }} width={220} />
              </Form.Item>
              <Form.Item label="Type" style={{ marginBottom: 0 }}>
                <SearchableDropdown placeholder="Type" itemNoun="types" allowClear={false} value={type} onChange={(v) => setType(v as HolidayType)} options={TYPE_OPTIONS} style={{ width: '100%', height: 38 }} width={200} />
              </Form.Item>
              <Form.Item label="Recurrence" style={{ marginBottom: 0 }}>
                <SearchableDropdown placeholder="Rule" itemNoun="rules" allowClear={false} value={rule} onChange={(v) => setRule(v as HolidayRule)} options={RULE_OPTIONS} style={{ width: '100%', height: 38 }} width={180} />
              </Form.Item>
              {(type === 'State' || type === 'Local') && (
                <Form.Item label={<span>State{type === 'Local' ? '(s)' : 's'}</span>} style={{ marginBottom: 0 }}>
                  <Select mode="multiple" style={{ width: '100%' }} placeholder="Select states" value={states} onChange={setStates}
                    options={INDIAN_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))}
                    filterOption={(i, o) => (o?.label as string).toLowerCase().includes(i.toLowerCase())} maxTagCount="responsive" />
                </Form.Item>
              )}
              {type === 'Local' && (
                <Form.Item label={<span>Districts <span style={{ color: 'var(--text-slate-400)', fontWeight: 400 }}>(type a name & press enter)</span></span>} style={{ marginBottom: 0 }}>
                  <Select mode="tags" style={{ width: '100%' }} placeholder="Add districts" value={districts} onChange={setDistricts} tokenSeparators={[',']} maxTagCount="responsive" open={false} suffixIcon={null} />
                </Form.Item>
              )}
              <div className="lvh-toggle-row mt-2 border-t border-slate-100 pt-4" style={{ borderColor: 'var(--border-color)' }}>
                <div><div className="lvh-toggle-title">Active</div><div className="lvh-toggle-desc">Counts on the holiday calendar</div></div>
                <Switch checked={isActive} onChange={setIsActive} />
              </div>
            </SectionCard>
          </div>
        </Form>
      </Drawer>

      <style jsx global>{`
        .lvh { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .lvh-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200); flex-wrap: wrap; }
        .lvh-header-about { display: flex; align-items: center; gap: 12px; min-width: 200px; }
        .lvh-header-icon { width: 38px; height: 38px; border-radius: 10px; background: ${TINT.blue}; color: ${PALETTE.blue}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .lvh-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; }
        .lvh-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .lvh-header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .lvh-search-wrap { display: flex; align-items: center; height: 34px; width: 220px; border-radius: 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 0 10px; }
        .lvh-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .lvh-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .lvh-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; }
        .lvh-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; }
        .lvh-ghost-btn:hover { color: ${PALETTE.blue}; border-color: #bfdbfe; }
        .lvh-add-btn { height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; }
        .lvh-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .lvh-stat-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 12px 14px; min-height: 84px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .lvh-stat-top { display: flex; align-items: center; gap: 8px; }
        .lvh-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .lvh-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .lvh-stat-bottom { display: flex; align-items: baseline; gap: 6px; }
        .lvh-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); }
        .lvh-stat-period { font-size: 11px; color: var(--text-slate-400); }
        .lvh-filters { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
        .lvh-filter-label { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--text-slate-600); }
        .lvh-filter-label .anticon { color: var(--text-slate-400); }
        .lvh-filter-count { font-size: 12px; color: var(--text-slate-500); }
        .lvh-clear { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; padding: 3px 6px; font-size: 12px; font-weight: 600; color: ${PALETTE.red}; margin-left: auto; }
        .lvh-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 8px; overflow: hidden; margin-bottom: 16px; }
        .lvh-table, .lvh-table.ant-table-wrapper, .lvh-table .ant-table, .lvh-table .ant-table-container, .lvh-table .ant-table-content, .lvh-table .ant-table-header, .lvh-table .ant-table-body { background: transparent; font-size: 12px; border-radius: 0 !important; }
        .lvh-table .ant-table-thead > tr > th,
        .lvh-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important;
          white-space: nowrap !important; border-radius: 0 !important;
          border-start-start-radius: 0 !important; border-start-end-radius: 0 !important;
        }
        .lvh-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 8px 12px !important; }
        .lvh-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .lvh-table .ant-table-tbody > tr.lvh-row:hover > td { background: var(--bg-slate-50) !important; }
        .lvh-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; height: 52px; padding: 0 4px; box-sizing: border-box; background: transparent; flex-shrink: 0; }
        .lvh-footer--sticky { position: sticky; bottom: 0; z-index: 20; margin: 20px -32px 0; padding: 0 32px; background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200); box-shadow: 0 -4px 14px rgba(15,23,42,0.05); }
        .lvh-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .lvh-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .lvh-pager { display: flex; align-items: center; gap: 3px; }
        .lvh-pager-btn, .lvh-pager-num { min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200); background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600; }
        .lvh-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .lvh-pager-num.is-active { background: ${PALETTE.blue}; border-color: ${PALETTE.blue}; color: #fff; }
        .lvh-pagesize { margin-left: 5px; }
        .lvh-label { font-size: 12px; font-weight: 600; color: var(--text-slate-700); }
        .lvh-drawer-form .ant-input, .lvh-drawer-form .ant-picker, .lvh-drawer-form .ant-select-selector { border-radius: 6px !important; border-color: var(--border-color) !important; }
        .lvh-drawer-form .ant-picker { height: 38px; }
        .lvh-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 0 2px; }
        .lvh-toggle-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); }
        .lvh-toggle-desc { font-size: 11.5px; color: var(--text-slate-400); margin-top: 1px; }

        @media (max-width: 1024px) {
          .lvh-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .lvh-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
