'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Table, Tag, DatePicker, message, Row, Col, Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import {
  LayoutDashboard as DashIcon,
} from 'lucide-react';
import { DollarOutlined, FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import ReimbursementV2Service, {
  DashboardSummary, CategorySpend, UserSpend,
} from '@/services/reimbursementV2Service';
import { PALETTE, TINT, PanelHeader, StatCards, RmbStyles, money, StatusTag } from './ui';

export default function DashboardPanel() {
  const perms = usePermission() as any;
  const canRead = perms.canReadReimbursementDashboard || perms.canReadReimbursement || perms.canManageReimbursements;

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [byCat, setByCat] = useState<CategorySpend[]>([]);
  const [byUser, setByUser] = useState<UserSpend[]>([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const from = range?.[0]?.format('YYYY-MM-DD');
    const to = range?.[1]?.format('YYYY-MM-DD');
    try {
      const [s, c, u] = await Promise.all([
        ReimbursementV2Service.reportSummary(from, to),
        ReimbursementV2Service.reportByCategory(from, to),
        ReimbursementV2Service.reportByUser(from, to),
      ]);
      setSummary(s); setByCat(c); setByUser(u);
    } catch (e: any) { message.error(e?.response?.data?.error || 'Failed to load dashboard'); }
    finally { setLoading(false); }
  }, [range]);

  useEffect(() => { if (canRead) load(); }, [canRead, load]);

  const pending = summary?.byStatus.find((b) => b.status === 'pending');
  const paid = summary?.byStatus.find((b) => b.status === 'paid');

  const catCols: ColumnsType<CategorySpend> = [
    { title: 'Category', dataIndex: 'name', render: (v, r) => <div><span style={{ fontWeight: 600 }}>{v}</span> <Tag style={{ fontFamily: 'monospace', marginLeft: 6 }}>{r.code}</Tag></div> },
    { title: 'Claims', dataIndex: 'claims', align: 'center' },
    { title: 'Total (base)', dataIndex: 'total', align: 'right', render: (v) => <span style={{ fontWeight: 600 }}>{money(v)}</span> },
  ];
  const userCols: ColumnsType<UserSpend> = [
    { title: 'Employee', dataIndex: 'name', render: (v, r) => <div><div style={{ fontWeight: 600 }}>{v || r.userId}</div><div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>{r.email || ''}</div></div> },
    { title: 'Claims', dataIndex: 'claims', align: 'center' },
    { title: 'Total (base)', dataIndex: 'total', align: 'right', render: (v) => <span style={{ fontWeight: 600 }}>{money(v)}</span> },
  ];

  if (!canRead) return <div className="rvp-empty">You don’t have permission to view the dashboard.</div>;

  return (
    <div className="rvp">
      <PanelHeader
        icon={<DashIcon size={18} />} color={PALETTE.blue} tint={TINT.blue}
        title="Reimbursement Dashboard" subtitle="Spend, pending and settlement at a glance"
        onRefresh={load} loading={loading}
      >
        <DatePicker.RangePicker value={range as any} onChange={(v) => setRange(v as any)} format="YYYY-MM-DD" allowClear />
      </PanelHeader>

      <StatCards cells={[
        { label: 'Total claims', value: summary?.totals.count ?? 0, icon: <FileTextOutlined />, color: PALETTE.blue, tint: TINT.blue },
        { label: 'Total value (base)', value: money(summary?.totals.total ?? 0), icon: <DollarOutlined />, color: PALETTE.violet, tint: TINT.violet },
        { label: 'Pending', value: `${pending?.count ?? 0} · ${money(pending?.total ?? 0)}`, icon: <ClockCircleOutlined />, color: PALETTE.amber, tint: TINT.amber },
        { label: 'Paid', value: `${paid?.count ?? 0} · ${money(paid?.total ?? 0)}`, icon: <CheckCircleOutlined />, color: PALETTE.green, tint: TINT.green },
      ]} />

      {summary && summary.byStatus.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {summary.byStatus.map((b) => (
            <span key={b.status} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', border: '1px solid var(--border-slate-200)', borderRadius: 999 }}>
              <StatusTag status={b.status} /> <b>{b.count}</b> <span style={{ color: 'var(--text-slate-500)' }}>{money(b.total)}</span>
            </span>
          ))}
        </div>
      )}

      <Row gutter={16} className="rvp-dashboard-cards">
        <Col xs={24} lg={12}>
          <Card size="small" title="Spend by category" style={{ marginBottom: 16, borderRadius: 0 }}>
            <Table rowKey="categoryId" size="small" loading={loading} columns={catCols} dataSource={byCat} pagination={{ pageSize: 8, hideOnSinglePage: true }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="Spend by employee" style={{ marginBottom: 16, borderRadius: 0 }}>
            <Table rowKey="userId" size="small" loading={loading} columns={userCols} dataSource={byUser} pagination={{ pageSize: 8, hideOnSinglePage: true }} />
          </Card>
        </Col>
      </Row>
      <RmbStyles />
      <style>{`
        .rvp-dashboard-cards .ant-table {
          border-radius: 0 !important;
        }
        .rvp-dashboard-cards .ant-table-container {
          border-radius: 0 !important;
        }
        .rvp-dashboard-cards .ant-table-thead > tr > th:first-child,
        .rvp-dashboard-cards .ant-table-thead > tr > th:last-child,
        .rvp-dashboard-cards .ant-table-container > .ant-table-content > table > thead > tr > th:first-child,
        .rvp-dashboard-cards .ant-table-container > .ant-table-content > table > thead > tr > th:last-child {
          border-radius: 0 !important;
        }
      `}</style>
    </div>
  );
}
