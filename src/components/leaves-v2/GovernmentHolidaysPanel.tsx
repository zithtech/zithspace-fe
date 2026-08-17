'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Table, Tag, Tooltip, message, Select } from 'antd';
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
  DeleteOutlined,
} from '@ant-design/icons';
import { Menu } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import ConfirmDialog from '@/components/common/ConfirmDialog';
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
  const { canReadLeaveHoliday, canCreateLeaveHoliday, canDeleteLeaveHoliday } = usePermission();
  console.log("Forcing HMR reload for GovernmentHolidaysPanel");

  const [countries, setCountries] = useState<string[]>([]);
  const [country, setCountry] = useState<string>('IN');
  const [catalog, setCatalog] = useState<CatalogHoliday[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [apiStats, setApiStats] = useState({ total: 0, added: 0, available: 0 });
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<React.Key[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    if (!canReadLeaveHoliday) return;
    LeaveV2Service.getCatalogCountries().then((cs) => {
      setCountries(cs.length ? cs : ['IN']);
      setCountry((prev) => (cs.includes(prev) ? prev : cs[0] || 'IN'));
    }).catch(() => setCountries(['IN']));
  }, [canReadLeaveHoliday]);

  const load = useCallback(async (c: string, p = page, size = pageSize, q = search, t = typeFilter) => {
    setLoading(true);
    setSelected([]);
    try {
      const res = await LeaveV2Service.getHolidayCatalog({
        country: c,
        search: q || undefined,
        type: t === 'all' ? undefined : t,
        page: p,
        pageSize: size,
      });
      setCatalog(res.data);
      setTotalCount(res.total);
      setApiStats(res.stats);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, typeFilter]);

  useEffect(() => {
    if (canReadLeaveHoliday && country) load(country);
  }, [canReadLeaveHoliday, country, load]);

  const stats = useMemo(() => {
    return { ...apiStats, selected: selected.length };
  }, [apiStats, selected]);

  const statCells = [
    { key: 'total', title: 'In Catalog', value: stats.total, period: countryLabel(country), icon: <CalendarOutlined />, color: PALETTE.blue, tint: TINT.blue },
    { key: 'added', title: 'Already Added', value: stats.added, period: 'in your list', icon: <CheckCircleOutlined />, color: PALETTE.green, tint: TINT.green },
    { key: 'avail', title: 'Available', value: stats.available, period: 'to add', icon: <AppstoreAddOutlined />, color: PALETTE.grey, tint: TINT.grey },
    { key: 'sel', title: 'Selected', value: stats.selected, period: 'to add now', icon: <PlusOutlined />, color: PALETTE.red, tint: TINT.red },
  ];

  const total = totalCount;
  const pageCount = Math.ceil(total / pageSize) || 1;
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(total, page * pageSize);

  const paginatedData = catalog;

  useEffect(() => { setPage(1); }, [search, typeFilter]);

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

  const removeAdded = async (r: CatalogHoliday) => {
    try {
      const res = await LeaveV2Service.removeCatalogHolidays([r.id]);
      if (res.removed > 0) message.success(`Removed "${r.name}" from your holidays`);
      else message.info('Holiday was not in your list');
      await load(country);
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to remove holiday');
      throw err; // keep the confirm popover open on failure
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
    ...(canDeleteLeaveHoliday ? [{
      title: '',
      key: 'actions',
      width: 48,
      align: 'right' as const,
      render: (_: unknown, r: CatalogHoliday) =>
        r.added ? (
          <ConfirmDialog
            tone="danger"
            icon={<DeleteOutlined />}
            title="Remove from your holidays?"
            description={`"${r.name}" will be removed from your calendar. You can add it again from the catalog anytime.`}
            confirmText="Remove"
            placement="bottomRight"
            onConfirm={() => removeAdded(r)}
          >
            <Tooltip title="Remove from your list">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </ConfirmDialog>
        ) : null,
    }] : []),
  ];

  if (!canReadLeaveHoliday) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.grey }}>You don’t have permission to view holidays.</div>;
  }

  return (
    <div className="lvgh">
      <div className="lvgh-header">
        <div className="lvgh-header-about">
          <button 
            type="button"
            className="lv-mobile-menu-btn" 
            onClick={() => window.dispatchEvent(new Event('open-lv-sidebar'))}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
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
          {(search || typeFilter !== 'all') && <button type="button" className="lvgh-clear" onClick={() => { setSearch(''); setTypeFilter('all'); setPage(1); }}><CloseCircleOutlined /> Clear</button>}
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
          dataSource={paginatedData}
          pagination={false}
          scroll={{ x: 'max-content' }}
          rowSelection={canCreateLeaveHoliday ? {
            selectedRowKeys: selected,
            onChange: setSelected,
            preserveSelectedRowKeys: true,
            getCheckboxProps: (r) => ({ disabled: r.added }),
          } : undefined}
          onRow={() => ({ className: 'lvgh-row' })}
        />
      </div>

      {total > 0 && (
        <div className="lvgh-footer">
          <div className="lvgh-footer-info">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
            {selected.length > 0 && (
              <span className="lvgh-footer-sel"> · {selected.length} selected</span>
            )}
          </div>
          <div className="lvgh-pager">
            <button
              type="button"
              className="lvgh-pager-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
              .map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`lvgh-pager-num ${p === page ? "is-active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            <button
              type="button"
              className="lvgh-pager-btn"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              ›
            </button>
            <Select
              className="lvgh-pagesize"
              value={pageSize}
              onChange={(v) => { setPageSize(v); setPage(1); }}
              options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
              popupMatchSelectWidth={120}
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        .lvgh { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .lvgh-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200); flex-wrap: wrap; }
        .lvgh-header-about { display: flex; align-items: center; gap: 12px; min-width: 200px; }
        .lvgh-header-icon { width: 38px; height: 38px; border-radius: 10px; background: ${TINT.blue}; color: ${PALETTE.blue}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .lvgh-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; }
        .lvgh-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .lvgh-header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
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
        .lvgh-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 8px; overflow: hidden; margin-bottom: 14px; }
        .lvgh-table, .lvgh-table.ant-table-wrapper, .lvgh-table .ant-table, .lvgh-table .ant-table-container, .lvgh-table .ant-table-content, .lvgh-table .ant-table-header, .lvgh-table .ant-table-body { background: transparent; font-size: 12px; border-radius: 0 !important; }
        .lvgh-table .ant-table-thead > tr > th,
        .lvgh-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important;
          white-space: nowrap !important; border-radius: 0 !important;
          border-start-start-radius: 0 !important; border-start-end-radius: 0 !important;
        }
        .lvgh-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 8px 12px !important; }
        .lvgh-table .ant-table-tbody > tr.lvgh-row:hover > td { background: var(--bg-slate-50) !important; }
        .lvgh-table .ant-pagination { display: none; }
        
        .lvgh-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding: 0 4px;
          height: 52px;
          box-sizing: border-box;
          background: transparent;
          flex-shrink: 0;
        }
        .lvgh-footer-info {
          font-size: 12px;
          color: var(--text-slate-500);
        }
        .lvgh-footer-info strong {
          color: var(--text-slate-700);
          font-weight: 700;
        }
        [data-theme='dark'] .lvgh-footer-info strong { color: #cbd5e1; }
        .lvgh-footer-sel { color: #3b82f6; font-weight: 600; }
        .lvgh-pager { display: flex; align-items: center; gap: 3px; }
        .lvgh-pager-btn, .lvgh-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600);
          cursor: pointer; font-size: 12.5px; font-weight: 600;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.12s ease;
        }
        .lvgh-pager-btn:hover:not(:disabled), .lvgh-pager-num:hover:not(.is-active) {
          background: var(--bg-slate-50); border-color: var(--border-slate-300);
        }
        [data-theme='dark'] .lvgh-pager-btn, [data-theme='dark'] .lvgh-pager-num {
          background: #161b22; border-color: #1f2937; color: #94a3b8;
        }
        [data-theme='dark'] .lvgh-pager-btn:hover:not(:disabled),
        [data-theme='dark'] .lvgh-pager-num:hover:not(.is-active) {
          background: #1f2937; border-color: #374151;
        }
        .lvgh-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .lvgh-pager-num.is-active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
        .lvgh-pagesize { margin-left: 5px; }
        .lvgh-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        @media (max-width: 1024px) {
          .lvgh-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .lvgh-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
