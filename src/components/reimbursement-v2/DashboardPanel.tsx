'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Table, Tag, DatePicker, message, Row, Col, Tooltip, Avatar } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import {
  LayoutDashboard as DashIcon,
  CheckCircle2,
  Clock,
  FileEdit,
  Wallet,
  XCircle,
  PieChart,
  Users,
  Award,
  TrendingUp,
} from 'lucide-react';
import { ReloadOutlined } from '@ant-design/icons';
import NoData from "@/components/common/NoData";
import { usePermission } from '@/hooks/usePermission';
import ReimbursementV2Service, {
  DashboardSummary,
  CategorySpend,
  UserSpend,
} from '@/services/reimbursementV2Service';
import { money } from './ui';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

// Strictly Green, Blue, Red
const PALETTE_3 = {
  green: '#059669',
  greenBg: '#ecfdf5',
  greenBorder: '#a7f3d0',
  greenDarkBg: 'rgba(5, 150, 105, 0.16)',
  greenDarkBorder: 'rgba(5, 150, 105, 0.32)',

  blue: '#2563eb',
  blueBg: '#eff6ff',
  blueBorder: '#bfdbfe',
  blueDarkBg: 'rgba(37, 99, 235, 0.16)',
  blueDarkBorder: 'rgba(37, 99, 235, 0.32)',

  red: '#dc2626',
  redBg: '#fef2f2',
  redBorder: '#fecaca',
  redDarkBg: 'rgba(220, 38, 38, 0.16)',
  redDarkBorder: 'rgba(220, 38, 38, 0.32)',
} as const;

const THEME_3_COLORS = [PALETTE_3.blue, PALETTE_3.green, PALETTE_3.red];

function getThemeColor(idx: number): string {
  return THEME_3_COLORS[idx % THEME_3_COLORS.length];
}

function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return THEME_3_COLORS[Math.abs(hash) % THEME_3_COLORS.length];
}

function getInitials(name?: string | null, email?: string | null): string {
  const src = (name || email || '').trim();
  if (!src) return '?';
  const parts = src.split(/\s+|@/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return <span className="rvp-rank-badge rvp-rank-blue" title={`Top ${rank}`}>{rank}</span>;
  }
  return <span className="rvp-rank-badge rvp-rank-slate">{rank}</span>;
}

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
      setSummary(s);
      setByCat(c);
      setByUser(u);
    } catch (e: any) {
      message.error(e?.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    if (canRead) load();
  }, [canRead, load]);

  // Totals & Status Buckets
  const totalClaims = summary?.totals.count || 0;
  const totalSpend = summary?.totals.total || 0;

  const approvedBucket = summary?.byStatus.find((b) => b.status === 'approved') || { status: 'approved', count: 0, total: 0 };
  const pendingBucket = summary?.byStatus.find((b) => b.status === 'pending' || b.status === 'submitted') || { status: 'pending', count: 0, total: 0 };
  const draftBucket = summary?.byStatus.find((b) => b.status === 'draft') || { status: 'draft', count: 0, total: 0 };
  const paidBucket = summary?.byStatus.find((b) => b.status === 'paid') || { status: 'paid', count: 0, total: 0 };
  const rejectedBucket = summary?.byStatus.find((b) => b.status === 'rejected') || { status: 'rejected', count: 0, total: 0 };

  // Status Cards: Approved, Pending, Draft, Paid (STRICTLY GREEN, BLUE, RED)
  const statusCards = useMemo(() => {
    const list = [
      {
        key: 'approved',
        title: 'Approved Claims',
        count: approvedBucket.count,
        total: approvedBucket.total,
        color: PALETTE_3.green,
        bgTint: PALETTE_3.greenBg,
        borderColor: PALETTE_3.greenBorder,
        darkBg: PALETTE_3.greenDarkBg,
        darkBorder: PALETTE_3.greenDarkBorder,
        icon: CheckCircle2,
        scopeText: 'Ready for payout • Approved',
      },
      {
        key: 'pending',
        title: 'Pending Approval',
        count: pendingBucket.count,
        total: pendingBucket.total,
        color: PALETTE_3.blue,
        bgTint: PALETTE_3.blueBg,
        borderColor: PALETTE_3.blueBorder,
        darkBg: PALETTE_3.blueDarkBg,
        darkBorder: PALETTE_3.blueDarkBorder,
        icon: Clock,
        scopeText: 'Awaiting manager review • In Queue',
      },
      {
        key: 'draft',
        title: 'Draft Claims',
        count: draftBucket.count,
        total: draftBucket.total,
        color: PALETTE_3.red,
        bgTint: PALETTE_3.redBg,
        borderColor: PALETTE_3.redBorder,
        darkBg: PALETTE_3.redDarkBg,
        darkBorder: PALETTE_3.redDarkBorder,
        icon: FileEdit,
        scopeText: 'Unsubmitted expense reports • Draft',
      },
      {
        key: 'paid',
        title: 'Paid & Settled',
        count: paidBucket.count,
        total: paidBucket.total,
        color: PALETTE_3.green,
        bgTint: PALETTE_3.greenBg,
        borderColor: PALETTE_3.greenBorder,
        darkBg: PALETTE_3.greenDarkBg,
        darkBorder: PALETTE_3.greenDarkBorder,
        icon: Wallet,
        scopeText: 'Disbursed to employees • Settled',
      },
    ];

    if (rejectedBucket.count > 0) {
      list.push({
        key: 'rejected',
        title: 'Rejected Claims',
        count: rejectedBucket.count,
        total: rejectedBucket.total,
        color: PALETTE_3.red,
        bgTint: PALETTE_3.redBg,
        borderColor: PALETTE_3.redBorder,
        darkBg: PALETTE_3.redDarkBg,
        darkBorder: PALETTE_3.redDarkBorder,
        icon: XCircle,
        scopeText: 'Declined by approver • Rejected',
      });
    }

    return list;
  }, [approvedBucket, pendingBucket, draftBucket, paidBucket, rejectedBucket]);

  // Category aggregates & sorting
  const totalCatSpend = useMemo(() => byCat.reduce((acc, c) => acc + (Number(c.total) || 0), 0), [byCat]);
  const sortedCat = useMemo(() => [...byCat].sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0)), [byCat]);

  // Employee aggregates & sorting
  const totalUserSpend = useMemo(() => byUser.reduce((acc, u) => acc + (Number(u.total) || 0), 0), [byUser]);
  const sortedUser = useMemo(() => [...byUser].sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0)), [byUser]);

  // Category columns (optimized widths, only blue color, no progress bar)
  const catCols: ColumnsType<CategorySpend> = useMemo(() => [
    {
      title: '#',
      key: 'rank',
      width: 40,
      align: 'center',
      render: (_, __, idx) => <RankBadge rank={idx + 1} />,
    },
    {
      title: 'Category',
      dataIndex: 'name',
      render: (v, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: PALETTE_3.blue,
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 650, color: 'var(--text-slate-900, #0f172a)' }}>{v}</span>
            {r.code && <Tag className="rvp-code-tag" style={{ marginLeft: 6 }}>{r.code}</Tag>}
          </div>
        </div>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      align: 'right',
      width: 95,
      render: (v) => <span style={{ fontWeight: 700, color: 'var(--text-slate-900, #0f172a)' }}>{money(v)}</span>,
    },
    {
      title: 'Claims',
      dataIndex: 'claims',
      align: 'center',
      width: 100,
      render: (v) => <span className="rvp-claims-pill">{v} {v === 1 ? 'claim' : 'claims'}</span>,
    },
    {
      title: 'Share',
      key: 'share',
      width: 75,
      align: 'right',
      render: (_, r) => {
        const pct = totalCatSpend > 0 ? Math.round(((Number(r.total) || 0) / totalCatSpend) * 100) : 0;
        return <span style={{ fontWeight: 650, color: PALETTE_3.blue, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>;
      },
    },
  ], [totalCatSpend]);

  // Employee columns (optimized widths, only blue color, no progress bar)
  const userCols: ColumnsType<UserSpend> = useMemo(() => [
    {
      title: '#',
      key: 'rank',
      width: 40,
      align: 'center',
      render: (_, __, idx) => <RankBadge rank={idx + 1} />,
    },
    {
      title: 'Employee',
      dataIndex: 'name',
      render: (v, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <Avatar
            size={28}
            src={r.avatarUrl || r.avatar || undefined}
            style={{
              backgroundColor: PALETTE_3.blue,
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 10.5,
              flexShrink: 0,
            }}
          >
            {getInitials(v, r.email)}
          </Avatar>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontWeight: 650, color: 'var(--text-slate-900, #0f172a)', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {v || r.userId}
            </div>
            {r.email && (
              <div style={{ fontSize: 11, color: 'var(--text-slate-500, #64748b)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.email}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      align: 'right',
      width: 95,
      render: (v) => <span style={{ fontWeight: 700, color: 'var(--text-slate-900, #0f172a)' }}>{money(v)}</span>,
    },
    {
      title: 'Claims',
      dataIndex: 'claims',
      align: 'center',
      width: 100,
      render: (v) => <span className="rvp-claims-pill">{v} {v === 1 ? 'claim' : 'claims'}</span>,
    },
    {
      title: 'Share',
      key: 'share',
      width: 75,
      align: 'right',
      render: (_, r) => {
        const pct = totalUserSpend > 0 ? Math.round(((Number(r.total) || 0) / totalUserSpend) * 100) : 0;
        return <span style={{ fontWeight: 650, color: PALETTE_3.blue, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>;
      },
    },
  ], [totalUserSpend]);

  if (!canRead) {
    return <div className="rvp-empty">You don’t have permission to view the dashboard.</div>;
  }

  return (
    <div className="rvp-dashboard-root">
      {/* ── FIXED ROBUST HEADER (Single-row flexbox layout) ── */}
      <header className="rvp-dashboard-header">
        <div className="rvp-dash-head-left">
          <div className="rvp-dash-head-icon">
            <DashIcon size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="rvp-dash-head-title">Reimbursement Dashboard</h1>
            <div className="rvp-dash-head-sub">Spend analytics, settlement pipelines & claims breakdown</div>
          </div>
        </div>
        <div className="rvp-dash-head-right">
          <Tooltip title="Refresh timeline">
            <button
              type="button"
              className={`rvp-dash-refresh-btn${loading ? ' is-spin' : ''}`}
              onClick={load}
              aria-label="Refresh"
            >
              <ReloadOutlined style={{ fontSize: 13 }} />
            </button>
          </Tooltip>
          <DatePicker.RangePicker
            value={range as any}
            onChange={(v) => setRange(v as any)}
            format="YYYY-MM-DD"
            allowClear
            className="rvp-dash-range-picker"
          />
        </div>
      </header>

      <div className="rvp-dashboard-body">
        {/* ── 1. MY BALANCE CARDS: APPROVED, PENDING, DRAFT, PAID (STRICTLY GREEN, BLUE, RED) ── */}
        <div className="rvp-section-head">
          <div className="rvp-section-title-wrap">
            <span className="rvp-section-title">Claim Status Breakdown</span>
            <span className="rvp-count-chip">{totalClaims} {totalClaims === 1 ? 'claim' : 'claims'}</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-slate-500, #64748b)', fontWeight: 500 }}>
            Total Value: <strong style={{ color: 'var(--text-slate-900, #0f172a)' }}>{money(totalSpend)}</strong>
          </span>
        </div>

        <div className="dept-cards-grid">
          {statusCards.map((card) => {
            const Icon = card.icon;
            const count = card.count;
            const totalVal = card.total;
            const pct = totalClaims > 0 ? Math.min(100, Math.round((count / totalClaims) * 100)) : 0;
            const spendSharePct = totalSpend > 0 ? Math.round((totalVal / totalSpend) * 100) : 0;

            return (
              <div
                key={card.key}
                className="dept-card"
                style={{
                  ['--dept-color' as any]: card.color,
                  ['--dept-bg' as any]: card.bgTint,
                  ['--dept-border' as any]: card.borderColor,
                  ['--dept-dark-bg' as any]: card.darkBg,
                  ['--dept-dark-border' as any]: card.darkBorder,
                }}
              >
                <div className="dept-card-top">
                  <div className="dept-card-icon">
                    <Icon size={18} />
                  </div>
                  <span className="dept-card-badge">
                    {money(totalVal)}
                  </span>
                </div>

                <div className="dept-card-body">
                  <h4 className="dept-card-title">{card.title}</h4>
                  <p className="dept-card-desc">
                    {count > 0
                      ? `${count} ${count === 1 ? 'claim' : 'claims'} · ${spendSharePct}% of spend`
                      : `0 claims · ${money(0)}`}
                  </p>
                  <div className="dept-card-progress-track">
                    <div
                      className="dept-card-progress-bar"
                      style={{ width: `${pct}%`, background: card.color }}
                    />
                  </div>
                </div>

                <div className="dept-card-footer">
                  <span className="dept-card-scope">
                    {card.scopeText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 2. ENHANCED TABLES: SPEND BY CATEGORY & SPEND BY EMPLOYEE (STRICTLY GREEN, BLUE, RED) ── */}
        <div className="rvp-dashboard-cards-wrap">
          <Row gutter={16}>
            {/* Spend by Category Card */}
            <Col xs={24} lg={12}>
              <div className="rvp-enhanced-card">
                <div className="rvp-enhanced-card-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="rvp-card-head-icon" style={{ background: PALETTE_3.blueBg, color: PALETTE_3.blue }}>
                      <PieChart size={18} />
                    </div>
                    <div>
                      <h3 className="rvp-card-head-title">Spend by Category</h3>
                      <div className="rvp-card-head-sub">
                        {sortedCat.length} categories · Total {money(totalCatSpend)}
                      </div>
                    </div>
                  </div>
                  {sortedCat.length > 0 && (
                    <span className="rvp-top-chip-blue" title="Top category by expense volume">
                      <TrendingUp size={12} style={{ color: PALETTE_3.blue }} />
                      <span>Top: <strong>{sortedCat[0].name}</strong> ({money(sortedCat[0].total)})</span>
                    </span>
                  )}
                </div>

                <ZukvoLoadingOverlay loading={loading} message="">
                  <Table
                    rowKey="categoryId"
                    size="small"
                    columns={catCols}
                    dataSource={sortedCat}
                    pagination={{ pageSize: 8, hideOnSinglePage: true }}
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: <NoData description="No category spend recorded yet" /> }}
                    className="rvp-clean-table"
                  />
                </ZukvoLoadingOverlay>
              </div>
            </Col>

            {/* Spend by Employee Card */}
            <Col xs={24} lg={12}>
              <div className="rvp-enhanced-card">
                <div className="rvp-enhanced-card-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="rvp-card-head-icon" style={{ background: PALETTE_3.blueBg, color: PALETTE_3.blue }}>
                      <Users size={18} />
                    </div>
                    <div>
                      <h3 className="rvp-card-head-title">Spend by Employee</h3>
                      <div className="rvp-card-head-sub">
                        {sortedUser.length} claimants · Total {money(totalUserSpend)}
                      </div>
                    </div>
                  </div>
                  {sortedUser.length > 0 && (
                    <span className="rvp-top-chip-blue" title="Top claimant by expense volume">
                      <Award size={12} style={{ color: PALETTE_3.blue }} />
                      <span>Top: <strong>{sortedUser[0].name || sortedUser[0].userId}</strong> ({money(sortedUser[0].total)})</span>
                    </span>
                  )}
                </div>

                <ZukvoLoadingOverlay loading={loading} message="">
                  <Table
                    rowKey="userId"
                    size="small"
                    columns={userCols}
                    dataSource={sortedUser}
                    pagination={{ pageSize: 8, hideOnSinglePage: true }}
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: <NoData description="No employee claims recorded yet" /> }}
                    className="rvp-clean-table"
                  />
                </ZukvoLoadingOverlay>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      <style>{`
        .rvp-dashboard-root {
          display: flex;
          flex-direction: column;
          flex: 1;
          height: 100%;
          max-height: 100%;
          min-height: 0;
          overflow-y: auto !important;
          overflow-x: hidden;
          background: var(--bg-slate-50, #f8fafc);
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .rvp-dashboard-root::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .rvp-dashboard-root::-webkit-scrollbar-track {
          background: transparent;
        }
        .rvp-dashboard-root::-webkit-scrollbar-thumb {
          background: var(--border-slate-300, #cbd5e1);
          border-radius: 999px;
        }
        .rvp-dashboard-root::-webkit-scrollbar-thumb:hover {
          background: var(--text-slate-400, #94a3b8);
        }
        [data-theme='dark'] .rvp-dashboard-root {
          background: #0b0f19;
        }
        [data-theme='dark'] .rvp-dashboard-root::-webkit-scrollbar-thumb {
          background: #334155;
        }

        /* ── FIXED STICKY HEADER ── */
        .rvp-dashboard-header {
          position: sticky;
          top: 0;
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 22px;
          background: var(--bg-pure-white, #ffffff);
          border-bottom: 1px solid var(--border-slate-200, #e2e8f0);
          flex-shrink: 0;
        }
        [data-theme='dark'] .rvp-dashboard-header {
          background: #111720;
          border-bottom-color: #1f2937;
        }
        .rvp-dash-head-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .rvp-dash-head-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        [data-theme='dark'] .rvp-dash-head-icon {
          background: rgba(37, 99, 235, 0.16);
          border-color: rgba(37, 99, 235, 0.3);
          color: #60a5fa;
        }
        .rvp-dash-head-title {
          font-size: 16.5px;
          font-weight: 750;
          color: var(--text-slate-900, #0f172a);
          margin: 0;
          letter-spacing: -0.015em;
          line-height: 1.2;
        }
        [data-theme='dark'] .rvp-dash-head-title {
          color: #f1f5f9;
        }
        .rvp-dash-head-sub {
          font-size: 12px;
          color: var(--text-slate-500, #64748b);
          font-weight: 500;
          margin-top: 2px;
        }
        [data-theme='dark'] .rvp-dash-head-sub {
          color: #94a3b8;
        }
        .rvp-dash-head-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .rvp-dash-refresh-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border-slate-200, #e2e8f0);
          background: var(--bg-pure-white, #ffffff);
          color: var(--text-slate-600, #475569);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .rvp-dash-refresh-btn:hover {
          border-color: #2563eb;
          color: #2563eb;
          background: #eff6ff;
        }
        [data-theme='dark'] .rvp-dash-refresh-btn {
          background: #1e293b;
          border-color: #334155;
          color: #94a3b8;
        }
        [data-theme='dark'] .rvp-dash-refresh-btn:hover {
          border-color: #60a5fa;
          color: #60a5fa;
          background: #1e293b;
        }
        .rvp-dash-refresh-btn.is-spin svg {
          animation: rvp-spin 0.9s linear infinite;
        }
        @keyframes rvp-spin { to { transform: rotate(360deg); } }

        /* ── BODY AREA ── */
        .rvp-dashboard-body {
          flex: 1 0 auto;
          display: flex;
          flex-direction: column;
          min-height: 0;
          padding-top: 4px;
          padding-bottom: 40px;
        }

        /* ── SECTION HEADER ── */
        .rvp-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 22px 10px;
          flex-shrink: 0;
        }
        .rvp-section-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rvp-section-title {
          font-size: 13.5px;
          font-weight: 750;
          color: var(--text-slate-900, #0f172a);
          letter-spacing: -0.01em;
        }
        [data-theme='dark'] .rvp-section-title {
          color: #f1f5f9;
        }
        .rvp-count-chip {
          font-size: 11px;
          font-weight: 700;
          padding: 1.5px 8px;
          border-radius: 999px;
          background: var(--bg-slate-100, #f1f5f9);
          color: var(--text-slate-600, #475569);
          border: 1px solid var(--border-slate-200, #e2e8f0);
        }
        [data-theme='dark'] .rvp-count-chip {
          background: #1e293b;
          color: #94a3b8;
          border-color: #334155;
        }

        /* ── MY BALANCES CARDS GRID (Exact match to Leaves Dashboard) ── */
        .dept-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          padding: 0 22px 18px;
          flex-shrink: 0;
        }
        @media (max-width: 1200px) {
          .dept-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .dept-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        .dept-card {
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 12px;
          background: var(--bg-pure-white, #ffffff);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 148px;
          min-height: 148px;
          max-height: 148px;
          cursor: default;
          position: relative;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          text-align: left;
          box-sizing: border-box;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .dept-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -4px rgba(15, 23, 42, 0.08);
          border-color: var(--border-slate-300, #cbd5e1);
        }
        [data-theme="dark"] .dept-card {
          background: #111720 !important;
          border-color: #1f2937 !important;
        }
        [data-theme="dark"] .dept-card:hover {
          border-color: #374151 !important;
          box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.35);
        }

        .dept-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          flex-shrink: 0;
        }
        .dept-card-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: var(--dept-bg);
          color: var(--dept-color);
          border: 1px solid transparent;
        }
        .dept-card-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2.5px 9px;
          border-radius: 20px;
          letter-spacing: 0.02em;
          line-height: 1.2;
          background: var(--dept-bg);
          color: var(--dept-color);
          border: 1px solid transparent;
        }

        [data-theme="dark"] .dept-card-icon {
          background: var(--dept-dark-bg, rgba(255, 255, 255, 0.06)) !important;
          color: var(--dept-color) !important;
          border-color: var(--dept-dark-border, rgba(255, 255, 255, 0.12)) !important;
        }
        [data-theme="dark"] .dept-card-badge {
          background: var(--dept-dark-bg, rgba(255, 255, 255, 0.06)) !important;
          color: var(--dept-color) !important;
          border-color: var(--dept-dark-border, rgba(255, 255, 255, 0.12)) !important;
        }

        .dept-card-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          justify-content: center;
          min-height: 0;
          overflow: hidden;
        }
        .dept-card-title {
          font-size: 14.5px;
          font-weight: 700;
          color: var(--text-slate-900, #0f172a);
          margin: 0;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.25;
        }
        [data-theme="dark"] .dept-card-title {
          color: #f1f5f9;
        }
        .dept-card-desc {
          font-size: 11.5px;
          color: var(--text-slate-500, #64748b);
          margin: 1px 0 0;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        [data-theme="dark"] .dept-card-desc {
          color: #94a3b8;
        }
        .dept-card-progress-track {
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: var(--bg-slate-100, #f1f5f9);
          overflow: hidden;
          margin-top: 5px;
          flex-shrink: 0;
        }
        [data-theme="dark"] .dept-card-progress-track {
          background: #1e293b;
        }
        .dept-card-progress-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .dept-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 1px solid var(--border-slate-100, #f1f5f9);
          margin-top: auto;
          white-space: nowrap;
          overflow: hidden;
          flex-shrink: 0;
          height: 24px;
          box-sizing: border-box;
        }
        [data-theme="dark"] .dept-card-footer {
          border-top-color: #1f2937;
        }
        .dept-card-scope {
          font-size: 11px;
          color: var(--text-slate-400, #94a3b8);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          line-height: 1;
        }
        [data-theme="dark"] .dept-card-scope {
          color: #94a3b8;
        }

        /* ── ENHANCED TABLES & CARDS (Spend by Category & Employee) ── */
        .rvp-dashboard-cards-wrap {
          padding: 0 22px 24px;
          flex: 1;
        }
        .rvp-enhanced-card {
          border: 1px solid var(--border-slate-200, #e2e8f0);
          border-radius: 12px;
          background: var(--bg-pure-white, #ffffff);
          margin-bottom: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .rvp-enhanced-card:hover {
          box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.06);
          border-color: var(--border-slate-300, #cbd5e1);
        }
        [data-theme='dark'] .rvp-enhanced-card {
          background: #111720 !important;
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .rvp-enhanced-card:hover {
          border-color: #374151 !important;
        }

        .rvp-enhanced-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 18px;
          border-bottom: 1px solid var(--border-slate-100, #f1f5f9);
          gap: 12px;
          flex-wrap: wrap;
        }
        [data-theme='dark'] .rvp-enhanced-card-head {
          border-bottom-color: #1f2937;
        }

        .rvp-card-head-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .rvp-card-head-title {
          font-size: 14.5px;
          font-weight: 750;
          color: var(--text-slate-900, #0f172a);
          margin: 0;
          line-height: 1.25;
          letter-spacing: -0.01em;
        }
        [data-theme='dark'] .rvp-card-head-title {
          color: #f1f5f9;
        }
        .rvp-card-head-sub {
          font-size: 11.5px;
          color: var(--text-slate-500, #64748b);
          margin-top: 2px;
        }
        [data-theme='dark'] .rvp-card-head-sub {
          color: #94a3b8;
        }

        .rvp-top-chip-green {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3.5px 11px;
          border-radius: 999px;
          font-size: 11.5px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #059669;
        }
        [data-theme='dark'] .rvp-top-chip-green {
          background: rgba(5, 150, 105, 0.16);
          border-color: rgba(5, 150, 105, 0.32);
          color: #34d399;
        }

        .rvp-top-chip-blue {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3.5px 11px;
          border-radius: 999px;
          font-size: 11.5px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #2563eb;
        }
        [data-theme='dark'] .rvp-top-chip-blue {
          background: rgba(37, 99, 235, 0.16);
          border-color: rgba(37, 99, 235, 0.32);
          color: #60a5fa;
        }

        .rvp-stack-bar-wrap {
          padding: 9px 18px;
          background: var(--bg-slate-50, #f8fafc);
          border-bottom: 1px solid var(--border-slate-100, #f1f5f9);
        }
        [data-theme='dark'] .rvp-stack-bar-wrap {
          background: rgba(255, 255, 255, 0.02);
          border-bottom-color: #1f2937;
        }
        .rvp-stack-bar {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--bg-slate-200, #e2e8f0);
          overflow: hidden;
          display: flex;
          gap: 1.5px;
        }
        [data-theme='dark'] .rvp-stack-bar {
          background: #1e293b;
        }
        .rvp-stack-segment {
          height: 100%;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        .rvp-stack-segment:hover {
          opacity: 0.8;
        }

        /* ── TABLE STYLING (Keep horizontal scroll, hide scrollbar UI) ── */
        .rvp-clean-table,
        .rvp-clean-table .ant-table,
        .rvp-clean-table .ant-table-container,
        .rvp-clean-table .ant-table-content,
        .rvp-clean-table .ant-table-body {
          overflow-x: auto !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .rvp-clean-table::-webkit-scrollbar,
        .rvp-clean-table .ant-table::-webkit-scrollbar,
        .rvp-clean-table .ant-table-container::-webkit-scrollbar,
        .rvp-clean-table .ant-table-content::-webkit-scrollbar,
        .rvp-clean-table .ant-table-body::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .rvp-clean-table .ant-table {
          background: transparent !important;
          border-radius: 0 !important;
        }
        .rvp-clean-table .ant-table-container {
          border-radius: 0 !important;
        }
        .rvp-clean-table .ant-pagination {
          margin: 12px 14px !important;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
        }
        .rvp-clean-table .ant-table-thead > tr > th,
        .rvp-clean-table .ant-table-thead > tr > th:first-child,
        .rvp-clean-table .ant-table-thead > tr > th:last-child,
        .rvp-clean-table .ant-table-thead > tr:first-child > th:first-child,
        .rvp-clean-table .ant-table-thead > tr:first-child > th:last-child {
          border-radius: 0 !important;
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
          border-top-left-radius: 0 !important;
          border-top-right-radius: 0 !important;
          background: var(--bg-slate-50, #f8fafc) !important;
          color: var(--text-slate-500, #64748b) !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 9px 14px !important;
          border-bottom: 1px solid var(--border-slate-200, #e2e8f0) !important;
        }
        [data-theme='dark'] .rvp-clean-table .ant-table-thead > tr > th,
        [data-theme='dark'] .rvp-clean-table .ant-table-thead > tr > th:first-child,
        [data-theme='dark'] .rvp-clean-table .ant-table-thead > tr > th:last-child {
          background: #161f2e !important;
          border-bottom-color: #1f2937 !important;
          color: #94a3b8 !important;
        }
        .rvp-clean-table .ant-table-tbody > tr > td {
          padding: 9px 14px !important;
          border-bottom: 1px solid var(--border-slate-100, #f1f5f9) !important;
          font-size: 12.5px;
          white-space: nowrap;
        }
        [data-theme='dark'] .rvp-clean-table .ant-table-tbody > tr > td {
          border-bottom-color: #1f2937 !important;
          color: #e2e8f0 !important;
        }
        .rvp-clean-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-50, #f8fafc) !important;
        }
        [data-theme='dark'] .rvp-clean-table .ant-table-tbody > tr:hover > td {
          background: rgba(255, 255, 255, 0.03) !important;
        }

        /* ── RANK BADGES (Strictly Green, Blue, Red) ── */
        .rvp-rank-badge {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 750;
          line-height: 1;
        }
        .rvp-rank-green {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }
        [data-theme='dark'] .rvp-rank-green {
          background: rgba(5, 150, 105, 0.16);
          border-color: rgba(5, 150, 105, 0.32);
          color: #34d399;
        }
        .rvp-rank-blue {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }
        [data-theme='dark'] .rvp-rank-blue {
          background: rgba(37, 99, 235, 0.16);
          border-color: rgba(37, 99, 235, 0.32);
          color: #60a5fa;
        }
        .rvp-rank-red {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        [data-theme='dark'] .rvp-rank-red {
          background: rgba(220, 38, 38, 0.16);
          border-color: rgba(220, 38, 38, 0.32);
          color: #f87171;
        }
        .rvp-rank-slate {
          background: transparent;
          color: var(--text-slate-400, #94a3b8);
          font-weight: 600;
        }

        .rvp-code-tag {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 10px;
          font-weight: 600;
          padding: 1px 5px;
          border-radius: 4px;
          background: var(--bg-slate-100, #f1f5f9);
          border: 1px solid var(--border-slate-200, #e2e8f0);
          color: var(--text-slate-600, #475569);
        }
        [data-theme='dark'] .rvp-code-tag {
          background: #1e293b;
          border-color: #334155;
          color: #94a3b8;
        }

        .rvp-claims-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
          line-height: 1.2;
        }
        [data-theme='dark'] .rvp-claims-pill {
          background: rgba(37, 99, 235, 0.16);
          color: #93c5fd;
          border-color: rgba(37, 99, 235, 0.32);
        }

        .rvp-mini-progress {
          display: flex;
          align-items: center;
          gap: 7px;
          width: 100%;
        }
        .rvp-mini-bar-track {
          flex: 1;
          height: 4.5px;
          border-radius: 2px;
          background: var(--bg-slate-100, #f1f5f9);
          overflow: hidden;
        }
        [data-theme='dark'] .rvp-mini-bar-track {
          background: #1e293b;
        }
        .rvp-mini-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        .rvp-mini-bar-label {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-slate-500, #64748b);
          width: 28px;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        [data-theme='dark'] .rvp-mini-bar-label {
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
