'use client';

import React from 'react';
import Image from 'next/image';
import { Typography, ConfigProvider, theme as antdTheme } from 'antd';
import { useProduct } from '@/context/ProductContext';

const { Title, Text } = Typography;

// Minimal backdrop: charcoal canvas, a whisper of grid, and a few motion lines
// carrying the forward lean of the Zukvo mark. Nothing else.
const backgroundStyles = `
@keyframes zk-streak {
  0%   { transform: translateX(-260px); opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateX(300px); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .zk-anim { animation: none !important; }
}
`;

const SPRINT_STREAKS = [
  { x: 80, y: 190, w: 260, dur: '14s', delay: '0s' },
  { x: 250, y: 430, w: 150, dur: '18s', delay: '5s' },
  { x: 110, y: 660, w: 210, dur: '16s', delay: '2.5s' },
];

function TechBackground() {
  return (
    <div
      aria-hidden
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      {/* Barely-there grid, dissolved toward the edges */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(148, 163, 184, 0.04) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(148, 163, 184, 0.04) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, #000 20%, transparent 78%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 70% at 50% 50%, #000 20%, transparent 78%)',
        }}
      />

      {/* Motion lines on the mark's forward lean */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="zk-streak-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        <g transform="rotate(-7 720 450)">
          {SPRINT_STREAKS.map((streak) => (
            <rect
              key={`${streak.x}-${streak.y}`}
              className="zk-anim"
              x={streak.x}
              y={streak.y}
              width={streak.w}
              height={1.5}
              rx={0.75}
              fill="url(#zk-streak-grad)"
              style={{
                animation: `zk-streak ${streak.dur} linear infinite`,
                animationDelay: streak.delay,
              }}
            />
          ))}
        </g>
      </svg>

      {/* Single soft glow behind the card + edge vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 45% 50% at 50% 48%, rgba(37, 99, 235, 0.14) 0%, transparent 72%),' +
            'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, rgba(3, 6, 12, 0.55) 100%)',
        }}
      />
    </div>
  );
}

// globals.css forces .ant-card / .ant-input backgrounds with !important, so the
// dark surface has to be reasserted at higher specificity under .zk-login.
const formStyles = `
.zk-login .ant-input,
.zk-login .ant-input-affix-wrapper {
  background-color: rgba(148, 163, 184, 0.07) !important;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 999px;
  font-size: 14px;
  padding-left: 20px;
  padding-right: 20px;
  color: #E8EDF5;
}
/* The inner input of an affix wrapper must stay bare, or it renders as a box-in-a-box */
.zk-login .ant-input-affix-wrapper .ant-input {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 0 !important;
  color: #E8EDF5;
}
.zk-login .ant-input-affix-wrapper .ant-input:focus,
.zk-login .ant-input-affix-wrapper .ant-input:hover {
  border: none !important;
  box-shadow: none !important;
}
.zk-login .ant-input::placeholder,
.zk-login .ant-input-affix-wrapper input::placeholder { color: #5A6982 !important; }
.zk-login .ant-input-affix-wrapper:hover,
.zk-login .ant-input:hover { border-color: rgba(148, 163, 184, 0.34); }
.zk-login .ant-input-affix-wrapper:focus-within,
.zk-login .ant-input:focus {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16);
}
.zk-login .ant-form-item-label > label { color: #94A3B8 !important; font-size: 13px; }
.zk-login .ant-checkbox-wrapper { color: #94A3B8; }
.zk-login .ant-btn-primary { box-shadow: 0 8px 22px rgba(37, 99, 235, .32) !important; }
.zk-login input:-webkit-autofill,
.zk-login input:-webkit-autofill:hover,
.zk-login input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #171d27 inset !important;
  -webkit-text-fill-color: #E8EDF5 !important;
  caret-color: #E8EDF5;
}
.zk-submit { transition: transform .2s ease, box-shadow .2s ease; }
.zk-login .zk-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(37, 99, 235, .42) !important;
}
.zk-social { transition: background .2s ease, border-color .2s ease, transform .2s ease; }
.zk-social:hover:not(:disabled) {
  background: rgba(148, 163, 184, .12) !important;
  border-color: rgba(148, 163, 184, .3) !important;
  transform: translateY(-1px);
}
.zk-link:hover { color: #93C5FD !important; }
.zk-login .ant-input-password-icon { color: #5A6982 !important; }
.zk-login .ant-input-password-icon:hover { color: #94A3B8 !important; }
/* Ghost button — the quiet counterpart to .zk-submit */
.zk-login .zk-ghost {
  background: rgba(148, 163, 184, 0.06) !important;
  border-color: rgba(148, 163, 184, 0.16) !important;
  color: #94A3B8 !important;
  box-shadow: none !important;
  transition: background .2s ease, border-color .2s ease, color .2s ease;
}
.zk-login .zk-ghost:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.12) !important;
  border-color: rgba(148, 163, 184, 0.3) !important;
  color: #E8EDF5 !important;
}
@media (prefers-reduced-motion: reduce) {
  .zk-submit, .zk-social { transition: none; }
  .zk-submit:hover, .zk-social:hover { transform: none; }
}
`;

// The auth pages own a fixed dark surface, independent of the user's app theme.
export const authTheme = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: '#3B82F6',
    colorText: '#E8EDF5',
    colorTextSecondary: '#94A3B8',
    colorTextPlaceholder: '#5A6982',
    colorBorder: 'rgba(148, 163, 184, 0.16)',
    borderRadius: 10,
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Input: {
      colorBgContainer: 'rgba(148, 163, 184, 0.07)',
      colorBorder: 'rgba(148, 163, 184, 0.14)',
      hoverBorderColor: 'rgba(148, 163, 184, 0.32)',
      activeBorderColor: '#3B82F6',
      activeShadow: '0 0 0 3px rgba(59, 130, 246, 0.16)',
      controlHeight: 48,
      borderRadius: 999,
    },
    Form: {
      itemMarginBottom: 12,
    },
    Checkbox: {
      colorBgContainer: 'rgba(148, 163, 184, 0.08)',
      colorBorder: 'rgba(148, 163, 184, 0.28)',
    },
    Button: {
      controlHeight: 48,
      borderRadius: 999,
      fontWeight: 600,
    },
  },
};

// Shared primary-button styling so every auth CTA reads the same.
export const authSubmitStyle: React.CSSProperties = {
  fontSize: 15,
  background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
  border: 'none',
  boxShadow: '0 8px 22px rgba(37, 99, 235, 0.32)',
};

interface AuthShellProps {
  /** Optional line under the wordmark, e.g. "Reset your password". */
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * The chrome shared by every auth screen: dark canvas, motion backdrop,
 * Zukvo lockup and footer. Matches the login page exactly.
 */
export default function AuthShell({ subtitle, children }: AuthShellProps) {
  const { brand, manifest, product } = useProduct();

  return (
    <ConfigProvider theme={authTheme}>
      <div
        className="zk-login"
        style={{
          position: 'relative',
          minHeight: '100vh',
          background:
            'linear-gradient(145deg, #090b10 0%, #11151d 45%, #0a0d13 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          overflow: 'hidden',
        }}
      >
        <style>{backgroundStyles + formStyles}</style>
        <TechBackground />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 380,
          }}
        >
          {/* Logo + wordmark lockup.
              The canvas is charcoal, so the mark needs inverting — but only the
              Zukvo one, which is drawn dark-on-light. Testiez ships artwork cut
              for dark surfaces already, and inverting it would wreck it. Where a
              product has real wordmark artwork it is used instead of type,
              because a wordmark is a drawing, not a font. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              marginBottom: subtitle ? 12 : 32,
            }}
          >
            <Image
              src={brand.mark}
              alt=""
              width={44}
              height={44}
              style={{
                objectFit: 'contain',
                filter: product === 'zukvo' ? 'invert(1)' : undefined,
              }}
            />
            {brand.wordmarkLight ? (
              <Image
                src={brand.wordmarkLight}
                alt={manifest.name}
                height={32}
                style={{ objectFit: 'contain', width: 'auto' }}
              />
            ) : (
              <Title
                level={2}
                style={{
                  margin: 0,
                  color: '#F8FAFC',
                  fontWeight: 600,
                  fontSize: 32,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {manifest.name}
              </Title>
            )}
          </div>

          {subtitle && (
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <Text style={{ fontSize: 13, color: '#94A3B8' }}>{subtitle}</Text>
            </div>
          )}

          {children}

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Text style={{ fontSize: 12, color: '#4A566B' }}>
              © {new Date().getFullYear()} {brand.legalName}. All rights reserved.
            </Text>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
