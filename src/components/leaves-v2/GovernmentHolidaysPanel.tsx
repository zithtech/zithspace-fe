'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Table, Tag, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  ReloadOutlined,
  SearchOutlined,
  GlobalOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  AppstoreAddOutlined,
  FilterOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import LeaveV2Service, { CatalogHoliday, HolidayType } from '@/services/leaveV2Service';

const PALETTE = { blue: '#3B82F6', green: '#10B981', red: '#EF4444', grey: '#94A3B8' } as const;
const TINT = { blue: 'rgba(59,130,246,0.10)', green: 'rgba(16,185,129,0.10)', red: 'rgba(239,68,68,0.10)', grey: 'rgba(148,163,184,0.12)' } as const;

const COUNTRY_NAME: Record<string, string> = { IN: 'India', US: 'United States', AE: 'United Arab Emirates', GB: 'United Kingdom', SG: 'Singapore' };
const countryLabel = (c: string) => `${COUNTRY_NAME[c] ?? c} (${c})`;

type TypeFilter = 'all' | HolidayType;
const TYPE_OPTIONS: { value: HolidayType; label: string }[] = [
  { value: 'National', label: 'National' },
  { value: 'State', label: 'State' },
  { value: 'Local', label: 'Local' },
  { value: 'Restricted', label: 'Restricted' },
];

export default function GovernmentHolidaysPanel() {
  const { canReadLeaveHoliday, canCreateLeaveHoliday } = usePermission();

  const [countries, setCountries] = useState<string[]>([]);
  const [country, setCountry] = useState<string>('IN');
  const [catalog, setCatalog] = useState<CatalogHoliday[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<React.Key[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  useEffect(() => {
    if (!canReadLeaveHoliday) return;
    LeaveV2Service.getCatalogCountries().then((cs) => {
      setCountries(cs.length ? cs : ['IN']);
      setCountry((prev) => (cs.includes(prev) ? prev : cs[0] || 'IN'));
    }).catch(() => setCountries(['IN']));
  }, [canReadLeaveHoliday]);

  const load = useCallback(async (c: string) => {
    setLoading(true);
    setSelected([]);
    try {
      setCatalog(await LeaveV2Service.getHolidayCatalog(c));
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canReadLeaveHoliday && country) load(country);
  }, [canReadLeaveHoliday, country, load]);

  const stats = useMemo(() => {
    const added = catalog.filter((c) => c.added).length;
    return { total: catalog.length, added, available: catalog.length - added, selected: selected.length };
  }, [catalog, selected]);

  const statCells = [
    { key: 'total', title: 'In Catalog', value: stats.total, period: countryLabel(country), icon: <CalendarOutlined />, color: PALETTE.blue, tint: TINT.blue },
    { key: 'added', title: 'Already Added', value: stats.added, period: 'in your list', icon: <CheckCircleOutlined />, color: PALETTE.green, tint: TINT.green },
    { key: 'avail', title: 'Available', value: stats.available, period: 'to add', icon: <AppstoreAddOutlined />, color: PALETTE.grey, tint: TINT.grey },
    { key: 'sel', title: 'Selected', value: stats.selected, period: 'to add now', icon: <PlusOutlined />, color: PALETTE.red, tint: TINT.red },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (typeFilter !== 'all' && c.type !== typeFilter && !(typeFilter === 'National' && c.type === 'ALL')) return false;
      return true;
    });
  }, [catalog, search, typeFilter]);

  const addSelected = async () => {
    if (selected.length === 0) return;
    setAdding(true);
    try {
      const res = await LeaveV2Service.addCatalogHolidays(selected as string[]);
      message.success(`Added ${res.added} holiday${res.added === 1 ? '' : 's'}${res.skipped ? ` · ${res.skipped} already in your list` : ''}`);
      await load(country);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to add holidays');
    } finally {
      setAdding(false);
    }
  };

  const fmt = (d: string) => dayjs(d).format('ddd, MMM D, YYYY');

  const columns: ColumnsType<CatalogHoliday> = [
    { title: 'Holiday', dataIndex: 'name', key: 'name', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Date', dataIndex: 'fromDate', key: 'date', render: (v, r) => <span style={{ color: 'var(--text-slate-600)' }}>{fmt(v)}{r.toDate !== r.fromDate ? ` → ${dayjs(r.toDate).format('MMM D')}` : ''}</span> },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (v: HolidayType) => <Tag color={v === 'State' ? 'orange' : v === 'Local' ? 'purple' : v === 'Restricted' ? 'default' : 'green'}>{v === 'ALL' ? 'National' : v}</Tag> },
    {
      title: 'Coverage',
      key: 'coverage',
      render: (_, r) =>
        r.type === 'Local' ? <Tooltip title={r.districts.join(', ')}><span style={{ color: 'var(--text-slate-600)' }}>{r.districts.length} districts</span></Tooltip>
          : r.type === 'State' ? <Tooltip title={r.states.join(', ')}><span style={{ color: 'var(--text-slate-600)' }}>{r.states.length} states</span></Tooltip>
            : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: PALETTE.green }}><GlobalOutlined /> All India</span>,
    },
    { title: 'Status', key: 'status', render: (_, r) => (r.added ? <Tag color="green">In your list</Tag> : <Tag>Not added</Tag>) },
  ];

  if (!canReadLeaveHoliday) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view holidays.</div>;
  }

  return (
    <div className="lvgh">
      <div className="lvgh-header">
        <div className="lvgh-header-about">
          <div className="lvgh-header-icon"><GlobalOutlined /></div>
          <div>
            <div className="lvgh-header-title">Government Holidays</div>
            <div className="lvgh-header-sub">Pick holidays from the catalog and add them to your calendar</div>
          </div>
        </div>
        <div className="lvgh-header-actions">
          <SearchableDropdown placeholder="Country" itemNoun="countries" allowClear={false} value={country} onChange={(v) => setCountry(v as string)} options={countries.map((c) => ({ value: c, label: countryLabel(c) }))} style={{ width: 200, height: 34 }} width={220} />
          <Tooltip title="Refresh"><button type="button" className="lvgh-ghost-btn" onClick={() => load(country)}><ReloadOutlined spin={loading} /></button></Tooltip>
        </div>
      </div>

      <div className="lvgh-stats">
        {statCells.map((s) => (
          <div key={s.key} className="lvgh-stat-card">
            <div className="lvgh-stat-top">
              <span className="lvgh-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
              <span className="lvgh-stat-label">{s.title}</span>
            </div>
            <div className="lvgh-stat-bottom">
              <span className="lvgh-stat-value">{s.value}</span>
              <span className="lvgh-stat-period">{s.period}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="lvgh-bar">
        <div className="lvgh-filters">
          <div className="lvgh-search-wrap">
            <SearchOutlined className="lvgh-search-icon" />
            <input className="lvgh-search" placeholder="Search holiday…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <SearchableDropdown placeholder="Type" itemNoun="types" value={typeFilter === 'all' ? undefined : typeFilter} onChange={(v) => setTypeFilter((v as TypeFilter) ?? 'all')} options={TYPE_OPTIONS} style={{ width: 150 }} width={200} />
          {(search || typeFilter !== 'all') && <button type="button" className="lvgh-clear" onClick={() => { setSearch(''); setTypeFilter('all'); }}><CloseCircleOutlined /> Clear</button>}
        </div>
        {canCreateLeaveHoliday && (
          <Button type="primary" icon={<PlusOutlined />} loading={adding} disabled={selected.length === 0} onClick={addSelected} className="lvgh-add-btn">
            Add {selected.length > 0 ? selected.length : ''} to our holidays
          </Button>
        )}
      </div>

      <div className="lvgh-table-wrap">
        <Table
          rowKey="id"
          size="small"
          className="lvgh-table"
          loading={loading}
          columns={columns}
          dataSource={filtered}
          pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [10, 20, 25, 50, 100] }}
          rowSelection={canCreateLeaveHoliday ? {
            selectedRowKeys: selected,
            onChange: setSelected,
            preserveSelectedRowKeys: true,
            getCheckboxProps: (r) => ({ disabled: r.added }),
          } : undefined}
          onRow={() => ({ className: 'lvgh-row' })}
        />
      </div>

      <style jsx global>{`
        .lvgh { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .lvgh-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200); }
        .lvgh-header-about { display: flex; align-items: center; gap: 12px; }
        .lvgh-header-icon { width: 38px; height: 38px; border-radius: 10px; background: ${TINT.blue}; color: ${PALETTE.blue}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .lvgh-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; }
        .lvgh-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .lvgh-header-actions { display: flex; align-items: center; gap: 8px; }
        .lvgh-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; }
        .lvgh-ghost-btn:hover { color: ${PALETTE.blue}; border-color: #bfdbfe; }
        .lvgh-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .lvgh-stat-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 12px 14px; min-height: 84px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
        .lvgh-stat-top { display: flex; align-items: center; gap: 8px; }
        .lvgh-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .lvgh-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .lvgh-stat-bottom { display: flex; align-items: baseline; gap: 6px; }
        .lvgh-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); }
        .lvgh-stat-period { font-size: 11px; color: var(--text-slate-400); }
        .lvgh-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
        .lvgh-filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .lvgh-search-wrap { display: flex; align-items: center; height: 34px; width: 240px; border-radius: 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 0 10px; }
        .lvgh-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .lvgh-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .lvgh-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; }
        .lvgh-clear { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; padding: 3px 6px; font-size: 12px; font-weight: 600; color: ${PALETTE.red}; }
        .lvgh-add-btn { height: 36px !important; border-radius: 8px !important; font-weight: 600 !important; }
        .lvgh-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); }
        .lvgh-table .ant-table { background: transparent; font-size: 12px; }
        .lvgh-table .ant-table-thead > tr > th { background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important; font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important; white-space: nowrap !important; }
        .lvgh-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 8px 12px !important; }
        .lvgh-table .ant-table-tbody > tr.lvgh-row:hover > td { background: var(--bg-slate-50) !important; }
        .lvgh-table .ant-pagination { margin: 12px 12px 8px !important; }
      `}</style>
    </div>
  );
}
