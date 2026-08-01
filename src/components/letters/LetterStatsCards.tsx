import React from 'react';
import { RiseOutlined } from '@ant-design/icons';

export const AreaSparkline = ({ values, color }: { values: number[]; color: string }) => {
  const w = 96;
  const h = 34;
  const max = Math.max(...values, 1);
  const n = values.length;
  const stepX = n > 1 ? w / (n - 1) : w;
  const pts = values.map((v, i) => {
    const x = i * stepX;
    const y = h - 3 - (v / max) * (h - 8);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `spk-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export interface StatCellData {
  key: string;
  title: string;
  value: string | number;
  suffix: string;
  icon: React.ReactNode;
  color: string;
  tint: string;
  trend: number[];
  delta: number;
}

export function LetterStatsCards({ statCells }: { statCells: StatCellData[] }) {
  if (!statCells || statCells.length === 0) return null;

  return (
    <div className="pp-stats" style={{ padding: '0 0px', marginBottom: '20px' }}>
      {statCells.map((s) => (
        <div key={s.key} className="pp-stat-card">
          <div className="pp-stat-top">
            <div className="pp-stat-left">
              <span className="pp-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
              <span className="pp-stat-label">{s.title}</span>
            </div>
            {s.delta > 0 && (
              <span className="pp-stat-delta"><RiseOutlined style={{ fontSize: 9 }} />+{s.delta}</span>
            )}
          </div>
          <div className="pp-stat-bottom">
            <div className="pp-stat-value-wrap">
              <span className="pp-stat-value">{s.value}{s.suffix}</span>
              <span className="pp-stat-period">this week</span>
            </div>
            <div className="pp-stat-spark"><AreaSparkline values={s.trend} color={s.color} /></div>
          </div>
        </div>
      ))}
      <style jsx>{`
        .pp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .pp-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 12px 14px; min-height: 92px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .pp-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .pp-stat-left { display: flex; align-items: center; gap: 8px; }
        .pp-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .pp-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .pp-stat-delta {
          display: inline-flex; align-items: center; gap: 2px; font-size: 10.5px; font-weight: 700;
          color: #10b981; background: rgba(16,185,129,0.10); border-radius: 6px; padding: 1px 6px;
        }
        .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .pp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .pp-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pp-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
        .pp-stat-spark { opacity: 0.95; }

        @media (max-width: 1100px) {
          .pp-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .pp-stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
