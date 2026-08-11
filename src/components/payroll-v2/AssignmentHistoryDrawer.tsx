'use client';
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React, { useEffect, useState } from 'react';
import { Drawer, Button, Tag, Avatar, message, Empty } from 'antd';
import { CloseOutlined, HistoryOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import PayrollV2Service, { MemberOption, EmployeeAssignmentListItem } from '@/services/payrollV2Service';


const PALETTE = { slate: '#64748B', green: '#10B981', red: '#EF4444', blue: '#3B82F6' } as const;
const TINT = { slate: 'rgba(100,116,139,0.12)', green: 'rgba(16,185,129,0.10)' } as const;

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const money = (n: number) => `₹${inr.format(Math.round(n))}`;
const initials = (name: string) => name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

export default function AssignmentHistoryDrawer({
  open, employee, onClose }: {
  open: boolean;
  employee: MemberOption | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<EmployeeAssignmentListItem[]>([]);

  useEffect(() => {
    if (!open || !employee) return;
    setLoading(true);
    PayrollV2Service.getAssignmentHistory(employee.value)
      .then(setRows)
      .catch(() => message.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, [open, employee]);

  // rows are newest-first; delta is vs the chronologically previous (next in array).
  const deltaOf = (i: number): number | null => {
    const prev = rows[i + 1];
    if (!prev) return null;
    return rows[i].monthlyCtc - prev.monthlyCtc;
  };

  return (
    <Drawer title={null} open={open} onClose={onClose} width={560} closable={false} destroyOnClose
      styles={{ body: { padding: 0 }, header: { display: 'none' }, mask: { backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.45)' } }}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-pure-white)' }}>
        <div className="ahd-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <Avatar size={40} src={employee?.avatarUrl || undefined} style={{ background: TINT.slate, color: PALETTE.slate, fontWeight: 700, flexShrink: 0 }}>
              {employee && !employee.avatarUrl && initials(employee.label)}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <div className="ahd-title">{employee?.label}</div>
              <div className="ahd-sub"><HistoryOutlined /> Compensation history</div>
            </div>
          </div>
          <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={onClose} />
        </div>

        <div className="ahd-body">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><LoadingSpinner fullScreen={false} /></div>
          ) : rows.length === 0 ? (
            <Empty description="No salary assignments yet" style={{ marginTop: 48 }} />
          ) : (
            <div className="ahd-timeline">
              {rows.map((r, i) => {
                const delta = deltaOf(i);
                return (
                  <div key={r.id} className="ahd-item">
                    <div className="ahd-rail">
                      <div className="ahd-dot" style={{ background: r.isActive ? PALETTE.green : PALETTE.slate }} />
                      {i < rows.length - 1 && <div className="ahd-line" />}
                    </div>
                    <div className={`ahd-content ${r.isActive ? 'is-current' : ''}`}>
                      <div className="ahd-row1">
                        <span className="ahd-ctc">{money(r.monthlyCtc)}<span className="ahd-mo">/mo</span></span>
                        {r.isActive ? <Tag color="green">Current</Tag> : <Tag>Superseded</Tag>}
                        {delta != null && delta !== 0 && (
                          <span className="ahd-delta" style={{ color: delta > 0 ? PALETTE.green : PALETTE.red }}>
                            {delta > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {money(Math.abs(delta))}
                          </span>
                        )}
                      </div>
                      <div className="ahd-row2">
                        {r.structureName && <Tag color="geekblue" style={{ marginInlineEnd: 6 }}>{r.structureName}</Tag>}
                        <span className="ahd-meta">Effective {r.effectiveFrom} · {money(r.annualCtc)}/yr</span>
                      </div>
                      {r.notes && <div className="ahd-notes">{r.notes}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .ahd-head { padding: 16px 18px 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-pure-white); position: sticky; top: 0; z-index: 10; }
        .ahd-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); line-height: 1.2; }
        .ahd-sub { font-size: 12px; color: var(--text-slate-500); font-weight: 500; display: inline-flex; align-items: center; gap: 5px; }
        .ahd-sub .anticon { color: var(--text-slate-400); }
        .ahd-body { padding: 18px; flex: 1; overflow-y: auto; background: var(--bg-secondary, #f8fafc); }
        .ahd-timeline { display: flex; flex-direction: column; }
        .ahd-item { display: flex; gap: 12px; }
        .ahd-rail { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
        .ahd-dot { width: 12px; height: 12px; border-radius: 50%; margin-top: 14px; box-shadow: 0 0 0 3px var(--bg-secondary, #f8fafc); }
        .ahd-line { flex: 1; width: 2px; background: var(--border-slate-200); margin: 2px 0; }
        .ahd-content { flex: 1; min-width: 0; border: 1px solid var(--border-slate-200); border-radius: 10px; background: var(--bg-pure-white); padding: 12px 14px; margin-bottom: 12px; transition: border-color .12s ease, box-shadow .12s ease; }
        .ahd-content:hover { box-shadow: 0 1px 3px rgba(15,23,42,0.06); }
        .ahd-content.is-current { border-color: rgba(16,185,129,0.40); box-shadow: 0 0 0 3px rgba(16,185,129,0.06); }
        .ahd-row1 { display: flex; align-items: center; gap: 8px; }
        .ahd-ctc { font-size: 16px; font-weight: 800; color: var(--text-slate-900); }
        .ahd-mo { font-size: 11px; font-weight: 600; color: var(--text-slate-400); margin-left: 2px; }
        .ahd-delta { font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 3px; margin-left: auto; }
        .ahd-row2 { margin-top: 5px; }
        .ahd-meta { font-size: 12px; color: var(--text-slate-500); }
        .ahd-notes { margin-top: 6px; font-size: 12px; color: var(--text-slate-600); background: var(--bg-slate-50); border: 1px solid var(--border-slate-100); border-radius: 6px; padding: 6px 9px; }
      `}</style>
    </Drawer>
  );
}
