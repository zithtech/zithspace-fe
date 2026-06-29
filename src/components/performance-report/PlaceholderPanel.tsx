'use client';

import React from 'react';
import { Tag } from 'antd';

// Reusable scaffold for Performance Report panels whose backend slice isn't built
// yet. Keeps the master-detail shell fully navigable while each panel is
// implemented one at a time (BE slice → FE panel). Settings ships first.
export default function PlaceholderPanel({
  title,
  subtitle,
  icon,
  bullets,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  bullets?: string[];
}) {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
          {title}
          <Tag color="gold" style={{ marginLeft: 8, verticalAlign: 'middle' }}>Coming soon</Tag>
        </h2>
        <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-slate-500)' }}>{subtitle}</p>
      </div>

      <div
        style={{
          border: '1px dashed var(--border-slate-200)',
          borderRadius: 12,
          padding: '40px 28px',
          background: 'var(--bg-slate-50)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'var(--bg-blue-50)',
            color: '#3B82F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
          }}
        >
          {icon ?? '📊'}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-slate-900)' }}>
          {title} is being built
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-slate-500)', maxWidth: 460 }}>
          Configure what feeds the monthly report on the <strong>Settings</strong> page
          first — this view consumes those settings and drops in next.
        </div>
        {bullets && bullets.length > 0 && (
          <ul
            style={{
              textAlign: 'left',
              margin: '4px auto 0',
              color: 'var(--text-slate-700)',
              fontSize: 12.5,
              lineHeight: 1.9,
              listStyle: 'none',
              padding: 0,
            }}
          >
            {bullets.map((b) => (
              <li key={b}>✓ {b}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
